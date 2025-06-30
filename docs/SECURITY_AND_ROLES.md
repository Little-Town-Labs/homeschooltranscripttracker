# Security Architecture & User Roles - Homeschool Transcript Tracker

## User Role Hierarchy

### 1. Primary Guardian (Owner)
- **Definition**: The first parent/guardian who creates the account
- **Permissions**: Full administrative access
- **Responsibilities**: Account management, billing (if applicable), guardian invitations

### 2. Guardian (Co-Parent/Authorized Adult)
- **Definition**: Additional parents/guardians invited by the Primary Guardian
- **Permissions**: Academic data management only
- **Limitations**: Cannot delete account or manage other guardians

### 3. Student
- **Definition**: The homeschooled children whose transcripts are being tracked
- **Permissions**: Read-only access to their own academic records
- **Limitations**: Cannot modify any data

## Detailed Permission Matrix

| Action | Primary Guardian | Guardian | Student |
|--------|------------------|----------|---------|
| **Account Management** |
| Create account | ✅ | ❌ | ❌ |
| Delete account | ✅ | ❌ | ❌ |
| Update account settings | ✅ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ |
| **Guardian Management** |
| Invite guardians | ✅ | ❌ | ❌ |
| Remove guardians | ✅ | ❌ | ❌ |
| View guardian list | ✅ | ✅ | ❌ |
| **Student Management** |
| Add students | ✅ | ✅ | ❌ |
| Edit student profiles | ✅ | ✅ | ❌ |
| Delete students | ✅ | ❌ | ❌ |
| Invite students | ✅ | ✅ | ❌ |
| **Academic Data** |
| Create courses | ✅ | ✅ | ❌ |
| Update courses | ✅ | ✅ | ❌ |
| Delete courses | ✅ | ✅ | ❌ |
| Add grades | ✅ | ✅ | ❌ |
| Update grades | ✅ | ✅ | ❌ |
| Delete grades | ✅ | ✅ | ❌ |
| Add test scores | ✅ | ✅ | ❌ |
| Update test scores | ✅ | ✅ | ❌ |
| Delete test scores | ✅ | ✅ | ❌ |
| **Viewing Data** |
| View all students | ✅ | ✅ | Own only |
| View transcripts | ✅ | ✅ | Own only |
| Generate transcripts | ✅ | ✅ | ❌ |
| Export data | ✅ | ✅ | Own only |

## Security Architecture

### Authentication System

#### Multi-Factor Authentication (MFA)
- **Required for**: Primary Guardians
- **Optional for**: Guardians (but recommended)
- **Methods**: 
  - Email verification
  - SMS verification
  - Authenticator apps (Google Authenticator, Authy)

#### Password Requirements
- Minimum 12 characters
- Must include: uppercase, lowercase, numbers, special characters
- Password strength meter during registration
- Forced password updates every 180 days for guardians
- Password history (cannot reuse last 5 passwords)

#### Session Management
- **Session timeout**: 60 minutes of inactivity for guardians, 30 minutes for students
- **Concurrent sessions**: Maximum 3 devices per user
- **Session invalidation**: On password change, role change, or suspicious activity

### Authorization & Access Control

#### Role-Based Access Control (RBAC)
```javascript
// Example permission structure
{
  "primaryGuardian": {
    "account": ["create", "read", "update", "delete"],
    "guardians": ["invite", "remove", "view"],
    "students": ["create", "read", "update", "delete", "invite"],
    "academics": ["create", "read", "update", "delete"],
    "transcripts": ["generate", "view", "export"]
  },
  "guardian": {
    "account": ["read"],
    "guardians": ["view"],
    "students": ["create", "read", "update", "invite"],
    "academics": ["create", "read", "update", "delete"],
    "transcripts": ["generate", "view", "export"]
  },
  "student": {
    "account": ["read_own"],
    "students": ["read_own"],
    "academics": ["read_own"],
    "transcripts": ["view_own", "export_own"]
  }
}
```

#### Data Isolation
- **Family-level isolation**: Users can only access data for their family
- **Student-level isolation**: Students can only access their own records
- **Row-level security**: Database-enforced data access controls

### Guardian Invitation System

#### Invitation Process
1. **Primary Guardian initiates**: Enters email of guardian to invite
2. **System validation**: Checks if email already exists in system
3. **Secure invitation**: Generates time-limited, cryptographically secure invitation token
4. **Email delivery**: Sends invitation email with secure link
5. **Guardian acceptance**: Invited guardian creates account via secure link
6. **Account linking**: New guardian account linked to family

