# Refined Pricing Model - Homeschool Transcript Tracker

## Per-Student Pricing Structure

### Core Pricing Model
```javascript
const pricingStructure = {
  basePrice: "$8/month per student",
  trial: {
    duration: "1 month free",
    limitations: ["No transcript printing/PDF export", "Read-only transcripts"]
  },
  multiStudentDiscount: {
    "2 students": "10% discount ($7.20 per student)",
    "3 students": "15% discount ($6.80 per student)", 
    "4+ students": "20% discount ($6.40 per student)"
  },
  annualDiscount: "2 months free (16.7% discount)"
};
```

### Simplified Subscription Tiers

#### Free Trial (1 Month)
- **Cost**: Free
- **Features**: 
  - Full academic tracking (courses, grades, test scores)
  - View transcripts online
  - All data entry and management features
- **Limitations**:
  - Cannot print or export transcripts
  - No PDF generation
  - Watermarked transcript preview

#### Active Subscription
- **Cost**: $8/month per student (with multi-student discounts)
- **Features**:
  - Everything in trial
  - PDF transcript generation
  - Professional transcript printing
  - Export capabilities (PDF, CSV)
  - Email delivery of transcripts
  - Unlimited transcript versions

### Multi-Student Discount Structure

```javascript
const calculateMonthlyPrice = (studentCount) => {
  const basePrice = 8.00;
  let discount = 0;
  
  if (studentCount >= 4) discount = 0.20;      // 20% off
  else if (studentCount === 3) discount = 0.15; // 15% off  
  else if (studentCount === 2) discount = 0.10; // 10% off
  
  const pricePerStudent = basePrice * (1 - discount);
  return studentCount * pricePerStudent;
};

// Examples:
// 1 student: $8.00/month
// 2 students: $14.40/month ($7.20 each)
// 3 students: $20.40/month ($6.80 each)  
// 4 students: $25.60/month ($6.40 each)
// 5 students: $32.00/month ($6.40 each)
```

### Annual Payment Option
- **Discount**: Pay for 10 months, get 12 months (2 months free)
- **Savings**: 16.7% discount on annual plans
- **Billing**: Single annual charge with prorated refunds for cancellation

## Implementation Details

### Trial Experience
```javascript
const trialFeatures = {
  dataEntry: "Full access to add courses, grades, test scores",
  viewing: "Complete online transcript viewing",
  preview: "Watermarked PDF preview of transcript format",
  upgrade: "One-click upgrade to enable printing",
  noCommitment: "Cancel anytime during trial, no charges"
};
```

### Billing Logic
```sql
-- Student billing calculation
CREATE OR REPLACE FUNCTION calculate_monthly_bill(tenant_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    student_count INTEGER;
    base_price DECIMAL := 8.00;
    discount_rate DECIMAL := 0;
    monthly_total DECIMAL;
BEGIN
    -- Count active students for tenant
    SELECT COUNT(*) INTO student_count
    FROM students 
    WHERE tenant_id = tenant_id AND archived = false;
    
    -- Apply multi-student discount
    IF student_count >= 4 THEN
        discount_rate := 0.20;
    ELSIF student_count = 3 THEN
        discount_rate := 0.15;
    ELSIF student_count = 2 THEN
        discount_rate := 0.10;
    END IF;
    
    monthly_total := student_count * base_price * (1 - discount_rate);
    RETURN monthly_total;
END;
$$ LANGUAGE plpgsql;
```

### Feature Gating Implementation
```javascript
const checkTranscriptAccess = (tenant, action) => {
  const subscription = tenant.subscription;
  
  switch(action) {
    case 'VIEW_ONLINE':
      return true; // Always allowed, including trial
      
    case 'GENERATE_PDF':
    case 'PRINT_TRANSCRIPT':
    case 'EMAIL_TRANSCRIPT':
      return subscription.status === 'active' && !subscription.trial;
      
    case 'EXPORT_DATA':
      return subscription.status === 'active' && !subscription.trial;
      
    default:
      return true; // Data entry always allowed
  }
};
```

## Competitive Positioning

