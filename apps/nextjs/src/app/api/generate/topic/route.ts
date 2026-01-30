/**
 * POST /api/generate/topic
 * 
 * Generate carousel slides from a topic description.
 * 
 * This endpoint chains three AI operations:
 * 1. generateSlidePlan - Creates structured slide plan
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

// ============================================================================
// Request/Response Schemas
// ============================================================================

/**
 * Input validation schema
 */
const GenerateTopicRequestSchema = z.object({
  topic: z.string().min(1).max(500).describe("Topic or idea for the carousel"),
  slideCount: z.number().int().min(8).max(12).optional().default(10).describe("Number of slides to generate (8-12)"),
  tone: z.enum(['bold', 'calm', 'contrarian', 'professional']).optional().default('professional').describe("Tone of the carousel"),
  applyBrandKit: z.boolean().optional().default(false).describe("Whether to apply user's brand kit"),
});

type GenerateTopicRequest = z.infer<typeof GenerateTopicRequestSchema>;

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
interface GenerateTopicResponse {
  slides: GeneratedSlide[];
  metadata: {
    topic: string;
    tone: string;
    slideCount: number;
    generatedAt: string;
  };
}

// ============================================================================
// Route Handler
// ============================================================================

export const POST = withAuthAndErrors<GenerateTopicResponse>(
  async (req: Request, { userId }) => {
    // 1. Validate request body
    const body = await validateBody(req, GenerateTopicRequestSchema);
    
    const { topic, slideCount, tone, applyBrandKit } = body;

    try {
      // 2. STEP 1: Generate slide plan (structure)
      const plan: SlidePlan = await generateSlidePlan(topic, {
        slideCount,
        tone,
      });

      // Validate we got slides
      if (!plan.slides || plan.slides.length === 0) {
        throw ApiErrors.internal("AI generated empty slide plan");
      }

      // 3. STEP 2: Generate detailed copy for each slide
      const copySlides = await generateSlideCopy(plan, { topic });

      // Validate copy matches plan length
      if (copySlides.length !== plan.slides.length) {
        console.warn(
          `Copy length mismatch: expected ${plan.slides.length}, got ${copySlides.length}`
        );
      }

      // 4. STEP 3: Select appropriate layouts
      const layoutIds = selectLayoutsForSlides(copySlides);

      // 5. Combine all data into final slides array
      const slides: GeneratedSlide[] = plan.slides.map((planSlide, index) => {
        const copySlide = copySlides[index] || {
          headline: planSlide.headline,
          body: planSlide.body,
          emphasis_text: planSlide.emphasis,
        };

        return {
          orderIndex: index,
          slideType: planSlide.slideType,
          layoutId: layoutIds[index] || 'generic_single_focus',
          headline: copySlide.headline,
          body: Array.isArray(copySlide.body) ? copySlide.body : [],
          emphasis: copySlide.emphasis_text || planSlide.emphasis,
        };
      });

      // 6. Validate final slide count
      if (slides.length < 8 || slides.length > 12) {
        console.warn(
          `Slide count outside expected range: ${slides.length} (expected 8-12)`
        );
      }

      // 7. Return success response
      return NextResponse.json<GenerateTopicResponse>({
        slides,
        metadata: {
          topic,
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
          "Failed to generate carousel. Please try again with a clearer topic."
        );
      }
      
      // Unknown error type
      throw error;
    }
  }
);
