# Test Strategy Plan

**Owner:** Tara (Test Architect)
**Created:** January 5, 2026

---

## T1. Test Pyramid Implementation

### Recommended Test Frequencies

```
                    ┌───────────────┐
                    │ Load Tests    │ ← Before launches
                    │ (k6)          │   Manual trigger
                    └───────────────┘
                   ┌─────────────────┐
                   │ Visual          │ ← Weekly
                   │ Regression      │   Saturday 2am
                   └─────────────────┘
                  ┌───────────────────┐
                  │ Lighthouse        │ ← Daily
                  │ Audits            │   6am local time
                  └───────────────────┘
                 ┌─────────────────────┐
                 │ Smoke Tests         │ ← On deploy + Daily
                 │ (Playwright)        │   Via webhook
                 └─────────────────────┘
                ┌───────────────────────┐
                │ Discovery             │ ← Monthly
                │ (Crawl all pages)     │   1st of month
                └───────────────────────┘
```

### Scheduling Configuration

```javascript
// services/scheduler.js
const scheduleConfig = {
  discovery: {
    cron: '0 3 1 * *',  // Monthly, 1st at 3am
    timeout: 1800000,    // 30 minutes
    retries: 2
  },
  smoke: {
    cron: '0 6 * * *',  // Daily at 6am
    onWebhook: true,     // Also on deploy
    timeout: 300000,     // 5 minutes
    retries: 3
  },
  lighthouse: {
    cron: '0 6 * * *',  // Daily at 6am
    timeout: 180000,     // 3 minutes per page
    retries: 2
  },
  visualRegression: {
    cron: '0 2 * * 6',  // Weekly, Saturday 2am
    timeout: 600000,     // 10 minutes
    retries: 1
  },
  loadTest: {
    cron: null,          // Manual only
    timeout: 900000,     // 15 minutes
    retries: 0
  }
};
```

---

## T2. Client Testing Templates

### E-Commerce Template

```yaml
name: E-Commerce Site
description: Comprehensive testing for online stores
pages:
  critical:
    - path: /
      name: Homepage
      checks:
        - pageLoads
        - noConsoleErrors
        - mainNavVisible
        - searchWorks

    - path: /products
      name: Product Listing
      checks:
        - productsDisplay
        - filteringWorks
        - paginationWorks

    - path: /product/*
      name: Product Detail
      checks:
        - productImageLoads
        - priceDisplayed
        - addToCartWorks

    - path: /cart
      name: Shopping Cart
      checks:
        - cartItemsDisplay
        - quantityUpdateWorks
        - totalCalculates

    - path: /checkout
      name: Checkout
      checks:
        - formFieldsPresent
        - validationWorks
        - sslIndicator

  important:
    - /about
    - /contact
    - /returns
    - /shipping

lighthouse:
  performance: 50
  seo: 80
  accessibility: 90

loadTest:
  scenarios:
    - name: Browse and Add to Cart
      vus: 50
      duration: 5m
      actions:
        - visit: /
        - visit: /products
        - visit: /product/sample
        - click: addToCart
```

### Marketing Site Template

```yaml
name: Marketing Site
description: Testing for lead generation and branding sites
pages:
  critical:
    - path: /
      name: Homepage
      checks:
        - heroLoads
        - ctaVisible
        - mobileResponsive

    - path: /contact
      name: Contact Form
      checks:
        - formSubmits
        - validationWorks
        - confirmationShows

  important:
    - /about
    - /services
    - /team
    - /blog
    - /pricing

forms:
  - selector: '#contact-form'
    fields:
      - name: name
        type: text
        required: true
      - name: email
        type: email
        required: true
      - name: message
        type: textarea
        required: true

lighthouse:
  performance: 70
  seo: 90
  accessibility: 95

visualRegression:
  breakpoints:
    - 375   # Mobile
    - 768   # Tablet
    - 1440  # Desktop
```

### Web Application Template

