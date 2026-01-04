# QA Testing Dashboard - Product Requirements Document (PRD)

**Version:** 2.0 (Updated to match testing-agent codebase)  
**Purpose:** BMAD Technical Reference for Development  
**Last Updated:** January 2026

---

## 1. PRODUCT OVERVIEW

### 1.1 Executive Summary

**Product:** QA Testing Dashboard  
**Description:** A comprehensive web application for automated website quality assurance, performance monitoring, and testing orchestration.

**System Components:**
1. **React Dashboard** (portugalgoldenvisas.co) - Frontend UI with SQLite backend
2. **Test API** (testing-agent) - Node.js test execution engine on Mercan server

**Evolution:** Upgraded from Airtable-based interface to standalone React web application.

### 1.2 Target Users

| User Type | Needs |
|-----------|-------|
| **Agency Owners** | Monitor all client websites in one place |
| **Developers** | Quick smoke tests after deployments |
| **DevOps Engineers** | Load testing, system health monitoring |
| **Marketing Managers** | Validate tracking pixels and analytics |

---

## 2. SYSTEM ARCHITECTURE

### 2.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    REACT DASHBOARD                               │
│              portugalgoldenvisas.co (Frontend)                  │
│                                                                  │
│   Dashboard │ Websites │ Test Runs │ Failures │ Activity │ Help │
├─────────────────────────────────────────────────────────────────┤
│                 DASHBOARD BACKEND (Express + SQLite)             │
│                         Port: 3004                               │
│                                                                  │
│   • Website CRUD    • Activity logging    • Process tracking     │
│   • Test orchestration    • Failure management                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    TEST API (Mercan Server)                      │
│              http://38.97.60.181:3003 (external: 3003)          │
│              Container internal port: 3001                       │
│                                                                  │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│   │  Playwright │ │  Lighthouse │ │     k6      │               │
│   │  (Smoke,    │ │ (Performance│ │   (Load     │               │
│   │   Pixel)    │ │   Audits)   │ │   Testing)  │               │
│   └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE                                │
│                                                                  │
│   ┌─────────┐  ┌─────────┐  ┌───────────────┐                  │
│   │  MinIO  │  │  Redis  │  │  Playwright   │                  │
│   │ :9002   │  │  :6380  │  │  Container    │                  │
│   │ :9003   │  │         │  │               │                  │
│   └─────────┘  └─────────┘  └───────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Port Configuration

| Service | Container Port | External Port | Description |
|---------|---------------|---------------|-------------|
| Test API | 3001 | 3003 | Main test execution API |
| Dashboard Backend | 3004 | 3004 | React app backend |
| MinIO API | 9000 | 9002 | Object storage |
| MinIO Console | 9001 | 9003 | MinIO web UI |
| Redis | 6379 | 6380 | Queue and caching |

### 2.3 Technology Stack

**Dashboard (React App):**
| Layer | Technology |
|-------|------------|
| Frontend | React 18+, Tailwind CSS |
| Backend | Express.js |
| Database | SQLite |
| State | React Hooks/Context |

**Test API (testing-agent):**
| Layer | Technology |
|-------|------------|
| Server | Express.js (Node 20) |
| Browser Automation | Playwright 1.40+ |
| Performance | Lighthouse (via Puppeteer) |
| Load Testing | k6 |
| Storage | MinIO (S3-compatible) |
| Queue | Redis |

---

## 3. TEST API ENDPOINTS

### 3.1 Health Check

```
GET /api/health

Response:
{
  "status": "healthy",
  "timestamp": "2025-01-02T...",
  "uptime": 12345.67,
  "memory": { "heapUsed": ... },
  "version": "1.0.0"
}
```

### 3.2 Smoke Test

```
POST /api/test/smoke

Body:
{
  "target_url": "https://example.com",
  "browser": "chromium",  // or "firefox", "webkit"
  "viewport": { "width": 1920, "height": 1080 },
  "tests": ["homepage_loads", "navigation_works", "no_console_errors", "images_load", "links_valid"]
}

Response:
{
  "success": true,
  "duration_ms": 3500,
  "results": [
    {
      "name": "homepage_loads",
      "status": "pass",
      "duration_ms": 1200,
      "message": "HTTP 200",
      "screenshot": "https://minio/screenshots/..."
    },
    ...
  ],
  "summary": { "total": 4, "passed": 4, "failed": 0 },
  "browser": "chromium",
  "viewport": "1920x1080"
}
```

