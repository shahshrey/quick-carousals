/**
 * OpenAI Service with Structured Output
 * 
 * Provides a type-safe interface to OpenAI's API with:
 * - Structured output (JSON mode)
 * - Retry logic for transient errors
 * - Timeout handling
 * - Rate limit handling
 */

import OpenAI from 'openai';
import { z } from 'zod';

// ============================================================================
// Environment & Configuration
// ============================================================================

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 5000]; // Exponential backoff: 1s, 2s, 5s

/**
 * Get environment variables (lazily evaluated)
 */
function getEnvVars() {
  return {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4.1',
  };
}

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Slide types categorizing slide purpose
 */
export type SlideType = 
  | 'hook'           // Attention-grabbing opener
  | 'promise'        // What you'll learn
  | 'value'          // Core content
  | 'recap'          // Key takeaways
  | 'cta'            // Follow/comment/save
  | 'generic';       // Catch-all

/**
 * Individual slide in the plan
 */
export const SlideContentSchema = z.object({
  slideType: z.enum(['hook', 'promise', 'value', 'recap', 'cta', 'generic']),
  goal: z.string().describe('One-sentence goal for this slide'),
  headline: z.string().max(60).describe('8-12 words, punchy and clear'),
  body: z.array(z.string()).max(5).describe('3-5 bullet points or sentences'),
  emphasis: z.array(z.string()).optional().describe('Key phrases to highlight'),
});

export type SlideContent = z.infer<typeof SlideContentSchema>;

/**
 * Complete slide plan output from AI
 */
export const SlidePlanSchema = z.object({
  slides: z.array(SlideContentSchema).min(3).max(20),
  tone: z.enum(['bold', 'calm', 'contrarian', 'professional']).optional(),
  targetSlideCount: z.number().min(3).max(20).optional(),
});

export type SlidePlan = z.infer<typeof SlidePlanSchema>;

/**
 * Options for generating structured output
 */
export interface GenerateOptions {
  /**
   * System prompt to guide the AI
   */
  systemPrompt?: string;
  
  /**
   * User message (the actual request)
   */
  userMessage: string;
  
  /**
   * Expected output schema (Zod schema)
   */
  schema: z.ZodType;
  
  /**
   * Custom timeout in milliseconds (default: 30s)
   */
  timeout?: number;
  
  /**
   * Model to use (default: from env or gpt-4.1)
   */
  model?: string;
  
  /**
   * Temperature for generation (0-2, default: 0.7)
   */
  temperature?: number;
  
  /**
   * Whether to enable retry logic (default: true)
   */
  enableRetry?: boolean;
}

// ============================================================================
// OpenAI Client Singleton
// ============================================================================

let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client instance
 */
function getOpenAIClient(): OpenAI {
  const { OPENAI_API_KEY } = getEnvVars();
  
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: OPENAI_API_KEY,
      timeout: DEFAULT_TIMEOUT,
      maxRetries: 0, // We handle retries manually for better control
    });
  }

  return openaiClient;
}

// ============================================================================
// Error Classes
// ============================================================================

export class OpenAIError extends Error {
  constructor(
    message: string,
    public code: string,
    public isRetryable: boolean = false,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'OpenAIError';
  }
}

export class OpenAITimeoutError extends OpenAIError {
  constructor(timeout: number, cause?: unknown) {
    super(
      `OpenAI request timed out after ${timeout}ms`,
      'TIMEOUT',
      true,
      cause
    );
    this.name = 'OpenAITimeoutError';
  }
}

export class OpenAIRateLimitError extends OpenAIError {
  constructor(cause?: unknown) {
    super(
      'OpenAI rate limit exceeded. Please try again later.',
      'RATE_LIMIT',
      true,
      cause
    );
    this.name = 'OpenAIRateLimitError';
  }
}