```yaml
name: Web Application
description: Testing for SaaS and web apps
pages:
  auth:
    - path: /login
      name: Login
      checks:
        - formPresent
        - validationWorks
        - errorMessagesShow

    - path: /signup
      name: Signup
      checks:
        - formPresent
        - passwordRequirements
        - termsCheckbox

    - path: /forgot-password
      name: Password Reset
      checks:
        - emailFieldPresent
        - submitWorks

  authenticated:
    - path: /dashboard
      name: Dashboard
      requiresAuth: true
      checks:
        - dataLoads
        - chartsRender

    - path: /settings
      name: Settings
      requiresAuth: true
      checks:
        - formSaves
        - changesApply

api:
  endpoints:
    - method: GET
      path: /api/health
      expectedStatus: 200

    - method: GET
      path: /api/user
      requiresAuth: true
      expectedStatus: 200

    - method: POST
      path: /api/login
      body:
        email: test@example.com
        password: testpass
      expectedStatus: 200
```

---

## T3. Alert Thresholds Configuration

### Default Thresholds

```javascript
const DEFAULT_THRESHOLDS = {
  lighthouse: {
    performance: {
      critical: 40,   // Below this = critical alert
      warning: 60,    // Below this = warning
      target: 80      // Goal to achieve
    },
    seo: {
      critical: 60,
      warning: 80,
      target: 95
    },
    accessibility: {
      critical: 70,
      warning: 85,
      target: 95
    },
    bestPractices: {
      critical: 60,
      warning: 80,
      target: 90
    }
  },

  loadTest: {
    responseTime: {
      p95_critical: 5000,  // 5s = critical
      p95_warning: 2000,   // 2s = warning
      p95_target: 1000     // 1s = goal
    },
    errorRate: {
      critical: 5,    // 5% = critical
      warning: 1,     // 1% = warning
      target: 0.1     // 0.1% = goal
    },
    throughput: {
      minimum: 100    // RPS minimum
    }
  },

  visualRegression: {
    diffPercentage: {
      critical: 15,   // 15% diff = critical
      warning: 5,     // 5% diff = warning
      acceptable: 1   // 1% = acceptable noise
    }
  },

  smoke: {
    responseTime: {
      critical: 10000,  // 10s = critical
      warning: 5000     // 5s = warning
    },
    consoleErrors: {
      critical: 5,      // 5+ errors = critical
      warning: 1        // 1+ error = warning
    }
  }
};
```

### Alert Routing

```javascript
const alertRouting = {
  critical: {
    channels: ['email', 'slack', 'pagerduty'],
    immediate: true,
    escalationMinutes: 15
  },
  warning: {
    channels: ['email', 'slack'],
    immediate: false,
    batchMinutes: 60
  },
  info: {
    channels: ['email'],
    immediate: false,
    batchMinutes: 1440  // Daily digest
  }
};
```

### Custom Threshold UI

```
┌─────────────────────────────────────────────────────────────────┐
│  Alert Thresholds: example.com                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Lighthouse Performance                                         │
│  Critical: [__40__]  Warning: [__60__]  Target: [__80__]       │
│  ○ Use defaults  ● Custom                                       │
│                                                                 │
│  Page Load Time (seconds)                                       │
│  Critical: [__5.0_]  Warning: [__2.0_]  Target: [__1.0_]       │
│  ○ Use defaults  ● Custom                                       │
│                                                                 │
│  Visual Regression (% difference)                               │
│  Critical: [__15__]  Warning: [__5___]  Acceptable: [__1__]    │
│  ○ Use defaults  ● Custom                                       │
│                                                                 │
│  [Save Thresholds]  [Reset to Defaults]                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Test Coverage Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Test Coverage: example.com                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Pages Discovered: 45                                           │
│  Pages Tested: 42 (93%)                                         │
│                                                                 │
│  Coverage by Type:                                              │
│  ────────────────────────────────────────────                  │
│  Smoke Tests      ████████████████████ 100%                     │
│  Lighthouse       ████████████████░░░░  80%                     │
│  Visual Baseline  ████████████████████ 100%                     │
│  Load Tests       ████░░░░░░░░░░░░░░░░  20%                     │
│                                                                 │
│  Missing Coverage:                                              │
│  • /admin/* pages (3) - requires auth                           │
│  • /api/docs - excluded                                         │
│                                                                 │
│  [Generate Coverage Report]                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quality Gates

For CI/CD integration, define quality gates:

```yaml
# .qa-gates.yml
quality_gates:
  smoke:
    required: true
    pass_rate: 100%

  lighthouse:
    required: true
    performance: ">= 60"
    seo: ">= 80"
    accessibility: ">= 85"

  visual_regression:
    required: false
    max_diff: 5%

  load_test:
    required: false
    p95_response: "<= 2000ms"
    error_rate: "<= 1%"
```