### 3.3 Performance Test (Lighthouse)

```
POST /api/test/performance

Body:
{
  "target_url": "https://example.com",
  "device": "desktop",  // or "mobile"
  "thresholds": {
    "LCP": 2500,
    "CLS": 0.1,
    "TTFB": 800,
    "performance_score": 80
  }
}

Response:
{
  "success": true,
  "metrics": {
    "LCP": 1850,
    "CLS": 0.05,
    "FCP": 1200,
    "INP": 150,
    "TTFB": 450,
    "total_requests": 45,
    "page_size_kb": 1250
  },
  "scores": {
    "performance": 85,
    "accessibility": 92,
    "seo": 88,
    "best_practices": 95
  },
  "status": "Good",
  "threshold_breaches": [],
  "recommendations": [...],
  "report_url": "https://minio/reports/...",
  "device": "desktop"
}
```

### 3.4 Load Test (k6)

```
POST /api/test/load

Body:
{
  "target_url": "https://example.com",
  "virtual_users": 10,
  "duration": "30s",
  "thresholds": {
    "p95": 500,
    "error_rate": 0.01
  },
  "http_method": "GET"
}

Response:
{
  "success": true,
  "status": "Pass",
  "metrics": {
    "total_requests": 450,
    "rps": 15.0,
    "p50_ms": 120,
    "p90_ms": 280,
    "p95_ms": 350,
    "p99_ms": 480,
    "error_rate": 0.002,
    "data_received_kb": 5400,
    "data_sent_kb": 45
  },
  "threshold_breaches": [],
  "report_url": "https://minio/k6/...",
  "duration": "30s",
  "virtual_users": 10
}
```

### 3.5 Pixel Audit

```
POST /api/test/pixel-audit

Body:
{
  "target_url": "https://example.com",
  "incognito": true,
  "expected_pixels": ["GA4", "GTM", "Meta Pixel"],
  "capture_har": true
}

Response:
{
  "success": true,
  "pixels_found": [
    {
      "name": "GA4",
      "detected": true,
      "script_url": "https://...",
      "network_calls": 5
    },
    {
      "name": "GTM",
      "detected": true,
      "container_id": "GTM-XXXXXX"
    },
    {
      "name": "Meta Pixel",
      "detected": true,
      "pixel_id": "123456789",
      "events": 2
    }
  ],
  "missing_pixels": [],
  "total_network_requests": 87,
  "screenshot_url": "https://minio/...",
  "har_url": "https://minio/..."
}
```

---

## 4. TEST TYPES SPECIFICATION

### 4.1 Smoke Test (Playwright)

**Available Checks:**
| Check | Description |
|-------|-------------|
| `homepage_loads` | Page returns HTTP 200, captures screenshot |
| `no_console_errors` | No JavaScript console errors |
| `images_load` | All images have naturalWidth > 0 |
| `navigation_works` | Navigation links are present and visible |
| `links_valid` | First 20 external links return < 400 status |

**Duration:** 3-8 seconds

### 4.2 Performance Test (Lighthouse)

**Metrics Collected:**
- LCP (Largest Contentful Paint)
- CLS (Cumulative Layout Shift)
- FCP (First Contentful Paint)
- INP (Interaction to Next Paint)
- TTFB (Time to First Byte)
- Total requests
- Page size

**Scores:**
- Performance (0-100)
- Accessibility (0-100)
- SEO (0-100)
- Best Practices (0-100)

**Duration:** 8-15 seconds

### 4.3 Load Test (k6)

**Configuration:**
- Virtual Users (VUs): 1-100
- Duration: 10s - 5m
- HTTP Method: GET/POST

**Metrics:**
- Requests per second (RPS)
- Percentiles: P50, P90, P95, P99
- Error rate
- Data transferred

