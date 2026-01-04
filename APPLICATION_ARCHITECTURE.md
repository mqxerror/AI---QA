# QA Dashboard - Application Architecture

## Overview
A comprehensive QA testing dashboard that runs automated tests (Smoke, Performance, Load, Accessibility, Security, SEO, Visual Regression, Pixel Audit) on websites and displays results in a modern React frontend.

---

## Directory Structure

```
dashboard/
├── backend/                          # Node.js/Express API Server
│   ├── server.js                     # Main Express server (API routes, authentication)
│   ├── database.js                   # SQLite database setup
│   ├── Dockerfile                    # Docker configuration
│   ├── package.json                  # Dependencies
│   │
│   ├── middleware/
│   │   └── auth.js                   # JWT authentication middleware
│   │
│   ├── routes/
│   │   ├── auth.js                   # Login/logout endpoints
│   │   ├── activities.js             # Activity log endpoints
│   │   ├── configurations.js         # Test configurations
│   │   ├── failures.js               # Failure tracking
│   │   └── processes.js              # Background process monitoring
│   │
│   ├── services/
│   │   ├── AccessibilityService.js   # WCAG accessibility testing
│   │   ├── ActivityLogger.js         # Activity logging service
│   │   ├── ProcessMonitor.js         # Background process tracking
│   │   ├── ProcessCleanup.js         # Cleanup stale processes
│   │   ├── ReportGenerator.js        # PDF report generation
│   │   ├── ScheduledTests.js         # Scheduled test runner
│   │   ├── SecurityScanner.js        # Security vulnerability scanning
│   │   ├── SEOAuditor.js             # SEO analysis service
│   │   └── VisualRegression.js       # Visual regression testing
│   │
│   ├── websocket/
│   │   └── index.js                  # Socket.IO real-time updates
│   │
│   └── types/
│       └── index.d.ts                # TypeScript definitions
│
├── frontend/                         # React Vite Application
│   ├── Dockerfile                    # Nginx container config
│   ├── package.json                  # Dependencies
│   ├── vite.config.js                # Vite configuration
│   │
│   └── src/
│       ├── main.jsx                  # App entry point
│       ├── App.jsx                   # Main app with routing
│       ├── App.css                   # Global styles
│       ├── index.css                 # Base CSS & Tailwind
│       ├── glassmorphism.css         # Glass effect styles
│       │
│       ├── contexts/
│       │   ├── AuthContext.jsx       # Authentication state
│       │   └── ToastContext.jsx      # Toast notifications
│       │
│       ├── services/
│       │   ├── api.js                # Axios API client
│       │   └── websocket.js          # Socket.IO client
│       │
│       ├── hooks/
│       │   └── useRealtimeUpdates.js # Real-time data hook
│       │
│       ├── pages/
│       │   ├── Login.jsx             # Login page
│       │   ├── NewDashboard.jsx      # Main dashboard (active)
│       │   ├── Dashboard.jsx         # Original dashboard
│       │   ├── Websites.jsx          # Website management
│       │   ├── TestRunsEnhanced.jsx  # Test runs list (active)
│       │   ├── SystemStatus.jsx      # System health status
│       │   ├── Help.jsx              # Help & documentation
│       │   ├── ActivityLog.jsx       # Activity log viewer
│       │   ├── FailureManager.jsx    # Failure tracking
│       │   └── ProcessMonitor.jsx    # Process monitoring
│       │
│       ├── components/
│       │   ├── TestDrawer.jsx        # Test runner side panel
│       │   ├── TestRunModal.jsx      # Test result modal
│       │   ├── TestRunSidePanel.jsx  # Detailed test view panel
│       │   ├── TestModal.jsx         # Quick test modal
│       │   ├── ActivityLogModal.jsx  # Activity details modal
│       │   ├── Toast.jsx             # Toast notifications
│       │   │
│       │   ├── badges/               # Status badges
│       │   │   ├── StatusBadge.jsx
│       │   │   └── TestTypeIcon.jsx
│       │   │
│       │   ├── charts/               # Data visualizations
│       │   │   ├── ChartContainer.jsx
│       │   │   ├── PassFailChart.jsx
│       │   │   ├── DurationTrendsChart.jsx
│       │   │   └── TestFrequencyChart.jsx
│       │   │
│       │   ├── dashboard/            # Dashboard components
│       │   │   ├── EnhancedTestRunCard.jsx
│       │   │   ├── FilterControlBar.jsx
│       │   │   └── StatusSummaryBar.jsx
│       │   │
│       │   ├── progress/             # Progress indicators
│       │   │   ├── CircularProgress.jsx
│       │   │   ├── DurationBar.jsx
│       │   │   └── TestProgressBar.jsx
│       │   │
│       │   ├── reports/              # Report components
│       │   │   ├── CircularProgress.jsx
│       │   │   ├── IssueCard.jsx
│       │   │   ├── MetricCard.jsx
│       │   │   └── StatCard.jsx
│       │   │
│       │   ├── test-runs/            # Test run components
│       │   │   ├── TestRunCard.jsx
│       │   │   ├── TestRunDetails.jsx
│       │   │   ├── TestRunsLayout.jsx
│       │   │   ├── TestRunTimeline.jsx
│       │   │   ├── TestTypeFilter.jsx
│       │   │   └── WebsiteSidebar.jsx
│       │   │
│       │   ├── visualizations/       # Visual test components
│       │   │   ├── VisualRegressionGallery.jsx
│       │   │   └── VisualRegressionViewer.jsx
│       │   │
│       │   ├── triage/               # Triage panels
│       │   │   └── AccessibilityTriagePanel.jsx
│       │   │
│       │   └── ui/                   # UI component library
│       │       ├── Sheet.jsx         # Side panel sheet
│       │       ├── DataTable.jsx     # Data tables
│       │       ├── Popover.jsx       # Popovers
│       │       ├── GlowingText.jsx   # Animated text
│       │       ├── button.jsx        # Button component
│       │       ├── card.jsx          # Card component
│       │       ├── badge.jsx         # Badge component
│       │       ├── tabs.jsx          # Tab component
│       │       ├── tooltip.jsx       # Tooltip component
│       │       ├── progress.jsx      # Progress bar
│       │       ├── skeleton.jsx      # Loading skeleton
│       │       ├── separator.jsx     # Divider
│       │       ├── accordion.jsx     # Accordion
│       │       │
│       │       ├── aceternity/       # Aceternity UI effects
│       │       │   ├── CardStack.jsx
│       │       │   ├── FlipWords.jsx
│       │       │   ├── Meteors.jsx
│       │       │   ├── ParallaxScroll.jsx
│       │       │   ├── Spotlight.jsx
│       │       │   ├── TextGenerateEffect.jsx
│       │       │   ├── ThreeDCard.jsx
│       │       │   └── TracingBeam.jsx
│       │       │
│       │       ├── framer/           # Framer Motion animations
│       │       │   ├── PageTransition.jsx
│       │       │   └── ScrollReveal.jsx
│       │       │
│       │       ├── luxe/             # Luxe UI components
│       │       │   ├── AnimatedTabs.jsx
│       │       │   ├── FadeText.jsx
│       │       │   └── TextShimmer.jsx
│       │       │
│       │       └── magic/            # Magic UI effects
│       │           ├── AnimatedCounter.jsx
│       │           ├── BorderBeam.jsx
│       │           ├── Marquee.jsx
│       │           └── ShineButton.jsx
│       │
│       ├── lib/
│       │   └── utils.js              # Utility functions (cn)
│       │
│       └── utils/
│           └── testDataTransformers.js # Data transformation
│
├── docker-compose.yml                # Docker orchestration
└── *.md                              # Documentation files
```

