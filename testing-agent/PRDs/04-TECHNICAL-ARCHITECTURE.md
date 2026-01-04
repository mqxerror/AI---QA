# QA Testing Dashboard - Technical Architecture

**Version:** 2.0 (Updated to match testing-agent codebase)  
**Purpose:** BMAD Technical Reference for Implementation  
**Last Updated:** January 2026

---

## 1. SYSTEM OVERVIEW

### 1.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                                   │
│                    portugalgoldenvisas.co                               │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │ HTTPS
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      DASHBOARD BACKEND                                   │
│                   Express + SQLite (Port 3004)                          │
│                                                                          │
│   Routes:                        Services:                               │
│   • /api/websites               • Website CRUD                          │
│   • /api/test-runs              • Test orchestration                    │
│   • /api/activities             • Activity logging                      │
│   • /api/processes              • Process management                    │
│   • /api/failures               • Failure tracking                      │
│   • /api/health                 • Health checks                         │
│   • /api/status                 • Service status                        │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │ HTTP (internal)
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         TEST API (Mercan Server)                         │
│                    http://38.97.60.181:3003                             │
│                    Container: testing-agent-api                          │
│                    Internal port: 3001                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│   │   index.js      │  │     Routes      │  │    Services     │        │
│   │   Express app   │  │                 │  │                 │        │
│   │   - helmet      │  │  smoke.js       │  │  playwright.js  │        │
│   │   - cors        │  │  performance.js │  │  lighthouse.js  │        │
│   │   - rateLimit   │  │  load.js        │  │  k6.js          │        │
│   │   - compression │  │  pixel-audit.js │  │                 │        │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘        │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                           TESTING ENGINES                                │
│                                                                          │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │                    PLAYWRIGHT SERVICE                          │    │
│   │                                                                │    │
│   │  runSmokeTests()           runPixelAudit()                    │    │
│   │  • Homepage loads          • Network request capture          │    │
│   │  • Console errors          • GA4, GTM, Meta detection         │    │
│   │  • Image loading           • HAR file generation              │    │
│   │  • Navigation check        • Screenshot capture               │    │
│   │  • Link validation                                            │    │
│   │                                                                │    │
│   │  Browsers: chromium, firefox, webkit                          │    │
│   │  Headless mode with sandbox disabled                          │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                                                          │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │                   LIGHTHOUSE SERVICE                           │    │
│   │                                                                │    │
│   │  runPerformanceAudit()                                        │    │
│   │  • Core Web Vitals (LCP, CLS, FCP, INP, TTFB)                │    │
│   │  • Performance score (0-100)                                  │    │
│   │  • Accessibility, SEO, Best Practices scores                  │    │
│   │  • HTML + JSON report generation                              │    │
│   │  • Threshold checking                                         │    │
│   │  • Recommendations extraction                                 │    │
│   │                                                                │    │
│   │  Uses Puppeteer's bundled Chrome                              │    │
│   │  Device emulation: desktop (1920x1080) / mobile (390x844)     │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                                                          │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │                       K6 SERVICE                               │    │
│   │                                                                │    │
│   │  runLoadTest()                                                │    │
│   │  • Dynamic k6 script generation                               │    │
│   │  • Virtual users (VUs) configuration                          │    │
│   │  • Duration and threshold settings                            │    │
│   │  • Response time percentiles (P50, P90, P95, P99)            │    │
│   │  • Error rate calculation                                     │    │
│   │  • RPS (requests per second)                                  │    │
│   │                                                                │    │
│   │  Executes via child_process                                   │    │
│   │  Results in JSON line format                                  │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         INFRASTRUCTURE                                   │
│                                                                          │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│   │     MinIO       │  │     Redis       │  │   Playwright    │        │
│   │                 │  │                 │  │   Container     │        │
│   │  S3-compatible  │  │  Queue/Cache    │  │                 │        │
│   │  object storage │  │                 │  │  Standalone     │        │
│   │                 │  │  Port: 6380     │  │  browser        │        │
│   │  API: 9002      │  │  (ext)          │  │  automation     │        │
│   │  Console: 9003  │  │                 │  │                 │        │
│   │                 │  │                 │  │  v1.40.0-jammy  │        │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘        │
│                                                                          │
│   ┌─────────────────┐                                                   │
│   │       k6        │   Artifacts Volume:                               │
│   │                 │   /app/artifacts/                                 │
│   │  grafana/k6     │   ├── screenshots/                               │
│   │  Load testing   │   ├── videos/                                    │
│   │  container      │   ├── har/                                       │
│   │                 │   ├── reports/                                   │
│   │                 │   └── k6/                                        │
│   └─────────────────┘                                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. TEST API SERVICE DETAILS

