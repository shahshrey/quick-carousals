/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for subscription purchase
 * 
 * Protected: Requires authentication
 */

import { NextResponse } from "next/server";
import { stripe } from "@saasfly/stripe";
import { env } from "@saasfly/stripe/env";
import { withAuthAndErrors } from "~/lib/with-auth";
import { validateBody } from "~/lib/validations/api";
import { ApiErrors } from "~/lib/api-error";
import { z } from "zod";

// Validation schema for checkout request
const CheckoutSchema = z.object({
  priceId: z.string().min(1, "Price ID is required"),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export const POST = withAuthAndErrors(async (req, { userId }) => {
  // Validate request body
  const body = await validateBody(req, CheckoutSchema);

  // Get price ID from request
  const { priceId, successUrl, cancelUrl } = body;

  // Verify price ID is valid (either CREATOR or PRO tier)
  const validPriceIds = [
    env.NEXT_PUBLIC_STRIPE_CREATOR_PRICE_ID,
    env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
  ].filter(Boolean);

  if (!validPriceIds.includes(priceId)) {
    throw ApiErrors.validation("Invalid price ID provided");
  }

  try {
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/en/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/en/pricing`,
      client_reference_id: userId, // Link session to Clerk user ID
      metadata: {
        userId, // Store userId in metadata for webhook processing
      },
      subscription_data: {
        metadata: {
          userId, // Store userId in subscription metadata too
        },
      },
    });

    // Return checkout URL
    return NextResponse.json(
      {
        url: session.url,
        sessionId: session.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Stripe checkout error:", error);

    // Handle Stripe-specific errors
    if (error && typeof error === "object" && "type" in error) {
      const stripeError = error as { type: string; message?: string };
      
      if (stripeError.type === "StripeInvalidRequestError") {
        throw ApiErrors.validation(stripeError.message || "Invalid request to Stripe");
      }
      
      if (stripeError.type === "StripeRateLimitError") {
        throw ApiErrors.rateLimited(60);
      }
    }

    // Generic error
    throw ApiErrors.internal("Failed to create checkout session");
  }
});