---

## Backend API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |

### Websites
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/websites` | List all websites |
| POST | `/api/websites` | Add new website |
| PUT | `/api/websites/:id` | Update website |
| DELETE | `/api/websites/:id` | Delete website |

### Test Runs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/test-runs` | List test runs (with load test data) |
| GET | `/api/test-runs/:id` | Get test run details |
| GET | `/api/test-runs/:id/report` | Generate PDF report |

### Run Tests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/run-test/smoke/:websiteId` | Run smoke test |
| POST | `/api/run-test/performance/:websiteId` | Run performance test |
| POST | `/api/run-test/accessibility/:websiteId` | Run accessibility test |
| POST | `/api/run-test/security/:websiteId` | Run security scan |
| POST | `/api/run-test/seo/:websiteId` | Run SEO audit |
| POST | `/api/run-test/load/:websiteId` | Run load test |
| POST | `/api/run-test/visual/:websiteId` | Run visual regression |
| POST | `/api/run-test/pixel-audit/:websiteId` | Run pixel audit |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/stats` | Dashboard statistics |

---

## Database Schema (SQLite)

### Main Tables
- **websites** - Registered websites to test
- **test_runs** - Test execution records
- **test_results** - Individual test results
- **performance_metrics** - Lighthouse performance data
- **load_test_results** - K6 load test results
- **accessibility_results** - WCAG violations
- **security_results** - Security scan findings
- **seo_results** - SEO audit data
- **visual_regression_results** - Screenshot comparisons

---

## Test Types

| Test Type | Tool | Description |
|-----------|------|-------------|
| Smoke | Playwright | Basic functionality checks |
| Performance | Lighthouse | Core Web Vitals, scores |
| Load | K6 | Stress testing, RPS |
| Accessibility | Axe-core | WCAG compliance |
| Security | Custom | OWASP vulnerabilities |
| SEO | Custom | Meta tags, structure |
| Visual Regression | Pixelmatch | Screenshot comparison |
| Pixel Audit | Custom | Tracking pixel detection |

---

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3)
- **Auth**: JWT tokens
- **WebSocket**: Socket.IO
- **Testing Tools**: Playwright, Lighthouse, K6, Axe-core

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + Custom CSS
- **State**: React Query (TanStack)
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React

### Deployment
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (frontend)
- **Platform**: Dokploy on dedicated server

---

## Key Features

1. **Real-time Updates** - WebSocket for live test progress
2. **Retest Button** - Re-run tests directly from results panel
3. **Visual Regression Gallery** - Side-by-side screenshot comparison
4. **PDF Reports** - Downloadable test reports
5. **Modern UI** - Glassmorphism, animations, responsive design
6. **Multi-test Types** - 8 different test types supported

---

## Environment Variables

### Backend
```env
PORT=3004
NODE_ENV=production
JWT_SECRET=your-secret-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-password
TEST_API_URL=http://38.97.60.181:3003
```

### Frontend
```env
VITE_API_URL=http://localhost:3004
```

---

## Production URLs
- **Dashboard**: https://portugalgoldenvisas.co
- **API**: https://portugalgoldenvisas.co/api
- **Screenshots**: https://portugalgoldenvisas.co/screenshots
- **WebSocket**: wss://portugalgoldenvisas.co/socket.io
