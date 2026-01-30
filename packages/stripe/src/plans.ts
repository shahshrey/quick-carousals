import { SubscriptionTier } from "@saasfly/db";

import { env } from "./env.mjs";

export const PLANS: Record<
  string,
  (typeof SubscriptionTier)[keyof typeof SubscriptionTier]
> = {
  // @ts-ignore
  [env.NEXT_PUBLIC_STRIPE_CREATOR_PRICE_ID]: SubscriptionTier.CREATOR,
  // @ts-ignore
  [env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID]: SubscriptionTier.PRO,
};

type PlanType = (typeof SubscriptionTier)[keyof typeof SubscriptionTier];

export function getSubscriptionPlan(priceId: string | undefined): PlanType {
  return priceId && PLANS[priceId] ? PLANS[priceId]! : SubscriptionTier.FREE;
}
