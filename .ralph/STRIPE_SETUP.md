# Stripe Product Setup Guide for QuickCarousals

## Overview

QuickCarousals uses Stripe for subscription billing with two paid tiers:
- **Creator**: $15/month
- **Pro**: $39/month

The Free tier ($0) does not require a Stripe product.

## Prerequisites

1. Stripe account (sign up at https://stripe.com)
2. Stripe API keys (from https://dashboard.stripe.com/apikeys)

## Step-by-Step Setup

### 1. Create Stripe Products

Go to https://dashboard.stripe.com/products and create two products:

#### Product 1: QuickCarousals Creator

- **Name**: QuickCarousals Creator
- **Description**: 30 carousels/month, 15 slides max, no watermark, all 8 style kits, 1 brand kit
- **Pricing**: Recurring
  - **Amount**: $15.00 USD
  - **Billing period**: Monthly
  - **Currency**: USD

After creating, copy:
- Product ID (starts with `prod_...`)
- Price ID (starts with `price_...`)

#### Product 2: QuickCarousals Pro

- **Name**: QuickCarousals Pro
- **Description**: Unlimited carousels, 20 slides max, no watermark, all style kits, 5 brand kits, custom fonts, priority exports
- **Pricing**: Recurring
  - **Amount**: $39.00 USD
  - **Billing period**: Monthly
  - **Currency**: USD

After creating, copy:
- Product ID (starts with `prod_...`)
- Price ID (starts with `price_...`)

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Stripe API Keys
STRIPE_API_KEY='sk_test_...'  # Secret key from dashboard
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY='pk_test_...'  # Publishable key from dashboard
STRIPE_WEBHOOK_SECRET='whsec_...'  # Webhook signing secret (see step 3)

# Creator Tier ($15/mo)
NEXT_PUBLIC_STRIPE_CREATOR_PRODUCT_ID='prod_...'  # Product ID from step 1
NEXT_PUBLIC_STRIPE_CREATOR_PRICE_ID='price_...'  # Price ID from step 1

# Pro Tier ($39/mo)
NEXT_PUBLIC_STRIPE_PRO_PRODUCT_ID='prod_...'  # Product ID from step 1
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID='price_...'  # Price ID from step 1
```

### 3. Set Up Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click "+ Add endpoint"
3. Set endpoint URL to: `https://your-domain.com/api/webhooks/stripe`
   - For local development: Use Stripe CLI (see below)
4. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the "Signing secret" (starts with `whsec_...`)
6. Add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### 4. Local Development with Stripe CLI

For testing webhooks locally:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook signing secret from the output and add to .env.local
```

Alternatively, use the package script:

```bash
cd packages/stripe
bun run dev
```

## Testing the Integration

### Test in Stripe Test Mode

1. Use test card numbers from https://stripe.com/docs/testing
2. Example test card: `4242 4242 4242 4242`
3. Use any future expiration date
4. Use any 3-digit CVC

### Verify Subscription Flow

1. Go to `/en/pricing` on your app
2. Click "Upgrade to Creator" or "Upgrade to Pro"
3. Complete checkout with test card
4. Verify subscription appears in Stripe Dashboard
5. Check that user's `subscriptionTier` in database is updated

## Pricing Tier Features

### Free Tier
- 3 carousels per month
- 8 slides max per carousel
- Watermark on exports
- 3 basic style kits
- No brand kit

### Creator Tier ($15/mo)
- 30 carousels per month
- 15 slides max per carousel
- No watermark
- All 8 style kits
- 1 brand kit
- Standard exports

### Pro Tier ($39/mo)
- Unlimited carousels
- 20 slides max per carousel
- No watermark
- All 8 style kits
- 5 brand kits
- Custom fonts
- Priority export queue

## Production Checklist

Before going live:

- [ ] Switch to Stripe live mode (get live API keys)
- [ ] Create products in live mode (same as test mode steps)
- [ ] Update environment variables with live keys
- [ ] Configure live webhook endpoint
- [ ] Test complete checkout flow in live mode
- [ ] Verify webhook events are received
- [ ] Test subscription cancellation flow
- [ ] Test failed payment handling

## Troubleshooting

### Webhook events not received
- Check webhook endpoint is publicly accessible
- Verify `STRIPE_WEBHOOK_SECRET` matches dashboard
- Check Stripe Dashboard > Webhooks > Events for error logs

### Subscription not updating in database
- Check webhook handler logs for errors
- Verify Prisma schema has correct `SubscriptionTier` enum values
- Check that Profile table is being updated correctly

### Test payments failing
- Verify using test mode API keys
- Use Stripe test card numbers
- Check Stripe Dashboard > Logs for error details

## Resources

- Stripe Dashboard: https://dashboard.stripe.com
- Stripe Testing: https://stripe.com/docs/testing
- Stripe CLI: https://stripe.com/docs/stripe-cli
- Stripe Webhooks: https://stripe.com/docs/webhooks
