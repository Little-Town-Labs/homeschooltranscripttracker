# Stripe Integration Setup Guide

This guide will help you configure Stripe for the Homeschool Transcript Tracker billing system.

## Prerequisites

- Stripe sandbox account (https://stripe.com)
- Access to your .env file

## Step 1: Create Stripe Products (Optional - Done Automatically)

The application automatically creates products and prices during checkout. However, you can pre-create them in the Stripe dashboard if preferred.

**Recommended Products:**
- Base Product: "Homeschool Transcript Tracker"
- Pricing: $8/student/month with automatic family discounts
- Intervals: Monthly and Annual (with 16.7% discount)

## Step 2: Get Your API Keys

1. **Log into your Stripe Dashboard**
2. **Go to Developers > API Keys**
3. **Copy the following keys:**
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

## Step 3: Create a Webhook Endpoint

1. **Go to Developers > Webhooks in Stripe Dashboard**
2. **Click "Add endpoint"**
3. **Set Endpoint URL:** `https://yourdomain.com/api/webhooks/stripe`
   - For local development: `https://your-ngrok-url.ngrok.io/api/webhooks/stripe`
4. **Select events to listen for:**
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
5. **Click "Add endpoint"**
6. **Copy the Signing Secret** (starts with `whsec_`)

## Step 4: Update Environment Variables

Add these to your `.env` file:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_publishable_key"
STRIPE_SECRET_KEY="sk_test_your_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Required for Stripe redirects
NEXTAUTH_URL="http://localhost:3000"  # or your production domain
```

## Step 5: Test Webhook Locally (Development)

For local development, use ngrok to expose your webhook endpoint:

1. **Install ngrok:** `npm install -g ngrok`
2. **Start your app:** `npm run dev`
3. **In another terminal:** `ngrok http 3000`
4. **Update your Stripe webhook URL** with the ngrok URL
5. **Test webhook events** by creating test subscriptions

## Step 6: Configure Stripe Billing Portal (Optional)

1. **Go to Settings > Billing in Stripe Dashboard**
2. **Enable Customer Portal**
3. **Configure allowed actions:**
   - Update payment method
   - View invoices
   - Cancel subscription
   - Update billing details

## Business Logic Configuration

The app implements the following pricing model:

### Base Pricing
- **$8 per student per month**
- **Family Discounts:**
  - 2 students: 10% off ($7.20 each)
  - 3 students: 15% off ($6.80 each)
  - 4+ students: 20% off ($6.40 each)
- **Annual Discount:** 16.7% off (2 months free)

### Trial Period
- **30 days free trial** for new tenants
- **Full access** during trial
- **Watermarked transcripts** after trial expires (if no subscription)

### Subscription Features
- **Active Subscription:** Full access, unlimited PDF transcripts
- **Trial/No Subscription:** Limited features, watermarked transcripts
- **Automatic Proration:** When changing student count

## Testing

### Test Cards (Stripe Test Mode)
- **Successful payment:** `4242424242424242`
- **Declined payment:** `4000000000000002`
- **Requires authentication:** `4000002500003155`

### Test Scenarios
1. **New subscription** with different student counts
2. **Subscription updates** (add/remove students)
3. **Subscription cancellation** and reactivation
4. **Failed payment** handling
5. **Webhook event processing**

## Production Setup

### Before Going Live:
1. **Switch to live Stripe keys** (remove `_test_` from keys)
2. **Update webhook URL** to production domain
3. **Test all webhook events** in production
4. **Verify SSL certificate** is valid
5. **Set up monitoring** for failed payments

### Security Considerations:
- **Never commit API keys** to version control
- **Use environment variables** for all secrets
- **Verify webhook signatures** (automatically handled)
- **Use HTTPS** for all webhook endpoints

## API Endpoints

The app provides these billing-related endpoints:

### tRPC Routes
- `billing.getSubscriptionStatus` - Current subscription info
- `billing.createCheckoutSession` - Start Stripe checkout
- `billing.updateSubscription` - Cancel/reactivate/update
- `billing.getBillingHistory` - Invoice history
- `billing.createPortalSession` - Stripe customer portal

### REST API
- `POST /api/webhooks/stripe` - Stripe webhook handler

## Troubleshooting

### Common Issues:
1. **Webhook not receiving events:** Check URL and ngrok tunnel
2. **Environment variables not found:** Restart dev server after adding variables
3. **Stripe key errors:** Verify test vs live keys match your environment
4. **CORS errors:** Ensure NEXTAUTH_URL is set correctly

### Debug Tools:
- **Stripe CLI:** `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- **Stripe Dashboard:** Events tab shows webhook delivery status
- **Browser Dev Tools:** Check network tab for API errors

## Support

For Stripe-specific issues:
- **Stripe Documentation:** https://stripe.com/docs
- **Stripe Support:** https://support.stripe.com

For app-specific billing issues:
- Check the browser console and server logs
- Verify environment variables are set correctly
- Test webhook events using Stripe CLI or dashboard