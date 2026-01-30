/**
 * OpenAI Service Tests
 * 
 * Tests for the OpenAI service including:
 * - Successful generation with valid input
 * - Error handling for OpenAI failures
 * - Retry logic for transient errors
 * - Timeout handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateStructuredOutput,
  generateSlidePlan,
  generateSlideCopy,
  OpenAIError,
  OpenAITimeoutError,
  OpenAIRateLimitError,
  OpenAIValidationError,
  SlidePlanSchema,
  SlideContentSchema,
  SlideCopySchema,
  SlidesCopySchema,
} from './openai';
import { z } from 'zod';

// Mock OpenAI module
const mockCreate = vi.fn();
const mockOpenAI = {
  chat: {
    completions: {
      create: mockCreate,
    },
  },
};

vi.mock('openai', () => {
  return {
    default: vi.fn(function() {
      return mockOpenAI;
    }),
  };
});

// ============================================================================
// Test Setup
// ============================================================================

describe('OpenAI Service', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };

    // Set test environment variables
    process.env.OPENAI_API_KEY = 'sk-test-key-123';
    process.env.OPENAI_MODEL = 'gpt-4-test';

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Successful Generation Tests
  // ============================================================================

  describe('generateStructuredOutput - Success Cases', () => {
    it('should successfully generate valid structured output', async () => {
      // Arrange
      const testSchema = z.object({
        message: z.string(),
        count: z.number(),
      });

      const mockResponse = {
        message: 'Hello, World!',
        count: 42,
      };

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResponse),
            },
          },
        ],
      });

      // Act
      const result = await generateStructuredOutput({
        userMessage: 'Generate test data',
        schema: testSchema,
      });

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4-test',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user', content: 'Generate test data' }),
          ]),
          response_format: { type: 'json_object' },
        })
      );
    });

    it('should use custom system prompt when provided', async () => {
      // Arrange
      const testSchema = z.object({ result: z.string() });
      const customSystemPrompt = 'You are a custom assistant.';

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({ result: 'success' }),
            },
          },
        ],
      });

      // Act
      await generateStructuredOutput({
        systemPrompt: customSystemPrompt,
        userMessage: 'Test',
        schema: testSchema,
      });

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ 
              role: 'system', 
              content: customSystemPrompt 
            }),
          ]),
        })
      );
    });

    it('should respect custom temperature setting', async () => {
      // Arrange
      const testSchema = z.object({ result: z.string() });

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({ result: 'success' }),
            },
          },
        ],
      });

      // Act
      await generateStructuredOutput({
        userMessage: 'Test',
        schema: testSchema,
        temperature: 0.9,
      });

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.9,
        })
      );
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('generateStructuredOutput - Error Handling', () => {
    it('should throw OpenAIError when API key is missing', async () => {
      // Arrange
      delete process.env.OPENAI_API_KEY;
      const testSchema = z.object({ result: z.string() });

      // Act & Assert
      await expect(
        generateStructuredOutput({
          userMessage: 'Test',
          schema: testSchema,
        })
      ).rejects.toThrow('OPENAI_API_KEY environment variable is required');
    });

    it('should throw OpenAIError when response is empty', async () => {
      // Arrange
      const testSchema = z.object({ result: z.string() });

      mockCreate.mockResolvedValue({
        choices: [],
      });

      // Act & Assert
      await expect(
        generateStructuredOutput({
          userMessage: 'Test',
          schema: testSchema,
          enableRetry: false,
        })
      ).rejects.toThrow(OpenAIError);

      await expect(
        generateStructuredOutput({
          userMessage: 'Test',
          schema: testSchema,
          enableRetry: false,
        })
      ).rejects.toThrow('OpenAI returned empty response');
    });

    it('should throw OpenAIValidationError when response is not valid JSON', async () => {
      // Arrange
      const testSchema = z.object({ result: z.string() });

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: 'This is not valid JSON',
            },
          },
        ],
      });

      // Act & Assert
      await expect(
        generateStructuredOutput({
          userMessage: 'Test',
          schema: testSchema,
          enableRetry: false,
        })
      ).rejects.toThrow(OpenAIValidationError);
    });

    it('should throw OpenAIValidationError when response does not match schema', async () => {
      // Arrange
      const testSchema = z.object({
        requiredField: z.string(),
      });

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({ wrongField: 'value' }),
            },
          },
        ],
      });

      // Act & Assert
      await expect(
        generateStructuredOutput({
          userMessage: 'Test',
          schema: testSchema,
          enableRetry: false,
        })
      ).rejects.toThrow(OpenAIValidationError);
    });
  });

  // ============================================================================
  // Retry Logic Tests
  // ============================================================================

  describe('generateStructuredOutput - Retry Logic', () => {
    it('should retry on transient errors (500)', async () => {
      // Arrange
      const testSchema = z.object({ result: z.string() });
      const serverError = { status: 500, message: 'Internal Server Error' };

      // Fail twice, then succeed
      mockCreate
        .mockRejectedValueOnce(serverError)
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({ result: 'success' }),
              },
            },
          ],
        });

      // Act
      const result = await generateStructuredOutput({
        userMessage: 'Test',
        schema: testSchema,
      });

      // Assert
      expect(result).toEqual({ result: 'success' });
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it('should retry on timeout errors', async () => {
      // Arrange
      const testSchema = z.object({ result: z.string() });

      // First call times out (simulate by taking too long)
      mockCreate.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      // Second call succeeds
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({ result: 'success' }),
            },
          },
        ],
      });

      // Act
      const result = await generateStructuredOutput({
        userMessage: 'Test',
        schema: testSchema,
        timeout: 100, // Very short timeout to trigger timeout
      });

      // Assert
      expect(result).toEqual({ result: 'success' });
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should not retry when enableRetry is false', async () => {
      // Arrange
      const testSchema = z.object({ result: z.string() });
      const serverError = { status: 500, message: 'Internal Server Error' };

      mockCreate.mockRejectedValueOnce(serverError);

      // Act & Assert
      await expect(
        generateStructuredOutput({
          userMessage: 'Test',
          schema: testSchema,
          enableRetry: false,
        })
      ).rejects.toThrow(OpenAIError);

      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries exceeded', async () => {
      // Arrange
      const testSchema = z.object({ result: z.string() });
      const serverError = { status: 500, message: 'Internal Server Error' };

      // Fail all 3 attempts
      mockCreate
        .mockRejectedValueOnce(serverError)
        .mockRejectedValueOnce(serverError)
        .mockRejectedValueOnce(serverError);

      // Act & Assert
      await expect(
        generateStructuredOutput({
          userMessage: 'Test',
          schema: testSchema,
        })
      ).rejects.toThrow('Failed after 3 attempts');

      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors (400)', async () => {
      // Arrange
      const testSchema = z.object({ result: z.string() });
      const badRequestError = { status: 400, message: 'Bad Request' };

      mockCreate.mockRejectedValueOnce(badRequestError);

      // Act & Assert
      await expect(
        generateStructuredOutput({
          userMessage: 'Test',
          schema: testSchema,
        })
      ).rejects.toThrow(OpenAIError);

      // Should only call once (no retries)
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // Timeout Handling Tests
  // ============================================================================

  describe('generateStructuredOutput - Timeout Handling', () => {
    it('should timeout if request takes too long', async () => {
      // Arrange
      const testSchema = z.object({ result: z.string() });

      // Simulate a slow request
      mockCreate.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 5000))
      );

      // Act & Assert
      await expect(
        generateStructuredOutput({
          userMessage: 'Test',
          schema: testSchema,
          timeout: 100, // 100ms timeout
          enableRetry: false,
        })
      ).rejects.toThrow(OpenAITimeoutError);
    });

    it('should respect custom timeout value', async () => {
      // Arrange
      const testSchema = z.object({ result: z.string() });
      const customTimeout = 200;

      // Simulate a slow request
      mockCreate.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      // Act & Assert
      await expect(
        generateStructuredOutput({
          userMessage: 'Test',
          schema: testSchema,
          timeout: customTimeout,
          enableRetry: false,
        })
      ).rejects.toThrow(OpenAITimeoutError);
    }, 3000); // Increase test timeout to 3 seconds
  });

  // ============================================================================
  // Rate Limit Handling Tests
  // ============================================================================

  describe('generateStructuredOutput - Rate Limit Handling', () => {
    it('should throw OpenAIRateLimitError on 429 status', async () => {
      // Arrange
      const testSchema = z.object({ result: z.string() });
      const rateLimitError = { status: 429, message: 'Too Many Requests' };

      mockCreate.mockRejectedValueOnce(rateLimitError);

      // Act & Assert
      await expect(
        generateStructuredOutput({
          userMessage: 'Test',
          schema: testSchema,
        })
      ).rejects.toThrow(OpenAIRateLimitError);
    });
  });

  // ============================================================================
  // generateSlidePlan Tests
  // ============================================================================

  describe('generateSlidePlan', () => {
    it('should successfully generate a slide plan', async () => {
      // Arrange
      const mockSlidePlan = {
        slides: [
          {
            slideType: 'hook',
            goal: 'Grab attention',
            headline: 'Amazing Topic Revealed',
            body: ['Point 1', 'Point 2'],
          },
          {
            slideType: 'value',
            goal: 'Provide value',
            headline: 'Key Insight',
            body: ['Detail 1', 'Detail 2', 'Detail 3'],
          },
          {
            slideType: 'cta',
            goal: 'Call to action',
            headline: 'Take Action Now',
            body: ['Follow', 'Comment', 'Share'],
          },
        ],
        tone: 'professional',
        targetSlideCount: 10,
      };

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify(mockSlidePlan),
            },
          },
        ],
      });

      // Act
      const result = await generateSlidePlan('Test Topic');

      // Assert
      expect(result).toEqual(mockSlidePlan);
      expect(result.slides).toHaveLength(3);
      expect(result.slides?.[0]?.slideType).toBe('hook');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should respect custom slide count', async () => {
      // Arrange
      const mockSlidePlan = {
        slides: Array(8).fill({
          slideType: 'value',
          goal: 'Test',
          headline: 'Test',
          body: ['Test'],
        }),
      };

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify(mockSlidePlan),
            },
          },
        ],
      });

      // Act
      await generateSlidePlan('Test Topic', { slideCount: 8 });

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('8 slides'),
            }),
          ]),
        })
      );
    });

    it('should respect custom tone', async () => {
      // Arrange
      const mockSlidePlan = {
        slides: [
          {
            slideType: 'hook',
            goal: 'Test',
            headline: 'Test',
            body: ['Test'],
          },
          {
            slideType: 'value',
            goal: 'Test',
            headline: 'Test',
            body: ['Test'],
          },
          {
            slideType: 'cta',
            goal: 'Test',
            headline: 'Test',
            body: ['Test'],
          },
        ],
      };

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify(mockSlidePlan),
            },
          },
        ],
      });

      // Act
      await generateSlidePlan('Test Topic', { tone: 'bold' });

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('Tone: bold'),
            }),
          ]),
        })
      );
    });
  });

  // ============================================================================
  // generateSlideCopy Tests
  // ============================================================================

  describe('generateSlideCopy', () => {
    it('should successfully generate copy for each slide in the plan', async () => {
      // Arrange
      const mockPlan = {
        slides: [
          {
            slideType: 'hook' as const,
            goal: 'Grab attention with bold statement',
            headline: 'Hook headline',
            body: ['Hook body'],
          },
          {
            slideType: 'value' as const,
            goal: 'Provide key insight',
            headline: 'Value headline',
            body: ['Value body'],
          },
          {
            slideType: 'cta' as const,
            goal: 'Encourage engagement',
            headline: 'CTA headline',
            body: ['CTA body'],
          },
        ],
      };

      const mockCopy = {
        slides: [
          {
            headline: 'Stop scrolling: This changes everything',
            body: ['The old way is broken', 'Here\'s why it matters'],
            emphasis_text: ['changes everything'],
          },
          {
            headline: 'The key insight you need',
            body: ['First principle', 'Second principle', 'Third principle'],
            emphasis_text: ['key insight'],
          },
          {
            headline: 'Ready to take action?',
            body: ['Follow for more', 'Comment your thoughts'],
            emphasis_text: ['take action'],
          },
        ],
      };

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify(mockCopy),
            },
          },
        ],
      });

      // Dynamically import to avoid top-level import issues
      const { generateSlideCopy } = await import('./openai');

      // Act
      const result = await generateSlideCopy(mockPlan);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('headline');
      expect(result[0]).toHaveProperty('body');
      expect(result[0]).toHaveProperty('emphasis_text');
      expect(result[0]?.body?.length).toBeLessThanOrEqual(5);
      expect(mockCreate).toHaveBeenCalledOnce();
    });

    it('should enforce copy constraints in the prompt', async () => {
      // Arrange
      const mockPlan = {
        slides: [
          {
            slideType: 'hook' as const,
            goal: 'Test',
            headline: 'Test',
            body: ['Test'],
          },
        ],
      };

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                slides: [
                  {
                    headline: 'Test headline',
                    body: ['Test'],
                    emphasis_text: [],
                  },
                ],
              }),
            },
          },
        ],
      });

      const { generateSlideCopy } = await import('./openai');

      // Act
      await generateSlideCopy(mockPlan);

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('Maximum 12 words'),
            }),
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('Maximum 5 bullet points'),
            }),
          ]),
        })
      );
    });

    it('should include slide structure in the prompt', async () => {
      // Arrange
      const mockPlan = {
        slides: [
          {
            slideType: 'hook' as const,
            goal: 'Grab attention',
            headline: 'Test',
            body: ['Test'],
          },
          {
            slideType: 'value' as const,
            goal: 'Provide insight',
            headline: 'Test',
            body: ['Test'],
          },
        ],
      };

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                slides: [
                  {
                    headline: 'Test',
                    body: ['Test'],
                  },
                  {
                    headline: 'Test',
                    body: ['Test'],
                  },
                ],
              }),
            },
          },
        ],
      });

      const { generateSlideCopy } = await import('./openai');

      // Act
      await generateSlideCopy(mockPlan, { topic: 'Test Topic' });

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('Slide 1 (hook): Grab attention'),
            }),
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('Slide 2 (value): Provide insight'),
            }),
          ]),
        })
      );
    });

    it('should handle optional topic parameter', async () => {
      // Arrange
      const mockPlan = {
        slides: [
          {
            slideType: 'hook' as const,
            goal: 'Test',
            headline: 'Test',
            body: ['Test'],
          },
        ],
      };

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                slides: [
                  {
                    headline: 'Test',
                    body: ['Test'],
                  },
                ],
              }),
            },
          },
        ],
      });

      const { generateSlideCopy } = await import('./openai');

      // Act
      await generateSlideCopy(mockPlan, { topic: 'AI in Marketing' });

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('Topic: AI in Marketing'),
            }),
          ]),
        })
      );
    });
  });

  // ============================================================================
  // Schema Validation Tests
  // ============================================================================

  describe('Schema Validation', () => {
    it('should validate SlideContent schema correctly', () => {
      // Arrange
      const validSlide = {
        slideType: 'value',
        goal: 'Provide key insight',
        headline: 'This is a valid headline',
        body: ['Point 1', 'Point 2', 'Point 3'],
        emphasis: ['Key phrase'],
      };

      // Act & Assert
      expect(() => SlideContentSchema.parse(validSlide)).not.toThrow();
    });

    it('should reject invalid slide types', () => {
      // Arrange
      const invalidSlide = {
        slideType: 'invalid_type',
        goal: 'Test',
        headline: 'Test',
        body: ['Test'],
      };

      // Act & Assert
      expect(() => SlideContentSchema.parse(invalidSlide)).toThrow();
    });

    it('should reject headlines that are too long', () => {
      // Arrange
      const invalidSlide = {
        slideType: 'value',
        goal: 'Test',
        headline: 'This is an extremely long headline that exceeds the maximum allowed length of 60 characters',
        body: ['Test'],
      };

      // Act & Assert
      expect(() => SlideContentSchema.parse(invalidSlide)).toThrow();
    });

    it('should reject body with too many bullets', () => {
      // Arrange
      const invalidSlide = {
        slideType: 'value',
        goal: 'Test',
        headline: 'Test',
        body: ['1', '2', '3', '4', '5', '6'], // More than 5
      };

      // Act & Assert
      expect(() => SlideContentSchema.parse(invalidSlide)).toThrow();
    });

    it('should validate SlidePlan schema correctly', () => {
      // Arrange
      const validPlan = {
        slides: [
          {
            slideType: 'hook',
            goal: 'Test',
            headline: 'Test',
            body: ['Test'],
          },
          {
            slideType: 'value',
            goal: 'Test',
            headline: 'Test',
            body: ['Test'],
          },
          {
            slideType: 'cta',
            goal: 'Test',
            headline: 'Test',
            body: ['Test'],
          },
        ],
        tone: 'professional',
        targetSlideCount: 10,
      };

      // Act & Assert
      expect(() => SlidePlanSchema.parse(validPlan)).not.toThrow();
    });

    it('should reject slide plans with too few slides', () => {
      // Arrange
      const invalidPlan = {
        slides: [
          {
            slideType: 'hook',
            goal: 'Test',
            headline: 'Test',
            body: ['Test'],
          },
        ], // Less than 3
      };

      // Act & Assert
      expect(() => SlidePlanSchema.parse(invalidPlan)).toThrow();
    });

    it('should reject slide plans with too many slides', () => {
      // Arrange
      const invalidPlan = {
        slides: Array(25).fill({
          slideType: 'value',
          goal: 'Test',
          headline: 'Test',
          body: ['Test'],
        }), // More than 20
      };

      // Act & Assert
      expect(() => SlidePlanSchema.parse(invalidPlan)).toThrow();
    });

    it('should validate SlideCopy schema correctly', () => {
      // Arrange
      const validCopy = {
        headline: 'This is a valid headline',
        body: ['Point 1', 'Point 2', 'Point 3'],
        emphasis_text: ['Key phrase'],
      };

      // Act & Assert
      expect(() => SlideCopySchema.parse(validCopy)).not.toThrow();
    });

    it('should reject slide copy with too many body bullets', () => {
      // Arrange
      const invalidCopy = {
        headline: 'Test',
        body: ['1', '2', '3', '4', '5', '6'], // More than 5
      };

      // Act & Assert
      expect(() => SlideCopySchema.parse(invalidCopy)).toThrow();
    });
  });

  // ============================================================================
  // Layout Selection Tests
  // ============================================================================

  describe('selectLayout', () => {
    it('should select hook_big_headline for short hook slides', async () => {
      // Arrange
      const { selectLayout } = await import('./openai');

      // Act
      const result = selectLayout('hook', 'Short punchy hook', ['Brief point']);

      // Assert
      expect(result).toBe('hook_big_headline');
    });

    it('should select generic_single_focus for long hook slides', async () => {
      // Arrange
      const { selectLayout } = await import('./openai');

      // Act - Text length > 100 characters
      const result = selectLayout(
        'hook',
        'This is a very long headline that exceeds the maximum text length for the big headline layout',
        ['Additional body text that makes this even longer']
      );

      // Assert
      expect(result).toBe('generic_single_focus');
    });

    it('should select promise_two_column for promise slides', async () => {
      // Arrange
      const { selectLayout } = await import('./openai');

      // Act
      const result = selectLayout('promise', "What you'll learn", [
        'Point 1',
        'Point 2',
      ]);

      // Assert
      expect(result).toBe('promise_two_column');
    });

    it('should select value_bullets for short value slides', async () => {
      // Arrange
      const { selectLayout } = await import('./openai');

      // Act
      const result = selectLayout('value', 'Key insights', [
        'Insight 1',
        'Insight 2',
        'Insight 3',
      ]);

      // Assert
      expect(result).toBe('value_bullets');
    });

    it('should select value_numbered_steps for long value slides', async () => {
      // Arrange
      const { selectLayout } = await import('./openai');

      // Act - Text length > 200 characters
      const result = selectLayout(
        'value',
        'This is a longer headline for a value slide',
        [
          'This is the first detailed point with lots of explanation',
          'This is the second detailed point with even more explanation',
          'This is the third detailed point that adds more context',
          'And a fourth point for good measure',
        ]
      );

      // Assert
      expect(result).toBe('value_numbered_steps');
    });

    it('should select value_bullets for list type', async () => {
      // Arrange
      const { selectLayout } = await import('./openai');

      // Act
      const result = selectLayout('list', 'List headline', ['Item 1', 'Item 2']);

      // Assert
      expect(result).toBe('value_bullets');
    });

    it('should select value_numbered_steps for steps type', async () => {
      // Arrange
      const { selectLayout } = await import('./openai');

      // Act
      const result = selectLayout('steps', 'Steps headline', ['Step 1', 'Step 2']);

      // Assert
      expect(result).toBe('value_numbered_steps');
    });

    it('should select value_centered_quote for quote type', async () => {
      // Arrange
      const { selectLayout } = await import('./openai');

      // Act
      const result = selectLayout('quote', 'Quote headline', [
        'The quoted text',
      ]);

      // Assert
      expect(result).toBe('value_centered_quote');
    });

    it('should select value_text_left_visual_right for text_visual type', async () => {
      // Arrange
      const { selectLayout } = await import('./openai');

      // Act
      const result = selectLayout('text_visual', 'Text with visual', [
        'Body text',
      ]);

      // Assert
      expect(result).toBe('value_text_left_visual_right');
    });

    it('should select recap_grid for recap slides', async () => {
      // Arrange
      const { selectLayout } = await import('./openai');

      // Act
      const result = selectLayout('recap', 'Key takeaways', [
        'Takeaway 1',
        'Takeaway 2',
      ]);

      // Assert
      expect(result).toBe('recap_grid');
    });

    it('should select cta_centered for cta slides', async () => {
      // Arrange
      const { selectLayout } = await import('./openai');

      // Act
      const result = selectLayout('cta', 'Follow for more', ['Comment below']);

      // Assert
      expect(result).toBe('cta_centered');
    });

    it('should select generic_single_focus for generic slides', async () => {
      // Arrange
      const { selectLayout } = await import('./openai');

      // Act
      const result = selectLayout('generic', 'Generic slide', ['Body text']);

      // Assert
      expect(result).toBe('generic_single_focus');
    });

    it('should fallback to generic_single_focus for unknown slide types', async () => {
      // Arrange
      const { selectLayout } = await import('./openai');

      // Act
      const result = selectLayout('unknown_type', 'Headline', ['Body']);

      // Assert
      expect(result).toBe('generic_single_focus');
    });

    it('should handle slides with no body text', async () => {
      // Arrange
      const { selectLayout } = await import('./openai');

      // Act
      const result = selectLayout('hook', 'Short headline');

      // Assert
      expect(result).toBe('hook_big_headline');
    });
  });

  describe('selectLayoutsForSlides', () => {
    it('should select layouts for multiple slides', async () => {
      // Arrange
      const { selectLayoutsForSlides } = await import('./openai');
      const slides = [
        { slideType: 'hook', headline: 'Hook', body: ['Point'] },
        { slideType: 'promise', headline: 'Promise', body: ['Point'] },
        { slideType: 'value', headline: 'Value', body: ['Point'] },
        { slideType: 'cta', headline: 'CTA', body: ['Point'] },
      ];

      // Act
      const result = selectLayoutsForSlides(slides);

      // Assert
      expect(result).toHaveLength(4);
      expect(result[0]).toBe('hook_big_headline');
      expect(result[1]).toBe('promise_two_column');
      expect(result[2]).toBe('value_bullets');
      expect(result[3]).toBe('cta_centered');
    });

    it('should handle slides without slideType', async () => {
      // Arrange
      const { selectLayoutsForSlides } = await import('./openai');
      const slides = [
        { headline: 'Headline 1', body: ['Point'] },
        { headline: 'Headline 2', body: ['Point'] },
      ];

      // Act
      const result = selectLayoutsForSlides(slides);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('generic_single_focus');
      expect(result[1]).toBe('generic_single_focus');
    });

    it('should handle empty slides array', async () => {
      // Arrange
      const { selectLayoutsForSlides } = await import('./openai');

      // Act
      const result = selectLayoutsForSlides([]);

      // Assert
      expect(result).toHaveLength(0);
    });
  });
});
