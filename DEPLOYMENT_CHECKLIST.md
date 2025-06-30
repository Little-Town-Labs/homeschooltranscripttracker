# Deployment Checklist

Use this checklist to ensure your Homeschool Transcript Tracker is properly deployed and configured.

## Pre-Deployment Setup

### 1. Repository Preparation
- [ ] Code is committed to GitHub repository
- [ ] `netlify.toml` configuration file is present
- [ ] `@netlify/plugin-nextjs` is installed as dev dependency
- [ ] `.env.example` is updated with all required variables
- [ ] `.env` file is NOT committed to repository

### 2. Database Setup
- [ ] NeonDB database is created and accessible
- [ ] Database schema is deployed (`npm run db:push`)
- [ ] Database connection tested locally
- [ ] Database URL is ready for production

### 3. External Service Configuration

#### Google OAuth Setup
- [ ] Google Cloud Console project created
- [ ] OAuth 2.0 credentials configured
- [ ] Authorized origins include your Netlify domain
- [ ] Authorized redirect URIs include callback URL
- [ ] Client ID and secret are ready

#### Stripe Configuration
- [ ] Stripe account created (sandbox for testing)
- [ ] API keys obtained (publishable and secret)
- [ ] Webhook endpoint configured (will update after deployment)
- [ ] Test cards and scenarios planned

## Netlify Deployment

### 1. Initial Deployment
- [ ] Connected GitHub repository to Netlify
- [ ] Build settings configured (`npm run build`, `.next`)
- [ ] Environment variables added to Netlify
- [ ] Initial deployment successful
- [ ] Site URL noted for configuration updates

### 2. Environment Variables
Add these to Netlify → Site Settings → Environment Variables:

```
DATABASE_URL = [Your NeonDB connection string]
AUTH_SECRET = [Generate with: npx auth secret]
AUTH_GOOGLE_ID = [From Google Cloud Console]
AUTH_GOOGLE_SECRET = [From Google Cloud Console]
NEXTAUTH_URL = [Your Netlify site URL]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = [From Stripe Dashboard]
STRIPE_SECRET_KEY = [From Stripe Dashboard]
STRIPE_WEBHOOK_SECRET = [From Stripe Webhook setup]
```

