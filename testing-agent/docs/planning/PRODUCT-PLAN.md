# Product & Client Features Plan

**Owner:** Patricia (Product Manager)
**Created:** January 5, 2026

---

## P1. Target Market Definition

### Primary: Digital Agencies
- Managing 5-50 client websites
- Need automated QA without dedicated team
- Value: "Find bugs before clients do"

### Secondary: SaaS Companies
- Continuous testing for their product
- Pre-release validation
- Value: "Ship with confidence"

### Tertiary: Enterprise QA Teams
- Augment manual testing
- Regression testing at scale
- Value: "Test more, miss less"

### Buyer Personas

#### Agency Owner (Decision Maker)
- **Goals:** Reduce client complaints, differentiate services
- **Pain:** Manual testing is expensive, bugs hurt reputation
- **Budget:** $200-500/month for tools

#### QA Manager (User)
- **Goals:** Comprehensive coverage, clear reports
- **Pain:** Not enough time, too many sites
- **Budget:** Allocated by management

---

## P2. Pricing Model

### Tier Structure

| Feature | Starter | Professional | Agency |
|---------|---------|--------------|--------|
| **Price** | $49/mo | $199/mo | $499/mo |
| **Websites** | 5 | 25 | Unlimited |
| **Test Runs/mo** | 1,000 | 10,000 | Unlimited |
| **Users** | 2 | 10 | Unlimited |
| **Email Reports** | Yes | Yes | Yes |
| **Slack Integration** | No | Yes | Yes |
| **API Access** | No | Yes | Yes |
| **White-Label** | No | No | Yes |
| **Custom Domains** | No | No | Yes |
| **Priority Support** | No | No | Yes |
| **SLA** | None | 99% | 99.9% |

### Usage-Based Add-ons
- Additional websites: $5/site/month
- Additional test runs: $10 per 1,000
- Extra storage: $5 per 10GB

---

## P3. Onboarding Flow

### Step 1: Signup
```
┌─────────────────────────────────────┐
│         Welcome to QA Agent         │
│                                     │
│  [Sign up with Google]              │
│  [Sign up with GitHub]              │
│                                     │
│  ─────── or ───────                 │
│                                     │
│  Email: [________________]          │
│  Password: [________________]       │
│                                     │
│  [Create Account]                   │
└─────────────────────────────────────┘
```

### Step 2: Organization Setup
```
┌─────────────────────────────────────┐
│      Set Up Your Organization       │
│                                     │
│  Company Name: [________________]   │
│                                     │
│  How many websites do you manage?   │
│  ( ) 1-5                            │
│  ( ) 6-25                           │
│  ( ) 26+                            │
│                                     │
│  [Continue]                         │
└─────────────────────────────────────┘
```

### Step 3: Add First Website
```
┌─────────────────────────────────────┐
│       Add Your First Website        │
│                                     │
│  URL: [https://example.com      ]   │
│                                     │
│  [🔍 Discover Pages]                │
│                                     │
│  Found 24 pages!                    │
│  ✓ Homepage                         │
│  ✓ About (/about)                   │
│  ✓ Contact (/contact)               │
│  ... and 21 more                    │
│                                     │
│  [Generate Test Suite]              │
└─────────────────────────────────────┘
```

### Step 4: First Test Run
```
┌─────────────────────────────────────┐
│      Running Your First Tests       │
│                                     │
│  ████████████░░░░░░░░ 60%           │
│                                     │
│  ✓ Smoke Tests (12/12 passed)       │
│  ⏳ Lighthouse Audit (running...)   │
│  ○ Visual Baseline (pending)        │
│                                     │
│  [View Live Results]                │
└─────────────────────────────────────┘
```

### Step 5: Setup Notifications
```
┌─────────────────────────────────────┐
│      Stay Informed                  │
│                                     │
│  How do you want to receive alerts? │
│                                     │
│  [x] Email (required)               │
│      [your@email.com]               │
│                                     │
│  [ ] Slack                          │
│      [Connect Slack]                │
│                                     │
│  [ ] Webhook                        │
│      [https://your-webhook.com]     │
│                                     │
│  [Complete Setup]                   │
└─────────────────────────────────────┘
```

---

## P4. Scheduled Testing

### Schedule Options

| Schedule | Use Case | Default |
|----------|----------|---------|
| On Deploy | CI/CD webhook trigger | Yes |
| Hourly | High-traffic sites | No |
| Daily | Standard monitoring | Yes |
| Weekly | Low-change sites | No |
| Monthly | Discovery refresh | Yes |

### Configuration UI

```
┌─────────────────────────────────────┐
│    Test Schedule: example.com       │
│                                     │
│  Smoke Tests                        │
│  [x] On webhook  [x] Daily at 6am   │
│                                     │
│  Lighthouse Audits                  │
│  [x] Daily at 6am                   │
│                                     │
│  Visual Regression                  │
│  [x] Weekly on Monday               │
│                                     │
│  Load Tests                         │
│  [ ] Manual only                    │
│                                     │
│  Discovery                          │
│  [x] Monthly on 1st                 │
│                                     │
│  [Save Schedule]                    │
└─────────────────────────────────────┘
```

### Webhook Integration

```javascript
// POST /api/webhook/trigger
{
  "event": "deployment",
  "website_id": "abc123",
  "tests": ["smoke", "lighthouse"],
  "metadata": {
    "commit": "abc123",
    "branch": "main",
    "author": "developer@example.com"
  }
}
```

---

## User Stories

### Epic: Onboarding
- [ ] US-001: As a new user, I can sign up with email or OAuth
- [ ] US-002: As a new user, I can add my first website with URL
- [ ] US-003: As a new user, I see discovered pages automatically
- [ ] US-004: As a new user, I can run my first test with one click
- [ ] US-005: As a new user, I understand results via guided tour

### Epic: Scheduling
- [ ] US-010: As a user, I can schedule tests to run automatically
- [ ] US-011: As a user, I can trigger tests from CI/CD webhook
- [ ] US-012: As a user, I receive alerts when scheduled tests fail
- [ ] US-013: As a user, I can pause/resume scheduled tests

### Epic: Reporting
- [ ] US-020: As a user, I receive daily email summaries
- [ ] US-021: As an agency, I can generate PDF reports for clients
- [ ] US-022: As a user, I can see trends over time
- [ ] US-023: As an agency, I can white-label reports

### Epic: Team Management
- [ ] US-030: As an admin, I can invite team members
- [ ] US-031: As an admin, I can assign roles (admin/member/viewer)
- [ ] US-032: As an admin, I can manage billing
- [ ] US-033: As a member, I can only see assigned websites

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Signup-to-first-test time | < 5 minutes |
| Onboarding completion rate | > 80% |
| Day-7 retention | > 60% |
| Day-30 retention | > 40% |
| Free-to-paid conversion | > 5% |
| NPS Score | > 40 |