### 2.1 Express Server (index.js)

```javascript
// Core middleware stack
app.use(helmet());           // Security headers
app.use(cors());             // CORS handling
app.use(compression());      // Response compression
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100                    // 100 requests per window
});
app.use('/api/', limiter);

// Routes
app.use('/api/test/smoke', smokeRoute);
app.use('/api/test/performance', performanceRoute);
app.use('/api/test/load', loadRoute);
app.use('/api/test/pixel-audit', pixelAuditRoute);
```

### 2.2 Playwright Service

**Smoke Test Configuration:**
```javascript
{
  target_url: "https://...",
  browser: "chromium",        // chromium | firefox | webkit
  viewport: { width: 1920, height: 1080 },
  tests: [
    "homepage_loads",
    "no_console_errors",
    "images_load",
    "navigation_works",
    "links_valid"
  ]
}
```

**Pixel Detection Patterns:**
```javascript
// GA4
r.url.includes('google-analytics.com') ||
r.url.includes('googletagmanager.com/gtag')

// GTM
r.url.includes('googletagmanager.com/gtm.js')

// Meta Pixel
r.url.includes('facebook.com/tr') ||
r.url.includes('connect.facebook.net')
```

### 2.3 Lighthouse Service

**Audit Categories:**
- performance
- accessibility
- best-practices
- seo

**Device Emulation:**
```javascript
// Desktop
formFactor: 'desktop',
screenEmulation: {
  mobile: false,
  width: 1920,
  height: 1080,
  deviceScaleFactor: 1
}

// Mobile
formFactor: 'mobile',
screenEmulation: {
  mobile: true,
  width: 390,
  height: 844,
  deviceScaleFactor: 3
}
```

### 2.4 k6 Service

**Generated Script Template:**
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: ${virtual_users},
  duration: '${duration}',
  thresholds: {
    'http_req_duration': ['p(95)<${thresholds.p95}'],
    'errors': ['rate<${thresholds.error_rate}'],
  },
};

export default function () {
  const res = http.get('${target_url}');
  check(res, {
    'status is 2xx or 3xx': (r) => r.status >= 200 && r.status < 400,
  });
  sleep(1);
}
```

---

## 3. DOCKER CONFIGURATION

### 3.1 docker-compose.yml

```yaml
version: '3.8'

services:
  test-api:
    build: ./test-api
    container_name: testing-agent-api
    ports:
      - "3003:3001"
    volumes:
      - ./playwright:/app/playwright
      - ./k6:/app/k6
      - ./artifacts:/app/artifacts
    environment:
      - NODE_ENV=production
      - PORT=3001
      - MINIO_ENDPOINT=minio
      - MINIO_PORT=9000
      - MINIO_BUCKET=testing-agent
      - REDIS_URL=redis://redis:6379
    depends_on:
      - minio
      - redis

  minio:
    image: minio/minio:latest
    container_name: testing-agent-minio
    ports:
      - "9002:9000"   # API
      - "9003:9001"   # Console
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"

  redis:
    image: redis:7-alpine
    container_name: testing-agent-redis
    ports:
      - "6380:6379"
    volumes:
      - redis_data:/data

  playwright:
    image: mcr.microsoft.com/playwright:v1.40.0-jammy
    container_name: testing-agent-playwright
    volumes:
      - ./artifacts/screenshots:/app/screenshots
      - ./artifacts/videos:/app/videos
    command: tail -f /dev/null

  k6:
    image: grafana/k6:latest
    container_name: testing-agent-k6
    volumes:
      - ./k6:/scripts
      - ./artifacts/k6:/results
```

### 3.2 Test API Dockerfile

```dockerfile
FROM node:20-slim