**Environment Variables Checklist:**
- [ ] `DATABASE_URL` - NeonDB connection string
- [ ] `AUTH_SECRET` - Generated secret for NextAuth
- [ ] `AUTH_GOOGLE_ID` - Google OAuth client ID
- [ ] `AUTH_GOOGLE_SECRET` - Google OAuth client secret
- [ ] `NEXTAUTH_URL` - Your Netlify site URL (https://...)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

## Post-Deployment Configuration

### 1. Update External Services
- [ ] Update Google OAuth authorized origins with Netlify URL
- [ ] Update Google OAuth redirect URIs with Netlify callback URL
- [ ] Update Stripe webhook endpoint URL to Netlify domain
- [ ] Test webhook delivery in Stripe dashboard

### 2. DNS and Domain (Optional)
- [ ] Custom domain configured in Netlify
- [ ] DNS records updated
- [ ] SSL certificate active
- [ ] All URLs updated to use custom domain

## Testing Checklist

### 1. Authentication Testing
- [ ] Can visit site and see landing page
- [ ] Google OAuth login works
- [ ] User session persists after refresh
- [ ] New user gets trial period (30 days)
- [ ] Logout works correctly

### 2. Core Functionality Testing
- [ ] Can create and edit students
- [ ] Can create and edit courses
- [ ] Can record grades and calculate GPA
- [ ] Can add test scores
- [ ] Can generate transcript previews
- [ ] Dashboard displays correct analytics

### 3. Billing System Testing
- [ ] Trial status displays correctly
- [ ] Pricing calculator shows family discounts
- [ ] Stripe checkout process works
- [ ] Subscription creation works
- [ ] Webhooks are received and processed
- [ ] Billing history displays invoices

### 4. API and Database Testing
- [ ] All tRPC endpoints respond correctly
- [ ] Database queries execute without errors
- [ ] Multi-tenant data isolation works
- [ ] Performance is acceptable

## Monitoring Setup

### 1. Basic Monitoring
- [ ] Netlify function logs are accessible
- [ ] Build notifications are configured
- [ ] Error tracking is set up (optional: Sentry)

### 2. External Monitoring
- [ ] Uptime monitoring configured (optional)
- [ ] Stripe webhook monitoring enabled
- [ ] Database connection monitoring

## Security Verification

### 1. Environment Security
- [ ] All secrets are in environment variables (not code)
- [ ] Environment variables are properly configured
- [ ] No sensitive data in client-side code
- [ ] HTTPS is enforced

### 2. Application Security
- [ ] Authentication is working correctly
- [ ] Authorization checks are in place
- [ ] Multi-tenant isolation is verified
- [ ] Webhook signatures are validated

## Performance Optimization

### 1. Initial Optimizations
- [ ] Build times are reasonable (< 5 minutes)
- [ ] Function execution times are acceptable
- [ ] Database queries are optimized
- [ ] Large transcript generation works

### 2. Production Optimizations
- [ ] Static assets are cached properly
- [ ] Database connection pooling is configured
- [ ] Image optimization is working (if applicable)
- [ ] Bundle size is reasonable

## Documentation

### 1. User Documentation
- [ ] User onboarding flow is clear
- [ ] Help documentation is accessible
- [ ] Error messages are user-friendly

### 2. Technical Documentation
- [ ] Deployment guide is current
- [ ] Environment variables are documented
- [ ] API endpoints are documented
- [ ] Troubleshooting guide is available

## Rollback Plan

### 1. Preparation
- [ ] Previous working deployment is identified
- [ ] Rollback procedure is documented
- [ ] Database migration rollback plan exists
- [ ] Emergency contacts are identified

### 2. Monitoring
- [ ] Error rates are being monitored
- [ ] Key functionality is being monitored
- [ ] User feedback channels are active

## Go-Live Checklist

### 1. Pre-Launch
- [ ] All tests pass
- [ ] Stakeholder approval obtained
- [ ] Launch timing confirmed
- [ ] Support team notified

### 2. Launch Day
- [ ] Final deployment completed
- [ ] All systems green
- [ ] Monitoring is active
- [ ] Team is available for support

### 3. Post-Launch
- [ ] Monitor for first 24 hours
- [ ] Address any immediate issues
- [ ] Collect user feedback
- [ ] Plan next iteration

## Troubleshooting Common Issues

### Build Failures
- Check Node.js version (should be 18+)
- Verify all dependencies are installed
- Check for TypeScript errors
- Review build logs in Netlify

### Environment Variable Issues
- Ensure exact variable names match
- No quotes around values in Netlify dashboard
- Redeploy after adding new variables
- Check environment validation in env.js

### Database Connection Issues
- Verify NeonDB allows connections from 0.0.0.0/0
- Check connection string format
- Test connection locally first
- Review function execution logs

### Authentication Issues
- Verify Google OAuth settings
- Check NEXTAUTH_URL matches deployment URL
- Ensure AUTH_SECRET is set
- Test with incognito/private browsing

### Stripe Issues
- Verify webhook URL is correct
- Check webhook secret matches
- Test with Stripe CLI if needed
- Monitor webhook delivery in Stripe dashboard

## Support Contacts

### Technical Support
- Netlify Support: https://support.netlify.com
- NeonDB Support: https://neon.tech/docs/support
- Stripe Support: https://support.stripe.com
- Google Cloud Support: https://cloud.google.com/support

### Emergency Procedures
- [ ] Rollback procedure documented
- [ ] Emergency contact list available
- [ ] Monitoring alerts configured
- [ ] Incident response plan ready