export class OpenAIValidationError extends OpenAIError {
  constructor(message: string, cause?: unknown) {
    super(message, 'VALIDATION', false, cause);
    this.name = 'OpenAIValidationError';
  }
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Sleep for specified milliseconds (for retry delays)
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof OpenAITimeoutError || error instanceof OpenAIRateLimitError) {
    return true;
  }

  // OpenAI SDK error codes that are retryable
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status?: number }).status;
    return status === 408 || status === 429 || (status && status >= 500);
  }

  return false;
}

/**
 * Generate structured output from OpenAI with retry logic
 * 
 * @param options - Generation options
 * @returns Parsed and validated output matching the schema
 * @throws OpenAIError if generation fails after all retries
 */
export async function generateStructuredOutput<T>(
  options: GenerateOptions
): Promise<T> {
  const { OPENAI_MODEL } = getEnvVars();
  
  const {
    systemPrompt = 'You are a helpful assistant that generates structured JSON output.',
    userMessage,
    schema,
    timeout = DEFAULT_TIMEOUT,
    model = OPENAI_MODEL,
    temperature = 0.7,
    enableRetry = true,
  } = options;

  const client = getOpenAIClient();
  let lastError: Error | null = null;
  const maxAttempts = enableRetry ? MAX_RETRIES : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Add delay before retry (except first attempt)
      if (attempt > 0) {
        const delay = RETRY_DELAYS[attempt - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        await sleep(delay);
      }

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new OpenAITimeoutError(timeout));
        }, timeout);
      });

      // Create API call promise
      const apiCallPromise = client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature,
        response_format: { type: 'json_object' },
      });

      // Race between API call and timeout
      const completion = await Promise.race([apiCallPromise, timeoutPromise]);

      // Extract content
      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new OpenAIError(
          'OpenAI returned empty response',
          'EMPTY_RESPONSE',
          false
        );
      }

      // Parse JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        throw new OpenAIValidationError(
          'Failed to parse OpenAI response as JSON',
          parseError
        );
      }

      // Validate against schema
      try {
        const validated = schema.parse(parsed);
        return validated as T;
      } catch (validationError) {
        throw new OpenAIValidationError(
          'OpenAI response does not match expected schema',
          validationError
        );
      }
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      if (!enableRetry || !isRetryableError(error)) {
        // Not retryable, throw immediately
        if (error instanceof OpenAIError) {
          throw error;
        }

        // Wrap unknown errors
        throw new OpenAIError(
          error instanceof Error ? error.message : 'Unknown OpenAI error',
          'UNKNOWN',
          false,
          error
        );
      }

      // Check for rate limit
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status?: number }).status;
        if (status === 429) {
          throw new OpenAIRateLimitError(error);
        }
      }

      // Continue to next retry attempt
      continue;
    }
  }

  // All retries exhausted
  throw new OpenAIError(
    `Failed after ${maxAttempts} attempts: ${lastError?.message}`,
    'MAX_RETRIES_EXCEEDED',
    false,
    lastError
  );
}

/**
 * Generate a slide plan from a topic
 * 
 * @param topic - Topic to create carousel about
 * @param options - Additional options (slide count, tone)
 * @returns Validated slide plan
 */
export async function generateSlidePlan(
  topic: string,
  options: {
    slideCount?: number;
    tone?: 'bold' | 'calm' | 'contrarian' | 'professional';
  } = {}
): Promise<SlidePlan> {
  const { slideCount = 10, tone = 'professional' } = options;

  const systemPrompt = `You are an expert LinkedIn carousel creator. Generate a structured slide plan for a carousel.

Rules:
- Create ${slideCount} slides total
- Slide 1: Hook (attention-grabbing opener)
- Slide 2: Promise (what they'll learn)
- Slides 3-${slideCount - 2}: Value (core content)
- Slide ${slideCount - 1}: Recap (key takeaways)
- Slide ${slideCount}: CTA (call to action)
- Headlines: 8-12 words max, punchy and clear
- Body: 3-5 bullet points per slide
- Tone: ${tone}

Output valid JSON matching the schema.`;

  const userMessage = `Create a carousel slide plan about: ${topic}`;

  return generateStructuredOutput<SlidePlan>({
    systemPrompt,
    userMessage,
    schema: SlidePlanSchema,
  });
}