### Value Proposition
- **Transparent Pricing**: Simple per-student model, no hidden fees
- **Fair Trial**: Full month to evaluate, not just 14 days
- **Family Friendly**: Significant discounts for multiple children
- **No Lock-in**: Monthly subscriptions, cancel anytime
- **Complete Solution**: Everything needed for transcript management

### Pricing Comparison
```javascript
const competitorAnalysis = {
  "Homeschool Tracker": "$59.95 one-time (outdated interface)",
  "MySchoolYear": "$12.99/month (all students, limited features)",
  "Scholaric": "$7.95/month (per family, basic features)",
  "Our Solution": "$8/month per student (comprehensive, modern)"
};
```

## Revenue Projections

### Unit Economics
```javascript
const unitEconomics = {
  averageStudentsPerFamily: 2.3,
  averageMonthlyRevenue: "$16.56", // 2.3 students with 10% discount
  annualCustomerValue: "$198.72",
  estimatedLifetime: "4 years", // High school duration
  customerLTV: "$794.88"
};
```

### Growth Projections
```javascript
const revenueProjections = {
  "Month 6": { families: 50, students: 115, revenue: "$828/month" },
  "Year 1": { families: 200, students: 460, revenue: "$3,312/month" },
  "Year 2": { families: 1000, students: 2300, revenue: "$16,560/month" },
  "Year 3": { families: 3000, students: 6900, revenue: "$49,680/month" },
  "Year 5": { families: 8000, students: 18400, revenue: "$132,480/month" }
};
```

## Billing Implementation Strategy

### Stripe Integration
```javascript
const stripeConfiguration = {
  products: {
    student: "Student Subscription",
    pricing: "Per-seat pricing model"
  },
  billing: {
    interval: "month",
    proration: true, // Auto-adjust when adding/removing students
    trial: 30 // 30-day trial period
  },
  discounts: {
    multiStudent: "Automatic quantity-based discounts",
    annual: "Annual subscription discount coupon"
  }
};
```

### Proration Logic
- **Add Student Mid-Month**: Prorated charge for remaining days
- **Remove Student**: Credit applied to next billing cycle
- **Plan Changes**: Immediate adjustment with prorated billing

### Payment Recovery
```javascript
const paymentRecovery = {
  failedPayment: {
    retry: "3 automatic retries over 7 days",
    grace: "7-day grace period before suspension",
    notification: "Email alerts to primary guardian"
  },
  suspension: {
    access: "Read-only access during suspension",
    restoration: "Immediate restoration upon payment",
    cancellation: "Account cancelled after 30 days suspended"
  }
};
```

## Customer Communication

### Pricing Page Copy
```markdown
## Simple, Fair Pricing

**$8 per student per month**
- 1-month free trial
- Multi-student discounts up to 20%
- Annual plans save 2 months
- Cancel anytime

### Free Trial Includes:
✅ Complete academic tracking
✅ Online transcript viewing  
✅ All data management features

### Paid Subscription Adds:
📄 PDF transcript generation
🖨️ Professional printing
📧 Email delivery
💾 Data export tools

**No contracts. No setup fees. No surprises.**
```

### Upgrade Prompts
```javascript
const upgradePrompts = {
  transcriptView: "Love your transcript? Upgrade to print and share it!",
  trialEnding: "Your trial ends in 3 days. Upgrade to keep transcript access.",
  addStudent: "Adding another student? Get 10% off with multi-student pricing!"
};
```

## Success Metrics

### Key Performance Indicators
```javascript
const kpis = {
  conversion: {
    trialToSub: "Target 25% trial-to-paid conversion",
    churn: "Target <5% monthly churn rate"
  },
  revenue: {
    arpu: "Average Revenue Per User per month",
    expansion: "Revenue growth from existing customers",
    lifetime: "Customer lifetime value tracking"
  },
  product: {
    transcriptGeneration: "% of customers generating transcripts",
    multiStudent: "% of customers with multiple students",
    annual: "% choosing annual vs monthly billing"
  }
};
```

### Pricing Optimization
- **A/B Testing**: Test different price points and discount structures
- **Cohort Analysis**: Track retention by pricing tier and student count
- **Usage Analytics**: Understand which features drive value
- **Customer Feedback**: Regular surveys on pricing satisfaction

This simplified, per-student pricing model eliminates complexity while maximizing revenue potential and family affordability.