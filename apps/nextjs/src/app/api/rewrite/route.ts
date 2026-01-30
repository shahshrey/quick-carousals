/**
 * Text Rewrite API Endpoint
 * 
 * Provides AI-powered text rewriting actions:
 * - shorter: Reduce text length while preserving meaning
 * - punchier: Make text more impactful and engaging
 * - examples: Add concrete examples
 * - reduce_jargon: Simplify technical terms
 * - more_specific: Add specific details
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateStructuredOutput } from '~/lib/openai';
import { withAuthAndErrors } from '~/lib/with-auth';
import { ApiErrors } from '~/lib/api-error';
import { validateBody } from '~/lib/validations/api';

// ============================================================================
// Request Validation
// ============================================================================

const rewriteRequestSchema = z.object({
  text: z.string().min(1).max(5000).describe('The text to rewrite'),
  action: z.enum(['shorter', 'punchier', 'examples', 'reduce_jargon', 'more_specific', 'contrarian_hook'])
    .describe('The type of rewriting to apply'),
  maxWords: z.number().min(1).max(100).optional().describe('Maximum word count for output (for shorter action)'),
  context: z.string().max(500).optional().describe('Additional context about the content'),
});

type RewriteRequest = z.infer<typeof rewriteRequestSchema>;

// ============================================================================
// Response Schema
// ============================================================================

const rewriteResponseSchema = z.object({
  rewritten_text: z.string().describe('The rewritten text'),
});

type RewriteResponse = z.infer<typeof rewriteResponseSchema>;

// ============================================================================
// Action Prompts
// ============================================================================

const ACTION_PROMPTS = {
  shorter: (text: string, maxWords?: number) => ({
    system: `You are a concise editor. Your task is to shorten text while preserving its core meaning and impact.
    
Rules:
- Keep the same tone and voice
- Preserve key information
- Remove redundancy and filler words
- ${maxWords ? `Output MUST be ${maxWords} words or fewer` : 'Reduce by at least 30%'}
- Maintain clarity and readability`,
    user: `Shorten this text${maxWords ? ` to ${maxWords} words or fewer` : ''}:\n\n${text}`,
  }),

  punchier: (text: string) => ({
    system: `You are an expert copywriter. Make text more impactful and engaging.
    
Rules:
- Use strong, active verbs
- Remove weak qualifiers ("maybe", "might", "could")
- Add power words and emotional triggers
- Keep it concise
- Maintain the original meaning`,
    user: `Make this text more punchy and impactful:\n\n${text}`,
  }),

  examples: (text: string) => ({
    system: `You are a content enrichment expert. Add concrete examples to make abstract concepts tangible.
    
Rules:
- Add 1-2 specific, relevant examples
- Keep examples brief and illustrative
- Don't change the core message
- Examples should be realistic and relatable`,
    user: `Add concrete examples to this text:\n\n${text}`,
  }),

  reduce_jargon: (text: string) => ({
    system: `You are a plain language expert. Simplify technical terms and jargon.
    
Rules:
- Replace jargon with everyday language
- Explain concepts simply
- Keep the same meaning
- Maintain professional tone
- Make it accessible to general audience`,
    user: `Simplify the jargon in this text:\n\n${text}`,
  }),

  more_specific: (text: string) => ({
    system: `You are a detail-oriented editor. Add specific details to make vague statements concrete.
    
Rules:
- Replace vague terms with specific ones
- Add quantifiable metrics where appropriate
- Keep the same length (don't make it too long)
- Maintain credibility (don't make up unrealistic claims)`,
    user: `Make this text more specific:\n\n${text}`,
  }),

  contrarian_hook: (text: string) => ({
    system: `You are a hook-writing expert. Transform text into a contrarian, attention-grabbing hook.
    
Rules:
- Challenge conventional wisdom
- Create curiosity and controversy
- Keep it short and punchy (max 2 sentences)
- Make people want to read more
- Don't be clickbait - deliver on the promise`,
    user: `Turn this into a contrarian hook:\n\n${text}`,
  }),
};

// ============================================================================
// Route Handler
// ============================================================================

export const POST = withAuthAndErrors(async (req: Request, { userId }) => {
  const body = await validateBody(req, rewriteRequestSchema);

  const { text, action, maxWords, context } = body;

  // Get the prompt for the requested action
  const promptConfig = ACTION_PROMPTS[action](text, maxWords);

  // Add context if provided
  const userMessage = context 
    ? `${promptConfig.user}\n\nContext: ${context}`
    : promptConfig.user;

  try {
    // Generate rewritten text using OpenAI
    const result = await generateStructuredOutput<RewriteResponse>({
      systemPrompt: promptConfig.system,
      userMessage,
      schema: rewriteResponseSchema,
      temperature: action === 'contrarian_hook' ? 0.8 : 0.7, // Higher temp for creative hooks
    });

    return NextResponse.json({
      rewritten_text: result.rewritten_text,
      original_text: text,
      action,
    });

  } catch (error: unknown) {
    // Handle OpenAI API errors
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('timeout')) {
        throw ApiErrors.internal('AI service timeout. Please try again.');
      }
      if (error.message.toLowerCase().includes('rate limit')) {
        throw ApiErrors.rateLimited(60);
      }
    }

    // Re-throw ApiErrors as-is
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }

    // Generic error
    throw ApiErrors.internal('Failed to rewrite text');
  }
});

export const runtime = 'edge';
