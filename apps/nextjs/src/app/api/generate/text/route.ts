/**
 * POST /api/generate/text
 * 
 * Generate carousel slides from pasted text content.
 * 
 * Handles:
 * - Short text (<500 chars): Expand content across slides
 * - Medium text (500-6000 chars): Chunk and distribute
 * - Long text (>6000 chars): Split and condense
 * 
 * This endpoint chains three AI operations:
 * 1. generateSlidePlan - Creates structured slide plan from text
 * 2. generateSlideCopy - Generates detailed copy for each slide
 * 3. selectLayoutsForSlides - Maps slides to appropriate layouts
 * 
 * Returns complete slides array ready for the editor.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuthAndErrors } from "~/lib/with-auth";
import { validateBody } from "~/lib/validations/api";
import { 
  generateSlidePlan, 
  generateSlideCopy, 
  selectLayoutsForSlides,
  type SlidePlan 
} from "~/lib/openai";
import { ApiErrors } from "~/lib/api-error";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Database } from "@saasfly/db/prisma/types";

// Create database client
const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: process.env.POSTGRES_URL,
  }),
});

const db = new Kysely<Database>({ dialect });

// ============================================================================
// Request/Response Schemas
// ============================================================================

/**
 * Input validation schema
 */
const GenerateTextRequestSchema = z.object({
  text: z.string()
    .min(10, "Text must be at least 10 characters")
    .max(10000, "Text must be less than 10,000 characters")
    .describe("Text content to convert into slides"),
  slideCount: z.number()
    .int()
    .min(3)
    .max(20)
    .optional()
    .default(10)
    .describe("Number of slides to generate"),
  tone: z.enum(['bold', 'calm', 'contrarian', 'professional'])
    .optional()
    .default('professional')
    .describe("Tone of the carousel"),
  applyBrandKit: z.boolean().optional().default(false).describe("Whether to apply user's brand kit"),
});

type GenerateTextRequest = z.infer<typeof GenerateTextRequestSchema>;

/**
 * Individual slide in response
 */
interface GeneratedSlide {
  orderIndex: number;
  slideType: string;
  layoutId: string;
  headline: string;
  body: string[];
  emphasis?: string[];
}

/**
 * Success response schema
 */
interface GenerateTextResponse {
  slides: GeneratedSlide[];
  metadata: {
    textLength: number;
    tone: string;
    slideCount: number;
    generatedAt: string;
  };
}

// ============================================================================
// Text Chunking Logic
// ============================================================================

/**
 * Determine slide pacing based on text length
 */
function calculateOptimalSlideCount(textLength: number, requestedCount?: number): number {
  // If user specified, respect it (within bounds)
  if (requestedCount) {
    return Math.max(3, Math.min(20, requestedCount));
  }

  // Auto-calculate based on text length
  if (textLength < 500) {
    // Short text: spread across fewer slides (5-8)
    return Math.max(5, Math.min(8, Math.ceil(textLength / 80)));
  } else if (textLength < 2000) {
    // Medium text: standard range (8-12)
    return Math.max(8, Math.min(12, Math.ceil(textLength / 200)));
  } else if (textLength < 6000) {
    // Long text: more slides to avoid density (12-15)
    return Math.max(12, Math.min(15, Math.ceil(textLength / 400)));
  } else {
    // Very long text: maximum slides, AI will condense (15-20)
    return Math.max(15, Math.min(20, Math.ceil(textLength / 500)));
  }
}

/**
 * Create a prompt for text-to-slides conversion
 */
function createTextPrompt(text: string, slideCount: number, tone: string): string {
  const textLength = text.length;
  
  let pacingInstructions = "";
  
  if (textLength < 500) {
    pacingInstructions = `
The text is SHORT (${textLength} chars). Your task:
- Expand the core ideas into ${slideCount} slides
- Add context and examples where appropriate
- Make each slide valuable, not filler
- Create a hook that frames the topic
- Add a clear CTA at the end
`;
  } else if (textLength < 2000) {
    pacingInstructions = `
The text is MEDIUM length (${textLength} chars). Your task:
- Extract ${slideCount} key points
- Maintain the original structure and flow
- Add a hook slide at the beginning
- End with a recap and CTA
`;
  } else if (textLength < 6000) {
    pacingInstructions = `
The text is LONG (${textLength} chars). Your task:
- Condense into ${slideCount} digestible slides
- Focus on the most important insights
- Remove redundancy but keep key examples
- Create clear hierarchy (hook → value → recap → CTA)
`;
  } else {
    pacingInstructions = `
The text is VERY LONG (${textLength} chars). Your task:
- Extract ONLY the most critical insights for ${slideCount} slides
- Be ruthlessly selective - this is about skimmability
- Each slide should be a standalone insight
- Condense examples to 1-2 sentences max
- Prioritize actionable takeaways
`;
  }

  return `Convert this text into a ${slideCount}-slide LinkedIn carousel.

${pacingInstructions}

Tone: ${tone}

Structure:
- Slide 1: Hook (attention-grabbing opener)
- Slides 2-${slideCount - 2}: Value slides (core content)
- Slide ${slideCount - 1}: Recap (key takeaways)
- Slide ${slideCount}: CTA (follow/comment/save)

Original text:
---
${text}
---

Create a structured slide plan with clear goals for each slide.`;
}

