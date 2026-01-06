# UX Improvements Plan

**Owner:** Sally (UX Designer)
**Created:** January 5, 2026

---

## U1. Client Dashboard Simplification

### Current Problems
- Dashboard shows technical details (console logs, raw JSON)
- Terminology assumes QA knowledge
- Not mobile-friendly
- No "at a glance" health view

### Client View Mode

#### Executive Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│  example.com                                    Last: 2h ago    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐       │
│   │   95    │   │   87    │   │   92    │   │   98    │       │
│   │  Health │   │  Speed  │   │   SEO   │   │  A11y   │       │
│   │    ✓    │   │    ⚠    │   │    ✓    │   │    ✓    │       │
│   └─────────┘   └─────────┘   └─────────┘   └─────────┘       │
│                                                                 │
│   This Week                                                     │
│   ───────────────────────────────────────                      │
│   ✓ 142 tests passed                                           │
│   ⚠ 3 warnings (speed issues on /products)                     │
│   ✗ 0 critical failures                                        │
│                                                                 │
│   [View Full Report]            [Download PDF]                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Simplified Terminology

| Technical Term | Client-Friendly |
|----------------|-----------------|
| Smoke Test | Health Check |
| Lighthouse Performance | Page Speed Score |
| Visual Regression | Layout Changes |
| Load Test | Traffic Simulation |
| Console Errors | Technical Issues |
| DOM | Page Structure |

### Mobile Responsive Design

```css
/* Breakpoints */
--mobile: 375px;
--tablet: 768px;
--desktop: 1024px;
--wide: 1440px;

/* Mobile-first cards */
.health-card {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .health-card {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .health-card {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## U2. Automated Report Generation

### PDF Report Template

```
┌─────────────────────────────────────────────────────────────────┐
│  [LOGO]                                                         │
│                                                                 │
│  Website Health Report                                          │
│  example.com | January 2026                                     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  EXECUTIVE SUMMARY                                              │
│  ─────────────────────────────────────────────                 │
│  Overall Score: 94/100 (Excellent)                              │
│                                                                 │
│  ✓ All critical pages loading correctly                         │
│  ✓ Mobile performance improved 12% this month                   │
│  ⚠ 2 accessibility issues need attention                        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  PERFORMANCE TRENDS                                             │
│  ─────────────────────────────────────────────                 │
│  [Line chart: Page speed over time]                             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  RECOMMENDATIONS                                                │
│  ─────────────────────────────────────────────                 │
│  1. Optimize images on /products (save 2.3s)                    │
│  2. Fix contrast ratio on footer links                          │
│  3. Add alt text to 12 images                                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Powered by QA Testing Agent | qa.mercan.com                    │
└─────────────────────────────────────────────────────────────────┘
```

### Email Templates

#### Daily Summary
```
Subject: ✓ example.com - All Tests Passing | Jan 5

Hi Team,

Your daily health check for example.com completed successfully.

📊 Results at a Glance:
• Health Score: 95/100
• Tests Run: 24
• Passed: 24 ✓
• Failed: 0

🚀 Performance:
• Homepage: 1.2s (Good)
• Product Page: 2.1s (Needs Work)

[View Full Report →]

— QA Agent
```

#### Alert Email
```
Subject: ⚠ Alert: example.com - 2 Issues Detected

Hi Team,

We detected issues on example.com that need attention.

🔴 Critical:
• /checkout page returning 500 error

🟡 Warning:
• Homepage load time increased to 4.2s

[View Details →] [Mark as Resolved →]

— QA Agent
```

---

## U3. White-Label Capability

### Customization Options

```javascript
const whitelabelConfig = {
  branding: {
    logo: 'https://client-cdn.com/logo.png',
    favicon: 'https://client-cdn.com/favicon.ico',
    companyName: 'ClientCo QA',
    primaryColor: '#1a73e8',
    secondaryColor: '#34a853'
  },
  domain: {
    dashboard: 'qa.clientco.com',
    reports: 'reports.clientco.com',
    api: 'api.clientco.com'
  },
  email: {
    fromName: 'ClientCo QA',
    fromAddress: 'qa@clientco.com',
    replyTo: 'support@clientco.com'
  },
  features: {
    hidePoweredBy: true,
    customFooter: 'Powered by ClientCo Technology'
  }
};
```

### Custom Domain Setup

```
1. Add CNAME record:
   qa.clientco.com → tenant-abc.qa.mercan.com

2. SSL Certificate (auto-provisioned via Let's Encrypt)

3. Configure in dashboard:
   Settings > White Label > Custom Domain
```

---

## U4. Onboarding UX

### Welcome Wizard Component

```jsx
// components/WelcomeWizard.jsx
const WelcomeWizard = () => {
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  return (
    <div className="wizard-container">
      {/* Progress Bar */}
      <div className="progress-bar">
        {[1,2,3,4,5].map(n => (
          <div
            key={n}
            className={`step ${n <= step ? 'active' : ''}`}
          />
        ))}
      </div>

      {/* Step Content */}
      {step === 1 && <WelcomeStep onNext={() => setStep(2)} />}
      {step === 2 && <AddWebsiteStep onNext={() => setStep(3)} />}
      {step === 3 && <DiscoveryStep onNext={() => setStep(4)} />}
      {step === 4 && <FirstTestStep onNext={() => setStep(5)} />}
      {step === 5 && <SetupNotificationsStep onComplete={finish} />}
    </div>
  );
};
```

### Guided Tour (react-joyride)

```javascript
const tourSteps = [
  {
    target: '.dashboard-header',
    content: 'This is your command center. See all your websites at a glance.',
    placement: 'bottom'
  },
  {
    target: '.add-website-btn',
    content: 'Click here to add a new website for testing.',
    placement: 'left'
  },
  {
    target: '.health-score',
    content: 'Health scores show overall site quality. Green = great, Yellow = needs attention.',
    placement: 'bottom'
  },
  {
    target: '.run-tests-btn',
    content: 'Run tests anytime with this button. Tests also run automatically on schedule.',
    placement: 'left'
  },
  {
    target: '.notifications-icon',
    content: 'Get alerts here when issues are found.',
    placement: 'bottom'
  }
];
```

### Empty States with Illustrations

Already created in `EmptyState.jsx`. Usage:

```jsx
<EmptyState
  type="noWebsites"
  title="No websites yet"
  description="Add your first website to start monitoring"
  action={() => setShowAddModal(true)}
  actionLabel="Add Website"
/>
```

---

## Component Library

### New Components Needed

| Component | Purpose | Priority |
|-----------|---------|----------|
| `HealthScoreCard` | Display score with color/icon | High |
| `TrendChart` | Show metrics over time | High |
| `PDFReportGenerator` | Generate downloadable reports | Medium |
| `WhiteLabelProvider` | Context for branding | Medium |
| `WelcomeWizard` | Onboarding flow | High |
| `GuidedTour` | Interactive tooltips | Medium |
| `MobileNav` | Responsive navigation | High |
| `ClientViewToggle` | Switch between views | High |

---

## Design Tokens

```css
:root {
  /* Health Colors */
  --health-excellent: #22c55e;
  --health-good: #84cc16;
  --health-warning: #eab308;
  --health-critical: #ef4444;

  /* Score Thresholds */
  --score-excellent: 90;
  --score-good: 70;
  --score-warning: 50;

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;

  /* Typography */
  --font-display: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```
