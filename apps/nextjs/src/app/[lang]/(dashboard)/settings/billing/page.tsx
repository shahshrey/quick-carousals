'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { Button } from '@saasfly/ui/button';
import { DashboardShell } from '~/components/shell';
import { Check } from 'lucide-react';

interface PricingTier {
  tier: 'FREE' | 'CREATOR' | 'PRO';
  name: string;
  price: string;
  priceId?: string;
  features: string[];
}

const PRICING_TIERS: PricingTier[] = [
  {
    tier: 'FREE',
    name: 'Free',
    price: '$0',
    features: [
      '3 carousels/month',
      '8 slides max',
      'Watermark included',
      '3 style kits',
    ],
  },
  {
    tier: 'CREATOR',
    name: 'Creator',
    price: '$15/mo',
    priceId: process.env.NEXT_PUBLIC_STRIPE_CREATOR_PRICE_ID,
    features: [
      '30 carousels/month',
      '15 slides max',
      'No watermark',
      'All 8 style kits',
      '1 brand kit',
    ],
  },
  {
    tier: 'PRO',
    name: 'Pro',
    price: '$39/mo',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    features: [
      'Unlimited carousels',
      '20 slides max',
      'No watermark',
      'All 8 style kits',
      '5 brand kits',
      'Custom fonts',
      'Priority exports',
    ],
  },
];

export default function BillingPage() {
  const [currentTier, setCurrentTier] = useState<'FREE' | 'CREATOR' | 'PRO'>('FREE');
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentPlan();
  }, []);

  const loadCurrentPlan = async () => {
    setLoading(true);
    try {
      // Fetch user profile to get subscription tier
      const response = await fetch('/api/profile');
      if (response.ok) {
        const profile = await response.json();
        setCurrentTier(profile.subscriptionTier || 'FREE');
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (priceId: string, tierName: string) => {
    setUpgrading(priceId);
    try {
      // Call Stripe checkout endpoint
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/en/settings/billing?success=true`,
          cancelUrl: `${window.location.origin}/en/settings/billing`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start upgrade process. Please try again.');
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Loading subscription details...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-gray-600 mt-2">
            Manage your QuickCarousals subscription and billing settings
          </p>
        </div>

        {/* Current Plan Section */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your active subscription tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-2xl font-bold" 
                  data-testid="current_plan"
                >
                  {currentTier === 'FREE' && 'Free'}
                  {currentTier === 'CREATOR' && 'Creator'}
                  {currentTier === 'PRO' && 'Pro'}
                </p>
                <p className="text-gray-600 mt-1">
                  {currentTier === 'FREE' && '$0/month'}
                  {currentTier === 'CREATOR' && '$15/month'}
                  {currentTier === 'PRO' && '$39/month'}
                </p>
              </div>
              {currentTier !== 'FREE' && (
                <div className="text-sm text-gray-500">
                  <p>Next billing date: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Available Plans Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {PRICING_TIERS.map((tier) => (
              <Card
                key={tier.tier}
                className={
                  currentTier === tier.tier
                    ? 'border-2 border-blue-500 bg-blue-50/50'
                    : ''
                }
                data-testid={tier.tier === 'CREATOR' ? 'plan_creator' : tier.tier === 'PRO' ? 'plan_pro' : 'plan_free'}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{tier.name}</CardTitle>
                    {currentTier === tier.tier && (
                      <span className="text-sm font-medium text-blue-600">
                        Current Plan
                      </span>
                    )}
                  </div>
                  <CardDescription>
                    <span className="text-3xl font-bold text-gray-900">
                      {tier.price}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {currentTier === tier.tier ? (
                    <Button variant="outline" disabled className="w-full">
                      Current Plan
                    </Button>
                  ) : tier.priceId ? (
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade(tier.priceId!, tier.name)}
                      disabled={upgrading !== null}
                      data-testid="upgrade_button"
                    >
                      {upgrading === tier.priceId ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin">⏳</span> Processing...
                        </span>
                      ) : currentTier === 'FREE' ? (
                        'Upgrade to ' + tier.name
                      ) : (
                        'Switch to ' + tier.name
                      )}
                    </Button>
                  ) : (
                    <Button variant="outline" disabled className="w-full">
                      Current Plan
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Billing Info */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Information</CardTitle>
            <CardDescription>
              Payment method and billing details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {currentTier === 'FREE' ? (
                'No payment method required for the Free plan.'
              ) : (
                'Your payment method is managed through Stripe. To update your payment details or cancel your subscription, please contact support.'
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
