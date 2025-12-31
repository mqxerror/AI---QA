# QA Dashboard - Test Types Documentation

## Overview
This document details all 8 test types available in the QA Dashboard, including the tools/libraries they use and what they test.

---

## 1. **Accessibility Test**
**Status:** ✅ Local (Dashboard Backend)
**Execution Time:** ~800ms

### Tools & Libraries Used:
- **Playwright** - Browser automation (Chromium headless)
- **axe-core** - Industry-standard accessibility testing engine
- **axe-playwright** - Playwright integration for axe-core

### What It Tests:
- **WCAG Compliance** - Web Content Accessibility Guidelines violations
- **ARIA Issues** - Improper use of ARIA attributes
- **Keyboard Navigation** - Elements that can't be accessed via keyboard
- **Screen Reader Compatibility** - Missing labels, alt text, etc.
- **Color Contrast** - Text readability issues
- **Form Accessibility** - Missing labels, fieldsets
- **Semantic HTML** - Improper heading hierarchy, landmarks

### Process:
1. Launches headless Chromium browser (1920x1080 viewport)
2. Navigates to target URL and waits for page to be fully loaded
3. Injects axe-core accessibility testing engine
4. Scans entire page for 50+ accessibility rules
5. Returns violations categorized by severity (critical, serious, moderate, minor)

### Output:
- Violation count by severity
- Detailed violation descriptions with fix recommendations
- Affected DOM nodes and elements
- Links to WCAG documentation for each issue

---

## 2. **Visual Regression Test**
**Status:** ⚠️ Local (has module compatibility issue)
**Execution Time:** ~5000ms

### Tools & Libraries Used:
- **Playwright** - Browser automation
- **PNG.js** - PNG image manipulation
- **pixelmatch** - Pixel-by-pixel image comparison
- **Node.js fs/path** - File system operations

### What It Tests:
- **Visual Changes** - Detects any pixel differences between baseline and current screenshots
- **Layout Shifts** - Identifies unexpected layout changes
- **Responsive Design** - Tests 3 viewports (Desktop, Tablet, Mobile)
- **CSS Rendering** - Catches styling regressions

### Process:
1. Takes screenshots at 3 different viewports:
   - Desktop: 1920x1080
   - Tablet: 768x1024
   - Mobile: 375x667
2. First run creates baseline images (reference)
3. Subsequent runs compare new screenshots against baseline
4. Pixel-by-pixel comparison calculates difference percentage
5. Generates diff images highlighting changed areas in red

### Output:
- Match percentage for each viewport
- Baseline, current, and diff screenshot URLs
- Pass/fail status based on threshold
- Visual difference indicators

---

## 3. **Security Scan**
**Status:** ✅ Local (Dashboard Backend)
**Execution Time:** ~800ms

### Tools & Libraries Used:
- **Playwright** - Browser automation for content inspection
- **ssl-checker** - SSL/TLS certificate validation
- **axios** - HTTP requests for header inspection
- **Node.js crypto** - Security validation

### What It Tests:

#### SSL/TLS Security:
- Certificate validity and expiration
- Days remaining before expiration
- Certificate issuer verification

#### Security Headers:
- **Content-Security-Policy (CSP)** - XSS protection
- **X-Content-Type-Options** - MIME-sniffing prevention
- **X-Frame-Options** - Clickjacking protection
- **Strict-Transport-Security (HSTS)** - HTTPS enforcement
- **X-XSS-Protection** - Cross-site scripting filter
- **Referrer-Policy** - Referrer information control

#### Vulnerabilities:
- **Mixed Content** - HTTP resources on HTTPS pages
- **Insecure Links** - External links without security attributes
- **Form Security** - Unencrypted form submissions
- **Cookie Security** - Missing Secure/HttpOnly flags
- **Information Disclosure** - Exposed server/framework versions

### Process:
1. Validates SSL certificate and expiration
2. Fetches HTTP response headers
3. Scans page for mixed content (HTTP on HTTPS)
4. Checks for common security misconfigurations
5. Calculates security score (0-100)

### Output:
- Security score and grade
- Violations by severity (critical, high, medium, low)
- SSL certificate information
- Detailed recommendations for each issue

---

## 4. **SEO Audit**
**Status:** ✅ Local (Dashboard Backend)
**Execution Time:** ~760ms

### Tools & Libraries Used:
- **Playwright** - Browser automation for DOM inspection
- **axios** - HTTP requests for external checks
- **Cheerio-like DOM parsing** - Via Playwright's page evaluation