# Install dependencies for Playwright
RUN apt-get update && apt-get install -y \
    wget gnupg ca-certificates fonts-liberation \
    libasound2 libatk-bridge2.0-0 libatk1.0-0 \
    libcups2 libdbus-1-3 libgbm1 libnspr4 libnss3 \
    libxcomposite1 libxdamage1 libxrandr2 xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

# Install Playwright browsers
RUN npx playwright install chromium

EXPOSE 3001
CMD ["node", "src/index.js"]
```

---

## 4. STORAGE ARCHITECTURE

### 4.1 MinIO Structure

```
testing-agent/                    # Bucket
├── screenshots/
│   ├── {uuid}-homepage.png
│   └── {uuid}-pixel-audit.png
├── videos/
│   └── {uuid}-recording.webm
├── har/
│   └── {uuid}-audit.json
├── reports/
│   ├── {uuid}-lighthouse.html
│   └── {uuid}-lighthouse.json
└── k6/
    └── {uuid}-results.json
```

### 4.2 Storage Service (storage.js)

```javascript
const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY
});

async function uploadFile(filePath, objectName, contentType) {
  await minioClient.fPutObject(
    process.env.MINIO_BUCKET,
    objectName,
    filePath,
    { 'Content-Type': contentType }
  );
  return `${process.env.MINIO_PUBLIC_URL}/${process.env.MINIO_BUCKET}/${objectName}`;
}
```

---

## 5. API ENDPOINT REFERENCE

### 5.1 Test Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check with uptime and memory |
| POST | `/api/test/smoke` | Run smoke tests |
| POST | `/api/test/performance` | Run Lighthouse audit |
| POST | `/api/test/load` | Run k6 load test |
| POST | `/api/test/pixel-audit` | Run pixel detection |

### 5.2 Request/Response Formats

**Smoke Test Request:**
```json
{
  "target_url": "https://example.com",
  "browser": "chromium",
  "viewport": { "width": 1920, "height": 1080 },
  "tests": ["homepage_loads", "no_console_errors"]
}
```

**Performance Test Request:**
```json
{
  "target_url": "https://example.com",
  "device": "desktop",
  "thresholds": {
    "LCP": 2500,
    "CLS": 0.1,
    "TTFB": 800,
    "performance_score": 80
  }
}
```

**Load Test Request:**
```json
{
  "target_url": "https://example.com",
  "virtual_users": 10,
  "duration": "30s",
  "thresholds": { "p95": 500, "error_rate": 0.01 }
}
```

**Pixel Audit Request:**
```json
{
  "target_url": "https://example.com",
  "expected_pixels": ["GA4", "GTM", "Meta Pixel"],
  "capture_har": true
}
```

---

## 6. ERROR HANDLING

### 6.1 Error Response Format

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "duration_ms": 1234
}
```

### 6.2 Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `target_url is required` | Missing URL | Provide valid URL |
| `Invalid browser` | Wrong browser name | Use chromium/firefox/webkit |
| `Timeout` | Page load too slow | Increase timeout or check URL |
| `Navigation failed` | Invalid URL format | Include protocol (https://) |

---

## 7. PERFORMANCE CONSIDERATIONS

### 7.1 Resource Limits

```yaml
test-api:
  mem_limit: 4g      # For Playwright/Lighthouse
  cpus: 2

k6:
  mem_limit: 1g      # For load testing
```

### 7.2 Timeouts

| Operation | Timeout |
|-----------|---------|
| Page navigation | 30s |
| k6 load test | 10 minutes |
| Rate limit window | 15 minutes |
| Screenshot capture | 10s |

---

## 8. SECURITY

### 8.1 Middleware Stack

- **helmet** - Security headers
- **cors** - Cross-origin control
- **rateLimit** - Request throttling (100/15min)

### 8.2 Input Validation

```javascript
// URL validation
if (!target_url) {
  return res.status(400).json({ error: 'target_url is required' });
}

// Browser validation
if (!['chromium', 'firefox', 'webkit'].includes(browser)) {
  return res.status(400).json({ error: 'Invalid browser' });
}
```

---

**ARCHITECTURE COMPLETE** ✓

This document reflects the actual testing-agent codebase implementation.
