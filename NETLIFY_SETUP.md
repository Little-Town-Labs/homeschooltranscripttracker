# Netlify Deployment Guide

This guide will help you deploy the Homeschool Transcript Tracker to Netlify with full functionality including serverless functions, database connections, and Stripe integration.

## Prerequisites

- GitHub repository with your code
- Netlify account (https://netlify.com)
- NeonDB database (already configured)
- Stripe sandbox account

## Step 1: Prepare Your Repository

### 1.1 Create netlify.toml Configuration

Create a `netlify.toml` file in your project root:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NEXT_TELEMETRY_DISABLED = "1"
  NETLIFY_NEXT_PLUGIN_SKIP = "false"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[functions]
  node_bundler = "esbuild"
```

### 1.2 Update Package.json Scripts

Ensure your `package.json` has the correct build script:

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "dev": "next dev --turbo"
  }
}
```

### 1.3 Install Netlify Plugin

```bash
npm install -D @netlify/plugin-nextjs
```

## Step 2: Database Configuration

### 2.1 Verify Environment Variables

Ensure your `.env` file contains all required variables (don't commit this file):

```bash
# Database
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Auth
AUTH_SECRET="your-auth-secret"
AUTH_GOOGLE_ID="your-google-oauth-id"
AUTH_GOOGLE_SECRET="your-google-oauth-secret"
NEXTAUTH_URL="https://your-app-name.netlify.app"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_publishable_key"
STRIPE_SECRET_KEY="sk_test_your_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
```

### 2.2 Update Google OAuth Settings

1. **Go to Google Cloud Console** → API & Services → Credentials
2. **Edit your OAuth 2.0 Client**
3. **Add Authorized Origins:**
   - `https://your-app-name.netlify.app`
4. **Add Authorized Redirect URIs:**
   - `https://your-app-name.netlify.app/api/auth/callback/google`

## Step 3: Deploy to Netlify

### 3.1 Connect Repository

1. **Log into Netlify Dashboard**
2. **Click "New site from Git"**
3. **Choose GitHub** and authorize Netlify
4. **Select your repository**
5. **Configure build settings:**
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Node version:** 18 or higher

### 3.2 Add Environment Variables

In Netlify Dashboard → Site Settings → Environment Variables, add:

```
DATABASE_URL = postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
AUTH_SECRET = your-generated-secret
AUTH_GOOGLE_ID = your-google-oauth-id
AUTH_GOOGLE_SECRET = your-google-oauth-secret
NEXTAUTH_URL = https://your-app-name.netlify.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_your_publishable_key
STRIPE_SECRET_KEY = sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET = whsec_your_webhook_secret
```

### 3.3 Deploy

1. **Click "Deploy site"**
2. **Wait for build to complete** (check build logs for errors)
3. **Note your Netlify URL** (e.g., `https://amazing-app-123456.netlify.app`)

## Step 4: Post-Deployment Configuration

### 4.1 Update Stripe Webhook URL

1. **Go to Stripe Dashboard** → Developers → Webhooks
2. **Edit your webhook endpoint**
3. **Update URL to:** `https://your-app-name.netlify.app/api/webhooks/stripe`
4. **Test the endpoint** by triggering a test event

### 4.2 Update NEXTAUTH_URL

1. **In Netlify Dashboard** → Site Settings → Environment Variables
2. **Update NEXTAUTH_URL** to your actual Netlify URL
3. **Redeploy** to apply changes

### 4.3 Custom Domain (Optional)

1. **In Netlify Dashboard** → Site Settings → Domain Management
2. **Add custom domain**
3. **Update DNS settings** as instructed
4. **Update all URLs** in Google OAuth, Stripe, and environment variables

## Step 5: Database Setup on Production

### 5.1 Run Database Migrations

Since you're using Drizzle, you have a few options:

**Option A: Run locally against production DB**
```bash
# Update .env with production DATABASE_URL temporarily
npm run db:push
```

**Option B: Use Netlify Dev for migrations**
```bash
npm install -g netlify-cli
netlify dev
# Then run migrations in local environment connected to production
```

### 5.2 Verify Database Connection

Check the Netlify function logs to ensure database connections are working:
1. **Go to Netlify Dashboard** → Functions
2. **Check logs** for any database connection errors
3. **Test API endpoints** through your app

## Step 6: Testing Checklist

### 6.1 Authentication Testing
- [ ] Google OAuth login works
- [ ] User sessions persist correctly
- [ ] Tenant creation happens on first login
- [ ] Logout functionality works

### 6.2 Core Functionality Testing
- [ ] Student creation and management
- [ ] Course creation and management
- [ ] Grade entry and GPA calculations
- [ ] Test score tracking
- [ ] Transcript generation (preview mode)

### 6.3 Billing System Testing
- [ ] Subscription status displays correctly
- [ ] Stripe checkout process works
- [ ] Webhook events are received and processed
- [ ] Trial period countdown functions
- [ ] Billing history displays

### 6.4 Performance Testing
- [ ] Page load times are acceptable
- [ ] API responses are fast
- [ ] Database queries perform well
- [ ] Large transcript generation works

## Step 7: Monitoring and Maintenance

### 7.1 Set Up Monitoring

1. **Netlify Analytics** (built-in)
2. **Netlify Functions logs** for API monitoring
3. **External monitoring** (optional):
   - Uptime monitoring (UptimeRobot, Pingdom)
   - Error tracking (Sentry)

### 7.2 Regular Maintenance

- **Monitor function execution times**
- **Check for failed webhook deliveries** in Stripe
- **Review error logs** regularly
- **Update dependencies** periodically

## Troubleshooting

### Common Issues and Solutions

#### Build Failures
```bash
# Check Node version
node --version  # Should be 18+

# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Environment Variable Issues
- **Check variable names** match exactly (case-sensitive)
- **Redeploy after adding** new environment variables
- **Verify no quotes** around values in Netlify dashboard

#### Database Connection Issues
```bash
# Test connection locally
npm run db:studio

# Check if IP is whitelisted in NeonDB
# Netlify uses dynamic IPs, so whitelist 0.0.0.0/0 for development
```

#### Function Timeout Issues
- **Default timeout:** 10 seconds
- **Upgrade plan** for longer timeouts if needed
- **Optimize database queries** for better performance

#### Stripe Webhook Issues
- **Check webhook URL** is correct
- **Verify webhook secret** matches
- **Test webhook** with Stripe CLI:
```bash
stripe listen --forward-to https://your-app.netlify.app/api/webhooks/stripe
```

### Environment-Specific Configurations

#### Development vs Production
```javascript
// next.config.js adjustments for Netlify
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true // For static export if needed
  }
}
```

## Security Considerations

### Production Security Checklist
- [ ] **Environment variables** are properly secured
- [ ] **Database credentials** use strong passwords
- [ ] **API endpoints** have proper authentication
- [ ] **Webhook signatures** are verified
- [ ] **HTTPS** is enforced everywhere
- [ ] **CORS settings** are properly configured

### Netlify-Specific Security
- [ ] **Form handling** disabled if not needed
- [ ] **Function access** is properly restricted
- [ ] **Build hooks** are kept secret
- [ ] **Deploy previews** don't expose sensitive data

## Performance Optimization

### Netlify-Specific Optimizations
1. **Enable build plugins** for optimization
2. **Use Netlify CDN** for static assets
3. **Enable compression** in headers
4. **Optimize images** using Netlify Image CDN

### Headers Configuration
Add to `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

## Backup and Recovery

### Database Backups
- **NeonDB automatic backups** (check your plan)
- **Export important data** periodically
- **Test restore procedures**

### Application Backups
- **GitHub repository** serves as code backup
- **Environment variables** backup (securely)
- **Deployment configurations** backup

## Going Live

### Final Production Checklist
- [ ] **Switch to live Stripe keys**
- [ ] **Update Google OAuth** to production domains
- [ ] **Configure custom domain** and SSL
- [ ] **Set up monitoring** and alerts
- [ ] **Test all critical paths** thoroughly
- [ ] **Prepare support documentation**
- [ ] **Set up customer support** processes

### Launch Day
1. **Final deployment** with production settings
2. **Smoke test** all functionality
3. **Monitor logs** closely for first few hours
4. **Have rollback plan** ready if needed

## Support Resources

- **Netlify Documentation:** https://docs.netlify.com/
- **Netlify Community:** https://community.netlify.com/
- **Next.js on Netlify:** https://docs.netlify.com/frameworks/next-js/
- **Netlify Functions:** https://docs.netlify.com/functions/overview/

For application-specific issues, check the project documentation and ensure all environment variables are correctly configured.