#### Invitation Security
- **Token expiration**: 72 hours
- **Single-use tokens**: Token invalidated after use
- **Email verification**: Required before account activation
- **Audit trail**: All invitations logged with timestamps

#### Invitation States
- **Pending**: Invitation sent, not yet accepted
- **Accepted**: Guardian has created account and joined family
- **Expired**: Invitation token has expired
- **Revoked**: Primary guardian cancelled invitation

### Data Security

#### Encryption
- **At Rest**: AES-256 encryption for database
- **In Transit**: TLS 1.3 for all communications
- **PII Encryption**: Additional encryption layer for sensitive data (SSN, addresses)
- **Key Management**: Automated key rotation every 90 days

#### Data Privacy
- **FERPA Compliance**: Educational record privacy requirements
- **COPPA Considerations**: Privacy protections for students under 13
- **Data Minimization**: Collect only necessary information
- **Right to Delete**: Account deletion removes all family data

#### Backup & Recovery
- **Automated Backups**: Daily encrypted backups
- **Geographic Distribution**: Backups stored in multiple regions
- **Recovery Testing**: Monthly backup restoration tests
- **Point-in-time Recovery**: Ability to restore to specific timestamps

### Audit & Monitoring

#### Activity Logging
```javascript
// Example audit log entry
{
  "timestamp": "2024-01-15T10:30:00Z",
  "userId": "guardian_123",
  "action": "UPDATE_GRADE",
  "resource": "course_456",
  "details": {
    "studentId": "student_789",
    "courseId": "course_456",
    "oldGrade": "B+",
    "newGrade": "A-",
    "semester": "Fall 2023"
  },
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "result": "SUCCESS"
}
```

#### Monitored Events
- Login/logout activities
- Password changes
- Permission changes
- Data modifications (grades, courses, test scores)
- Transcript generations
- Account invitations
- Failed authentication attempts
- Suspicious activities

#### Security Alerts
- **Multiple failed logins**: Account temporarily locked
- **Unusual access patterns**: Email notification to guardians
- **Data export activities**: Logged and monitored
- **Permission escalation attempts**: Immediate alert and investigation

### Student Access Controls

#### Student Account Creation
- **Guardian-initiated**: Only guardians can create student accounts
- **Email verification**: Students must verify their email
- **Age verification**: Different permissions based on age
- **Parental consent**: Required for students under 18

#### Student Permissions
- **Read-only access**: Cannot modify any academic data
- **Personal dashboard**: View their own grades, courses, and progress
- **Transcript viewing**: Can view but not generate their transcripts
- **No admin functions**: Cannot invite others or change settings

#### Student Session Security
- **Shorter sessions**: 30-minute timeout
- **Limited concurrent sessions**: Maximum 2 devices
- **Activity monitoring**: All student actions logged
- **Restricted exports**: Can view but not download certain data

### Compliance & Legal

#### Educational Privacy
- **FERPA Compliance**: Strict controls on educational record access
- **Parent/Guardian Rights**: Clear definition of who can access records
- **Student Rights**: Age-appropriate access to their own records

#### Data Governance
- **Data Retention**: Clear policies on how long data is kept
- **Data Portability**: Ability to export family data
- **Data Deletion**: Complete removal upon account closure
- **Transparency**: Clear privacy policies and terms of service

### Implementation Security Checklist

#### Authentication
- [ ] Implement strong password requirements
- [ ] Add multi-factor authentication
- [ ] Set up session management
- [ ] Create account lockout policies

#### Authorization
- [ ] Implement role-based access control
- [ ] Set up data isolation rules
- [ ] Create permission verification middleware
- [ ] Test privilege escalation prevention

#### Data Protection
- [ ] Enable database encryption
- [ ] Implement API encryption
- [ ] Set up secure key management
- [ ] Create data backup procedures

#### Monitoring
- [ ] Implement comprehensive logging
- [ ] Set up security alerts
- [ ] Create audit trail system
- [ ] Establish incident response procedures

#### Compliance
- [ ] Review FERPA requirements
- [ ] Implement privacy controls
- [ ] Create data governance policies
- [ ] Establish legal compliance procedures

## Security Testing Strategy

### Penetration Testing
- **Frequency**: Quarterly professional penetration tests
- **Scope**: Authentication, authorization, data access, injection attacks
- **Remediation**: 30-day timeline for critical vulnerabilities

### Vulnerability Management
- **Dependency scanning**: Automated checks for vulnerable libraries
- **Code analysis**: Static and dynamic code analysis
- **Regular updates**: Prompt security patch deployment

### Security Training
- **Developer training**: Secure coding practices
- **User education**: Security best practices for guardians
- **Incident response**: Regular drills and training exercises