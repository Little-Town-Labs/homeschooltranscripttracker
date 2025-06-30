# SaaS Architecture - Homeschool Transcript Tracker

## Multi-Tenant SaaS Model

### Tenant Structure
- **Tenant**: Individual homeschool family account
- **Multi-tenancy**: Complete data isolation between families
- **Tenant ID**: Unique identifier for each family account

## Extended Role Hierarchy

### 1. Super Admin (Platform Administrator)
- **Definition**: Platform owners/developers who manage the entire SaaS application
- **Scope**: Global access across all tenants
- **Responsibilities**: Platform maintenance, user support, billing management

### 2. Support Admin
- **Definition**: Customer support representatives
- **Scope**: Limited access to assist customers
- **Responsibilities**: Technical support, account assistance (with customer consent)

### 3. Primary Guardian (Tenant Owner)
- **Definition**: The paying customer who owns the family account
- **Scope**: Full access within their tenant
- **Responsibilities**: Subscription management, family account administration

### 4. Guardian (Tenant User)
- **Definition**: Additional parents/guardians within the family
- **Scope**: Academic data management within their tenant
- **Responsibilities**: Student data management

### 5. Student (Tenant Viewer)
- **Definition**: Students within the family
- **Scope**: Read-only access to their own data within tenant
- **Responsibilities**: View their academic progress

## Comprehensive Permission Matrix

| Action | Super Admin | Support Admin | Primary Guardian | Guardian | Student |
|--------|-------------|---------------|------------------|----------|---------|
| **Platform Management** |
| Manage all tenants | ✅ | ❌ | ❌ | ❌ | ❌ |
| View system metrics | ✅ | ✅ | ❌ | ❌ | ❌ |
| Platform configuration | ✅ | ❌ | ❌ | ❌ | ❌ |
| User impersonation | ✅ | ✅* | ❌ | ❌ | ❌ |
| **Subscription Management** |
| View all subscriptions | ✅ | ✅ | ❌ | ❌ | ❌ |
| Modify subscriptions | ✅ | ✅* | ❌ | ❌ | ❌ |
| Handle billing issues | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Tenant Account Management** |
| Create tenant account | ✅ | ❌ | Self-signup | ❌ | ❌ |
| Delete tenant account | ✅ | ❌ | ✅ | ❌ | ❌ |
| Manage subscription | ✅ | ✅* | ✅ | ❌ | ❌ |
| Update billing info | ✅ | ✅* | ✅ | ❌ | ❌ |
| **Guardian Management** |
| Invite guardians | ❌ | ❌ | ✅ | ❌ | ❌ |
| Remove guardians | ❌ | ❌ | ✅ | ❌ | ❌ |
| View guardian list | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Student Management** |
| Add students | ❌ | ❌ | ✅ | ✅ | ❌ |
| Edit student profiles | ❌ | ❌ | ✅ | ✅ | ❌ |
| Delete students | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Academic Data** |
| Create courses | ❌ | ❌ | ✅ | ✅ | ❌ |
| Update courses | ❌ | ❌ | ✅ | ✅ | ❌ |
| Delete courses | ❌ | ❌ | ✅ | ✅ | ❌ |
| Manage grades | ❌ | ❌ | ✅ | ✅ | ❌ |
| View academic data | ✅** | ✅** | ✅ | ✅ | Own only |

*With customer consent/approval  
**For support purposes only

## Multi-Tenancy Implementation

### Data Isolation Strategy

#### Tenant-Based Row Level Security (RLS)
```sql
-- Example RLS policy for students table
CREATE POLICY tenant_isolation ON students
    FOR ALL TO application_role
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Example RLS policy for courses table
CREATE POLICY tenant_isolation ON courses
    FOR ALL TO application_role
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

#### Database Schema with Tenant ID
```sql
-- All tenant-specific tables include tenant_id
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subscription_status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    -- other fields...
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    -- other fields...
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Subscription Management

#### Subscription Tiers
```javascript
const SUBSCRIPTION_TIERS = {
  TRIAL: {
    name: "Free Trial",
    duration: "14 days",
    maxStudents: 2,
    maxGuardians: 2,
    features: ["basic_transcripts", "grade_tracking"]
  },
  BASIC: {
    name: "Basic Family",
    price: "$9.99/month",
    maxStudents: 3,
    maxGuardians: 4,
    features: ["basic_transcripts", "grade_tracking", "test_scores"]
  },
  PREMIUM: {
    name: "Large Family",
    price: "$19.99/month",
    maxStudents: 10,
    maxGuardians: 6,
    features: ["advanced_transcripts", "grade_tracking", "test_scores", "analytics", "export_tools"]
  },
  ENTERPRISE: {
    name: "Co-op/Group",
    price: "$49.99/month",
    maxStudents: 50,
    maxGuardians: 20,
    features: ["all_features", "bulk_operations", "api_access", "priority_support"]
  }
};
```

#### Billing Integration
- **Payment Processor**: Stripe for subscription management
- **Billing Cycles**: Monthly and yearly options
- **Prorate**: Automatic proration for plan changes
- **Grace Period**: 7-day grace period for failed payments
- **Cancellation**: Immediate cancellation with data retention for 30 days

## Admin Dashboard Features

### Super Admin Dashboard

