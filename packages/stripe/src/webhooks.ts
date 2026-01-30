import type Stripe from "stripe";

import { db, SubscriptionTier } from "@saasfly/db";

import { stripe } from ".";
import { getSubscriptionPlan } from "./plans";

export async function handleEvent(event: Stripe.DiscriminatedEvent) {
  const session = event.data.object as Stripe.Checkout.Session;
  if (event.type === "checkout.session.completed") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string,
    );
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;
    const { userId } = subscription.metadata;
    if (!userId) {
      throw new Error("Missing user id");
    }
    
    // QuickCarousals uses Profile table with clerkUserId
    const profile = await db
      .selectFrom("Profile")
      .selectAll()
      .where("clerkUserId", "=", userId)
      .executeTakeFirst();

    if (profile) {
      const priceId = subscription.items.data[0]?.price.id;
      if (!priceId) {
        return;
      }

      const subscriptionTier = getSubscriptionPlan(priceId);
      
      // Note: QuickCarousals Profile doesn't store Stripe IDs (managed by Clerk)
      // Only update the subscription tier
      return await db
        .updateTable("Profile")
        .where("id", "=", profile.id)
        .set({
          subscriptionTier: subscriptionTier || SubscriptionTier.FREE,
        })
        .execute();
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string,
    );
    const { userId } = subscription.metadata;
    if (!userId) {
      throw new Error("Missing user id");
    }
    
    const profile = await db
      .selectFrom("Profile")
      .selectAll()
      .where("clerkUserId", "=", userId)
      .executeTakeFirst();

    /**
     * User is already subscribed, update their subscription tier
     */
    if (profile) {
      const priceId = subscription.items.data[0]?.price.id;
      if (!priceId) {
        return;
      }

      const subscriptionTier = getSubscriptionPlan(priceId);
      return await db
        .updateTable("Profile")
        .where("id", "=", profile.id)
        .set({
          subscriptionTier: subscriptionTier || SubscriptionTier.FREE,
        })
        .execute();
    }
  }
  
  if (event.type === "customer.subscription.deleted") {
    // Handle subscription cancellation - revert to FREE tier
    const subscription = event.data.object as Stripe.Subscription;
    const { userId } = subscription.metadata;
    if (!userId) {
      throw new Error("Missing user id");
    }
    
    const profile = await db
      .selectFrom("Profile")
      .selectAll()
      .where("clerkUserId", "=", userId)
      .executeTakeFirst();

    if (profile) {
      return await db
        .updateTable("Profile")
        .where("id", "=", profile.id)
        .set({
          subscriptionTier: SubscriptionTier.FREE,
        })
        .execute();
    }
  }
  
  if (event.type === "customer.subscription.updated") {
    // Handle subscription updates (e.g., plan changes)
    const subscription = event.data.object as Stripe.Subscription;
    const { userId } = subscription.metadata;
    if (!userId) {
      throw new Error("Missing user id");
    }
    
    const profile = await db
      .selectFrom("Profile")
      .selectAll()
      .where("clerkUserId", "=", userId)
      .executeTakeFirst();

    if (profile) {
      const priceId = subscription.items.data[0]?.price.id;
      if (!priceId) {
        return;
      }

      const subscriptionTier = getSubscriptionPlan(priceId);
      return await db
        .updateTable("Profile")
        .where("id", "=", profile.id)
        .set({
          subscriptionTier: subscriptionTier || SubscriptionTier.FREE,
        })
        .execute();
    }
  }
  
  console.log("✅ Stripe Webhook Processed");
}