**Duration:** Configurable (default 30s)

### 4.4 Pixel Audit (Playwright)

**Pixels Detected:**
- Google Analytics 4 (GA4)
- Google Tag Manager (GTM)
- Meta Pixel (Facebook)
- Google Ads
- TikTok Pixel
- LinkedIn Insight
- Pinterest Tag
- Hotjar
- Microsoft Clarity

**Duration:** 5-8 seconds

---

## 5. DASHBOARD FEATURES

### 5.1 Dashboard (Home)

**Components:**
- Stats cards (Total Websites, Pass Rate, Total Tests, System Health)
- Recent Test Runs table (last 10)
- Quick Actions (Add Website, Run Tests, View All)

### 5.2 Websites Page

**Features:**
- Website list with status
- Add Website modal
- Run Test dropdown (8 test types)
- Delete website

### 5.3 Test Runs Page

**Features:**
- Filter tabs by test type
- Expandable details
- Pass/Fail badges
- Duration and timestamp

### 5.4 Failures Page

**Features:**
- Status filters (Open, In Progress, Resolved)
- Priority levels (Critical, High, Medium, Low)
- Create failure manually
- Empty state when all passing

### 5.5 Activity Log

**Features:**
- User actions tracking
- Test execution logs
- Expandable JSON details
- Status indicators

### 5.6 Processes Page

**Features:**
- Running/Completed/Failed counts
- Process cards with duration
- Error messages
- Cancel running process

### 5.7 System Status

**Features:**
- Service health cards
- Auto-refresh (5 seconds)
- Last check timestamps

### 5.8 Help Page

**Features:**
- Test types documentation
- Service architecture
- Quick start guide

---

## 6. DATABASE SCHEMA (Dashboard)

```sql
CREATE TABLE websites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE test_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    website_id INTEGER NOT NULL,
    test_type TEXT NOT NULL,
    status TEXT NOT NULL,
    passed INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0,
    duration_ms INTEGER,
    results TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (website_id) REFERENCES websites(id)
);

CREATE TABLE activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT NOT NULL DEFAULT 'admin',
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id INTEGER,
    status TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE processes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    website_id INTEGER NOT NULL,
    test_type TEXT NOT NULL,
    status TEXT NOT NULL,
    error TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (website_id) REFERENCES websites(id)
);

CREATE TABLE failures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    website_id INTEGER NOT NULL,
    test_run_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'open',
    assigned_to TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME
);
```

---

## 7. ENVIRONMENT CONFIGURATION

### 7.1 Test API (.env)

```env
# Server
NODE_ENV=production
PORT=3001

# MinIO Storage
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=testing-agent
MINIO_PUBLIC_URL=http://38.97.60.181:9000

# Redis
REDIS_URL=redis://redis:6379

# Logging
LOG_LEVEL=info
```

### 7.2 Dashboard Backend (.env)

```env
PORT=3004
DATABASE_PATH=./database/qa-tests.db
TEST_API_URL=http://38.97.60.181:3003
SESSION_SECRET=your-secret-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

---

## 8. DOCKER SERVICES

```yaml
services:
  test-api:
    ports: "3003:3001"
    depends_on: [minio, redis]
    
  minio:
    ports: ["9002:9000", "9003:9001"]
    
  redis:
    ports: "6380:6379"
    
  playwright:
    image: mcr.microsoft.com/playwright:v1.40.0-jammy
    
  k6:
    image: grafana/k6:latest
```

---

## 9. ACCEPTANCE CRITERIA

### 9.1 Test Execution

- [ ] Smoke tests complete in < 10 seconds
- [ ] Performance tests return all Core Web Vitals
- [ ] Load tests support 1-100 virtual users
- [ ] Pixel audit detects all 9 pixel types
- [ ] All artifacts uploaded to MinIO

### 9.2 Dashboard

- [ ] All 8 pages functional
- [ ] Real-time process monitoring
- [ ] Test results stored in SQLite
- [ ] Activity logging for all actions
- [ ] Responsive on mobile/tablet/desktop

---

**PRD COMPLETE** ✓

This document reflects the actual testing-agent codebase architecture.