// ============================================================================
// Route Handler
// ============================================================================

export const POST = withAuthAndErrors<GenerateTextResponse>(
  async (req: Request, { userId }) => {
    // 1. Validate request body
    const body = await validateBody(req, GenerateTextRequestSchema);
    
    const { text, slideCount: requestedSlideCount, tone, applyBrandKit } = body;
    const textLength = text.length;

    try {
      // 2. Fetch brand kit if requested
      let brandKit: any = null;
      if (applyBrandKit) {
        // Get user's profile
        const profile = await db
          .selectFrom("Profile")
          .where("clerkUserId", "=", userId)
          .select("id")
          .executeTakeFirst();

        if (profile) {
          // Get default brand kit or first brand kit
          brandKit = await db
            .selectFrom("BrandKit")
            .where("userId", "=", profile.id)
            .selectAll()
            .orderBy("isDefault", "desc")
            .orderBy("createdAt", "desc")
            .executeTakeFirst();
        }
      }

      // 3. Calculate optimal slide count based on text length
      const slideCount = calculateOptimalSlideCount(textLength, requestedSlideCount);

      // 4. Create prompt with pacing instructions
      const prompt = createTextPrompt(text, slideCount, tone || 'professional');

      // 5. STEP 1: Generate slide plan (structure)
      const plan: SlidePlan = await generateSlidePlan(prompt, {
        slideCount,
        tone,
      });

      // Validate we got slides
      if (!plan.slides || plan.slides.length === 0) {
        throw ApiErrors.internal("AI generated empty slide plan");
      }

      // 6. STEP 2: Generate detailed copy for each slide
      // Pass the original text as context
      const copySlides = await generateSlideCopy(plan, { topic: `Source text: ${text.substring(0, 500)}...` });

      // Validate copy matches plan length
      if (copySlides.length !== plan.slides.length) {
        console.warn(
          `Copy length mismatch: expected ${plan.slides.length}, got ${copySlides.length}`
        );
      }

      // 7. STEP 3: Select appropriate layouts
      const layoutIds = selectLayoutsForSlides(copySlides);

      // 8. Combine all data into final slides array
      const slides: GeneratedSlide[] = plan.slides.map((planSlide, index) => {
        const copySlide = copySlides[index] || {
          headline: planSlide.headline,
          body: planSlide.body,
          emphasis_text: planSlide.emphasis,
        };

        const slide: GeneratedSlide = {
          orderIndex: index,
          slideType: planSlide.slideType,
          layoutId: layoutIds[index] || 'generic_single_focus',
          headline: copySlide.headline,
          body: Array.isArray(copySlide.body) ? copySlide.body : [],
          emphasis: copySlide.emphasis_text || planSlide.emphasis,
        };

        // Apply brand kit if available
        if (brandKit) {
          (slide as any).brandKit = {
            colors: brandKit.colors || {},
            fonts: brandKit.fonts || {},
            logoUrl: brandKit.logoUrl || null,
            handle: brandKit.handle || null,
          };
        }

        return slide;
      });

      // 9. Return success response
      return NextResponse.json<GenerateTextResponse>({
        slides,
        metadata: {
          textLength,
          tone: tone || 'professional',
          slideCount: slides.length,
          generatedAt: new Date().toISOString(),
        },
      });

    } catch (error) {
      // Re-throw ApiErrors directly (validation, auth, rate limit, etc.)
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error;
      }
      
      // Handle OpenAI errors
      if (error instanceof Error) {
        console.error("OpenAI generation error:", error);
        
        // Check for specific error types
        if (error.message.toLowerCase().includes("timeout")) {
          throw ApiErrors.internal("AI generation timed out. Please try again.");
        }
        
        if (error.message.toLowerCase().includes("rate limit")) {
          throw ApiErrors.rateLimited(60);
        }
        
        // Generic AI error
        throw ApiErrors.internal(
          "Failed to generate carousel from text. Please try again with clearer content."
        );
      }
      
      // Unknown error type
      throw error;
    }
  }
);