### What It Tests:

#### Meta Tags:
- **Title** - Length (50-60 chars), uniqueness, keywords
- **Meta Description** - Length (150-160 chars), uniqueness
- **Meta Keywords** - Presence and relevance
- **Viewport** - Mobile responsiveness meta tag
- **Charset** - Character encoding declaration

#### Social Media Tags:
- **Open Graph** - Facebook/LinkedIn sharing (og:title, og:description, og:image)
- **Twitter Cards** - Twitter sharing (twitter:card, twitter:title, twitter:image)

#### Structured Data:
- **JSON-LD** - Schema.org structured data
- **Rich Snippets** - Product, Article, Organization schemas

#### Content Structure:
- **Headings (H1-H6)** - Proper hierarchy, single H1, descriptive text
- **Images** - Alt text, file size, lazy loading
- **Links** - Internal vs external, broken links, nofollow attributes

#### Technical SEO:
- **Canonical URL** - Duplicate content prevention
- **Robots Meta** - Indexing directives
- **Language** - HTML lang attribute
- **Mobile-Friendly** - Viewport and responsive design
- **Page Speed Indicators** - Render-blocking resources

### Process:
1. Launches browser with SEO bot user agent
2. Loads page and waits for network idle
3. Extracts all meta tags and structured data
4. Analyzes heading hierarchy and content
5. Checks all images for alt text and optimization
6. Validates internal and external links
7. Calculates SEO score (0-100)

### Output:
- Overall SEO score
- Issues categorized by severity (critical, warning, info)
- Detailed metadata analysis
- Social sharing preview data
- Recommendations for improvement

---

## 5. **Performance Test** (Lighthouse)
**Status:** ✅ External API (Test API on Mercan server)
**Execution Time:** ~10000ms

### Tools & Libraries Used:
- **Lighthouse** - Google's performance auditing tool
- **Playwright** - Browser automation
- **Chrome DevTools Protocol** - Performance metrics collection

### What It Tests:

#### Performance Metrics:
- **First Contentful Paint (FCP)** - When first content renders
- **Largest Contentful Paint (LCP)** - When main content loads
- **Time to Interactive (TTI)** - When page becomes interactive
- **Speed Index** - How quickly content is visually displayed
- **Total Blocking Time (TBT)** - Main thread blocking time
- **Cumulative Layout Shift (CLS)** - Visual stability

#### Resource Analysis:
- JavaScript bundle size and execution time
- CSS optimization and render-blocking
- Image optimization (format, compression, lazy loading)
- Font loading performance
- Third-party script impact

#### Web Vitals:
- Core Web Vitals scores (LCP, FID, CLS)
- Performance score (0-100)
- Best practices compliance

### Process:
1. Test API receives request with target URL
2. Launches Chromium with Lighthouse
3. Loads page and collects performance metrics
4. Analyzes resource loading and rendering
5. Generates detailed HTML report
6. Returns metrics and report URL

### Output:
- Performance score (0-100)
- Core Web Vitals measurements
- Detailed metric breakdown
- HTML report with recommendations
- Resource waterfall visualization

---

## 6. **Load Test**
**Status:** ✅ External API (Test API on Mercan server)
**Execution Time:** Variable (based on duration parameter)

### Tools & Libraries Used:
- **k6** - Modern load testing tool by Grafana Labs
- **HTTP/2** - Advanced protocol support
- **Virtual Users (VUs)** - Concurrent user simulation

### What It Tests:

#### Server Performance Under Load:
- **Response Time** - Average, min, max, p95, p99 percentiles
- **Throughput** - Requests per second
- **Error Rate** - Failed requests percentage
- **Concurrent Users** - System behavior under simultaneous load

#### Scalability:
- Server capacity limits
- Resource utilization trends
- Breaking point identification

### Process:
1. Configurable parameters:
   - Virtual Users: Number of concurrent users (default: 10)
   - Duration: Test length in seconds (default: 30)
2. Ramps up virtual users gradually
3. Each VU continuously sends requests
4. Collects metrics (response times, errors, throughput)
5. Reports aggregate statistics

### Output:
- Total requests made
- Average response time
- Error rate percentage
- Requests per second
- Response time percentiles (p95, p99)
- Pass/fail based on thresholds

---

## 7. **Smoke Test**
**Status:** ✅ External API (Test API on Mercan server)
**Execution Time:** ~550ms

### Tools & Libraries Used:
- **Playwright** - Browser automation
- **Chromium/Firefox/WebKit** - Multi-browser testing

### What It Tests:

