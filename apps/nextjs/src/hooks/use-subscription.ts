/**
 * useSubscription Hook
 * 
 * Provides subscription tier information and feature gating logic
 * 
 * Features gated by tier:
 * - Free: 3 carousels/month, 8 slides, watermark, 3 style kits, 0 brand kits
 * - Creator: 30 carousels/month, 15 slides, no watermark, all style kits, 1 brand kit
 * - Pro: Unlimited carousels, 20 slides, no watermark, all style kits, 5 brand kits
 */

import { useEffect, useState } from "react";
import type { SubscriptionTier } from "@saasfly/db/prisma/enums";

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  loading: boolean;
  error: string | null;
  canUse: (feature: FeatureName) => boolean;
  getLimit: (feature: FeatureName) => number;
  requiresUpgrade: (feature: FeatureName) => boolean;
}

export type FeatureName =
  | "carousels"
  | "slides"
  | "watermark"
  | "style_kits"
  | "brand_kits"
  | "custom_fonts"
  | "priority_exports";

// Tier limits configuration
const TIER_LIMITS: Record<SubscriptionTier, Record<FeatureName, number | boolean>> = {
  FREE: {
    carousels: 3,
    slides: 8,
    watermark: true,
    style_kits: 3,
    brand_kits: 0,
    custom_fonts: false,
    priority_exports: false,
  },
  CREATOR: {
    carousels: 30,
    slides: 15,
    watermark: false,
    style_kits: 8,
    brand_kits: 1,
    custom_fonts: false,
    priority_exports: false,
  },
  PRO: {
    carousels: -1, // -1 means unlimited
    slides: 20,
    watermark: false,
    style_kits: 8,
    brand_kits: 5,
    custom_fonts: true,
    priority_exports: true,
  },
};

/**
 * Custom hook to fetch subscription tier and provide feature gating logic
 */
export function useSubscription(): SubscriptionInfo {
  const [tier, setTier] = useState<SubscriptionTier>("FREE");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/profile");
        
        if (!response.ok) {
          // Not authenticated or error - default to FREE
          if (response.status === 401) {
            setTier("FREE");
            setLoading(false);
            return;
          }
          
          throw new Error(`Failed to fetch profile: ${response.statusText}`);
        }

        const data = await response.json();
        setTier(data.subscriptionTier || "FREE");
        setError(null);
      } catch (err) {
        console.error("Error fetching subscription tier:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch subscription");
        setTier("FREE"); // Default to FREE on error
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  /**
   * Check if user can use a feature based on their tier
   */
  const canUse = (feature: FeatureName): boolean => {
    const limit = TIER_LIMITS[tier][feature];

    // Boolean features (watermark, custom_fonts, priority_exports)
    if (typeof limit === "boolean") {
      return limit;
    }

    // Numeric features with limits
    // -1 means unlimited (always true)
    // 0 means not allowed (always false)
    // > 0 means they have access to this feature (check count separately)
    if (limit === -1) return true; // Unlimited
    if (limit === 0) return false; // Not allowed
    return true; // They have access (count check handled elsewhere)
  };

  /**
   * Get the limit for a feature
   */
  const getLimit = (feature: FeatureName): number => {
    const limit = TIER_LIMITS[tier][feature];

    if (typeof limit === "boolean") {
      return limit ? 1 : 0;
    }

    return limit as number;
  };

  /**
   * Check if user needs to upgrade to access a feature
   */
  const requiresUpgrade = (feature: FeatureName): boolean => {
    return !canUse(feature);
  };

  return {
    tier,
    loading,
    error,
    canUse,
    getLimit,
    requiresUpgrade,
  };
}