#### System Overview
- **Active Tenants**: Total number of active subscriptions
- **Revenue Metrics**: MRR, ARR, churn rate
- **System Health**: Database performance, API response times
- **Usage Statistics**: Storage usage, API calls, feature adoption

#### User Management
- **Tenant Directory**: Searchable list of all tenants
- **User Impersonation**: Ability to login as any user (with audit trail)
- **Account Management**: Create, suspend, or delete tenant accounts
- **Billing Override**: Adjust billing for specific accounts

#### Support Tools
```javascript
// Example admin actions
const adminActions = {
  // Tenant management
  createTenant: (tenantData) => {},
  suspendTenant: (tenantId, reason) => {},
  deleteTenant: (tenantId, dataRetention) => {},
  
  // User support
  impersonateUser: (userId, reason) => {},
  resetUserPassword: (userId) => {},
  extendTrial: (tenantId, days) => {},
  
  // Billing management
  adjustBilling: (tenantId, adjustment) => {},
  refundPayment: (paymentId, amount) => {},
  updateSubscription: (tenantId, newPlan) => {}
};
```

### Support Admin Dashboard

#### Customer Support Interface
- **Ticket Management**: Integration with support ticketing system
- **Customer Lookup**: Search customers by email, name, or tenant ID
- **Account Overview**: Quick view of customer's subscription and usage
- **Limited Actions**: Password resets, trial extensions (with approval)

#### Support Actions (Require Customer Consent)
```javascript
const supportActions = {
  // Account assistance
  resetPassword: (userId, customerConsent) => {},
  extendTrial: (tenantId, days, approvalCode) => {},
  viewAccountDetails: (tenantId, consentToken) => {},
  
  // Billing assistance
  updatePaymentMethod: (tenantId, customerConsent) => {},
  applyDiscount: (tenantId, discountCode, approval) => {},
  processRefund: (paymentId, amount, managerApproval) => {}
};
```

## SaaS Security Enhancements

### Enhanced Authentication
- **SSO Integration**: Google, Microsoft, Apple Sign-In
- **SAML Support**: For enterprise customers
- **API Keys**: For enterprise integrations
- **Rate Limiting**: Prevent abuse and ensure fair usage

### Audit and Compliance
```javascript
// Enhanced audit logging for SaaS
const auditLog = {
  timestamp: "2024-01-15T10:30:00Z",
  tenantId: "tenant_123",
  userId: "user_456",
  userRole: "guardian",
  action: "UPDATE_GRADE",
  resource: "course_789",
  adminAction: false, // true if performed by admin
  impersonation: false, // true if admin impersonating user
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  details: {
    oldValue: "B+",
    newValue: "A-",
    reason: "Corrected calculation error"
  }
};
```

### Data Protection
- **GDPR Compliance**: Right to be forgotten, data portability
- **Data Residency**: Option to store data in specific regions
- **Backup Strategy**: Per-tenant backup and recovery
- **Encryption**: Additional encryption layer for sensitive data

## Subscription Enforcement

### Feature Gating
```javascript
// Example feature gate middleware
const checkSubscriptionLimit = (feature, tenantId) => {
  const tenant = getTenant(tenantId);
  const subscription = getSubscription(tenant.subscriptionId);
  
  switch(feature) {
    case 'ADD_STUDENT':
      return tenant.studentCount < subscription.maxStudents;
    case 'ADVANCED_REPORTS':
      return subscription.features.includes('analytics');
    case 'API_ACCESS':
      return subscription.tier === 'ENTERPRISE';
    default:
      return true;
  }
};
```

### Usage Monitoring
- **Student Limits**: Enforce per-plan student limits
- **Storage Limits**: Monitor file storage usage
- **API Rate Limits**: Prevent abuse of API endpoints
- **Feature Access**: Control access to premium features

## Business Intelligence

### Analytics Dashboard
- **Customer Metrics**: Acquisition, retention, churn
- **Usage Patterns**: Feature adoption, user engagement
- **Revenue Analysis**: MRR trends, upgrade/downgrade patterns
- **Support Metrics**: Ticket volume, resolution time

### Reporting
- **Financial Reports**: Revenue, refunds, tax reporting
- **Usage Reports**: Feature utilization, storage usage
- **Support Reports**: Customer satisfaction, issue trends
- **Security Reports**: Failed logins, suspicious activity

## Implementation Considerations

### Technology Stack Updates
```javascript
// SaaS-specific technology additions
const saasStack = {
  // Subscription management
  billing: "Stripe",
  
  // Multi-tenancy
  database: "NeonDB with RLS policies",
  caching: "Redis with tenant isolation",
  
  // Monitoring
  analytics: "PostHog or Mixpanel",
  monitoring: "DataDog or New Relic",
  logging: "Structured JSON logs",
  
  // Support
  helpdesk: "Intercom or Zendesk",
  notifications: "SendGrid for emails"
};
```

### Deployment Architecture
- **Environment Separation**: Dev, staging, production
- **Database Migrations**: Tenant-aware migration system
- **Feature Flags**: Gradual rollout of new features
- **Load Balancing**: Handle multiple tenants efficiently

### Customer Onboarding
1. **Self-Service Signup**: Automated account creation
2. **Trial Period**: 14-day free trial
3. **Guided Setup**: Tutorial for first-time users
4. **Payment Collection**: Seamless subscription activation
5. **Data Migration**: Import existing data (if applicable)