#### Basic Functionality:
1. **Page Load** - Can the page load without errors?
2. **HTTP Status** - Returns 200 OK status
3. **Essential Elements** - Critical DOM elements exist
4. **JavaScript Errors** - Console has no critical errors

#### Quick Health Checks:
- Page title is present
- Main content area exists
- No server errors (500, 503)
- Basic navigation works

### Process:
1. Launches specified browser (default: Chromium)
2. Navigates to target URL with timeout
3. Checks HTTP response status
4. Validates page loaded successfully
5. Looks for JavaScript console errors
6. Verifies critical elements present

### Output:
- Total tests run
- Passed/failed count
- Specific test results
- Error messages if any
- Page load time

---

## 8. **Pixel Audit Test**
**Status:** ✅ External API (Test API on Mercan server)
**Execution Time:** ~3700ms

### Tools & Libraries Used:
- **Playwright** - Browser automation
- **Analytics Detection** - Custom pixel detection algorithms
- **DOM Inspection** - Script and image tag analysis

### What It Tests:

#### Tracking Pixels:
- **Google Analytics** - GA tracking codes (UA, GA4)
- **Facebook Pixel** - Meta/Facebook tracking
- **Google Tag Manager** - GTM containers
- **Google Ads** - Conversion tracking pixels
- **LinkedIn Insight Tag** - LinkedIn tracking
- **Twitter Pixel** - Twitter analytics
- **TikTok Pixel** - TikTok analytics
- **Pinterest Tag** - Pinterest conversion tracking
- **Hotjar** - Heatmap and behavior tracking
- **Custom Pixels** - Unknown tracking scripts

#### Analytics Implementation:
- Proper pixel installation
- Pixel firing on page load
- Multiple pixel conflicts
- Privacy compliance (cookie consent)

### Process:
1. Loads page with JavaScript enabled
2. Scans all <script> tags and src attributes
3. Detects known analytics pixel patterns
4. Monitors network requests for tracking beacons
5. Validates pixel implementation correctness
6. Checks for duplicate or conflicting pixels

### Output:
- List of detected pixels with details
- Implementation status (working/missing/broken)
- Pixel IDs and configuration
- Recommendations for optimization
- Privacy compliance warnings

---

## Summary Table

| Test Type | Location | Primary Tool | Speed | Main Purpose |
|-----------|----------|--------------|-------|--------------|
| Accessibility | Local | axe-core + Playwright | ⚡ Fast | WCAG compliance |
| Visual Regression | Local | Playwright + pixelmatch | ⚡ Fast | UI change detection |
| Security | Local | ssl-checker + Playwright | ⚡ Fast | Security vulnerabilities |
| SEO | Local | Playwright | ⚡ Fast | Search engine optimization |
| Performance | External | Lighthouse | 🐌 Slow | Speed & Core Web Vitals |
| Load | External | k6 | 🐌 Variable | Scalability & capacity |
| Smoke | External | Playwright | ⚡ Fast | Basic health check |
| Pixel Audit | External | Playwright | ⚡ Fast | Analytics tracking |

---

## Architecture Notes

### Local Tests (Dashboard Backend)
- Run directly in the Dashboard Backend container
- Use Playwright browsers installed in the container
- Faster execution (no network latency)
- Full control over test implementation

### External Tests (Test API)
- Run on separate Testing Agent API (Mercan server:3003)
- Handle resource-intensive tests (Lighthouse, k6)
- Offload processing from main dashboard
- Generate separate HTML reports

### Test API Connection
- **Endpoint:** `http://38.97.60.181:3003`
- **Status:** Currently showing as "Down" (may affect Performance, Load, Smoke, Pixel Audit)
- **Tools:** Lighthouse, k6, Playwright
- **Reports:** Stored in MinIO at `http://38.97.60.181:9002`

---

## Deployment Information

### Production Deployment
- **URL:** https://portugalgoldenvisas.co
- **Server:** 38.97.60.181
- **Platform:** Dokploy (Docker-based PaaS)
- **Containers:**
  - Dashboard Backend (Node.js + Express)
  - Dashboard Frontend (React)
  - Test API (Separate service)

### Authentication
- **Default Credentials:** admin / admin123
- **Auth Method:** JWT tokens (7-day expiration)
- **Security:** bcrypt password hashing

### Features
- Real-time WebSocket updates during test execution
- PDF report generation for all test types
- Scheduled tests (daily, weekly)
- Activity logging and audit trail
- Process monitoring and cleanup
- SQLite database for test results
