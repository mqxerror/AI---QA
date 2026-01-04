# AI Website Testing Agent - Claude Code Implementation Plan

## Project Overview

**Project Name:** AI Website Testing Agent  
**Purpose:** Automated website testing system for client sites with comprehensive UI, UX, performance, load, and marketing pixel testing  
**Target Client:** VariableLib.com (initial)  
**Developer:** Wassim / PixelCraftedMedia

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SYSTEM ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐      ┌──────────────────────────┐      ┌──────────────┐ │
│   │   AIRTABLE   │ ───► │ n8n (automator.pixel...) │ ───► │   MERCAN     │ │
│   │  (Interface) │ ◄─── │     (Orchestration)      │ ◄─── │   SERVER     │ │
│   └──────────────┘      └──────────────────────────┘      └──────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Airtable | Cloud (airtable.com) | Management interface, triggers, data storage |
| n8n | automator.pixelcraftedmedia.com | Workflow orchestration, API calls |
| Mercan Server | VPS (124GB RAM) | Test execution (Playwright, k6, Lighthouse) |
| DeepSeek API | api.deepseek.com | LLM for test case generation |
| MinIO | Mercan Server | Artifact storage (screenshots, videos, HAR) |

---

## PHASE 1: Airtable Base Setup

### Task 1.1: Create Airtable Base

**Base Name:** `AI Testing Agent`

### Task 1.2: Create Tables

#### Table: Clients

| Field Name | Field Type | Options/Notes |
|------------|------------|---------------|
| Client Name | Single line text | Primary field |
| Contact Email | Email | For report delivery |
| Slack Webhook | URL | Optional - for notifications |
| Asana Project ID | Single line text | Optional - for task creation |
| Status | Single select | Options: Active, Paused, Archived |
| Created | Created time | Auto |

#### Table: Websites

| Field Name | Field Type | Options/Notes |
|------------|------------|---------------|
| URL | URL | Primary field |
| Client | Link to Clients | Link to Clients table |
| Name | Single line text | Friendly name (e.g., "VariableLib Main") |
| Login Required | Checkbox | Does site need auth? |
| Login URL | URL | If login required |
| Login Username | Single line text | If login required |
| Login Password | Single line text | If login required (consider security) |
| Test Frequency | Single select | Options: Daily, Weekly, On-demand |
| Browsers | Multiple select | Options: Chrome, Safari, Firefox |
| Viewports | Multiple select | Options: Mobile-360, Mobile-390, Tablet-768, Desktop-1366, Desktop-1920 |
| Last Test Run | Date | Auto-updated by n8n |
| Last Result | Single select | Options: Pass, Fail, Partial, Error |
| Last Report URL | URL | Link to latest report |
| Status | Single select | Options: Active, Paused |
| n8n Webhook URL | Formula | Constructed webhook URL |

#### Table: Test Configurations

| Field Name | Field Type | Options/Notes |
|------------|------------|---------------|
| Config Name | Single line text | Primary field |
| Website | Link to Websites | Link to Websites table |
| Test Types | Multiple select | Options: Smoke, Regression, Performance, Load, Pixel Audit, Accessibility |
| Performance Thresholds | Long text | JSON: {"LCP": 2500, "CLS": 0.1, "TTFB": 800} |
| Load Test Config | Long text | JSON: {"vus": 10, "duration": "30s"} |
| Pixel Vendors | Multiple select | Options: GA4, Meta Pixel, GTM, TikTok, LinkedIn, Pinterest |
| Custom Test Steps | Long text | JSON array of custom test steps |
| Enabled | Checkbox | Is this config active? |

#### Table: Test Runs

| Field Name | Field Type | Options/Notes |
|------------|------------|---------------|
| Run ID | Auto number | Primary field |
| Website | Link to Websites | Link to Websites table |
| Test Type | Single select | Options: Smoke, Regression, Performance, Load, Pixel Audit, Full Suite |
| Triggered By | Single select | Options: Manual, Schedule, Webhook |
| Started At | Date | With time |
| Completed At | Date | With time |
| Duration Seconds | Number | Integer |
| Status | Single select | Options: Queued, Running, Pass, Fail, Error |
| Total Tests | Number | Integer |
| Passed | Number | Integer |
| Failed | Number | Integer |
| Skipped | Number | Integer |
| Report URL | URL | Link to full report |
| Summary | Long text | Quick text summary |
| Error Log | Long text | If error occurred |

#### Table: Test Results

| Field Name | Field Type | Options/Notes |
|------------|------------|---------------|
| Result ID | Auto number | Primary field |
| Test Run | Link to Test Runs | Link to Test Runs table |
| Test Name | Single line text | e.g., "Homepage loads correctly" |
| Category | Single select | Options: UI, UX, Performance, Load, Pixel, Accessibility |
| Browser | Single select | Options: Chrome, Safari, Firefox |
| Viewport | Single select | Options: 360x800, 390x844, 768x1024, 1366x768, 1920x1080 |
| Status | Single select | Options: Pass, Fail, Skip |
| Duration MS | Number | Milliseconds |
| Error Message | Long text | If failed |
| Screenshot | Attachment | Evidence image |
| Video | Attachment | If recorded |
| Selector | Single line text | CSS selector tested |
| Expected | Long text | Expected result |
| Actual | Long text | Actual result |

#### Table: Performance Metrics

| Field Name | Field Type | Options/Notes |
|------------|------------|---------------|
| Metric ID | Auto number | Primary field |
| Test Run | Link to Test Runs | Link to Test Runs table |
| Page URL | URL | Which page |
| Browser | Single select | Options: Chrome, Safari, Firefox |
| Viewport | Single select | Viewport tested |
| LCP | Number | Largest Contentful Paint (ms) |
| CLS | Number | Cumulative Layout Shift (decimal) |
| INP | Number | Interaction to Next Paint (ms) |
| FCP | Number | First Contentful Paint (ms) |
| TTFB | Number | Time to First Byte (ms) |
| Total Requests | Number | HTTP request count |
| Page Size KB | Number | Total page weight |
| Performance Score | Number | Lighthouse score 0-100 |
| Accessibility Score | Number | Lighthouse score 0-100 |
| SEO Score | Number | Lighthouse score 0-100 |
| Best Practices Score | Number | Lighthouse score 0-100 |
| Status | Single select | Options: Good, Needs Work, Poor |
| Full Report JSON | Long text | Complete Lighthouse JSON |

#### Table: Load Test Results

| Field Name | Field Type | Options/Notes |
|------------|------------|---------------|
| Load Test ID | Auto number | Primary field |
| Test Run | Link to Test Runs | Link to Test Runs table |
| Endpoint | URL | Tested URL |
| HTTP Method | Single select | Options: GET, POST, PUT, DELETE |
| Virtual Users | Number | Concurrent users |
| Duration Seconds | Number | Test length |
| Total Requests | Number | Request count |
| Requests Per Second | Number | Throughput (decimal) |
| P50 MS | Number | Median latency |
| P90 MS | Number | 90th percentile |
| P95 MS | Number | 95th percentile |
| P99 MS | Number | 99th percentile |
| Error Rate Percent | Number | Failure percentage (decimal) |
| Data Received KB | Number | Download size |
| Data Sent KB | Number | Upload size |
| Status | Single select | Options: Pass, Fail |
| Threshold Breaches | Long text | Which thresholds failed |
| Full Report JSON | Long text | Complete k6 JSON |

#### Table: Pixel Audit Results

| Field Name | Field Type | Options/Notes |
|------------|------------|---------------|
| Audit ID | Auto number | Primary field |
| Test Run | Link to Test Runs | Link to Test Runs table |
| Page URL | URL | Where checked |
| Pixel Name | Single select | Options: GA4, Meta Pixel, GTM, Google Ads, TikTok, LinkedIn, Pinterest, Hotjar, Clarity |
| Expected | Checkbox | Should this pixel be present? |
| Detected | Checkbox | Was it found? |
| Status | Single select | Options: Found, Missing, Unexpected, Error |
| Script URL | URL | Source of pixel |
| Container ID | Single line text | GTM/GA4 ID found |
| Events Detected | Long text | JSON array of events fired |
| Network Calls | Long text | JSON of relevant network requests |
| Evidence Screenshot | Attachment | Screenshot evidence |
| HAR File | Attachment | Network capture |

#### Table: Failures

| Field Name | Field Type | Options/Notes |
|------------|------------|---------------|
| Failure ID | Auto number | Primary field |
| Test Result | Link to Test Results | Link to Test Results table |
| Website | Link to Websites | Link to Websites table |
| Priority | Single select | Options: Critical, High, Medium, Low |
| Failure Type | Single select | Options: UI Bug, Performance, Broken Link, Missing Pixel, Load Error, Accessibility |
| Summary | Single line text | Brief description |
| Reproduction Steps | Long text | How to reproduce |
| Asana Task URL | URL | Created task link |
| Asana Task ID | Single line text | Task ID |
| Resolution Status | Single select | Options: Open, In Progress, Resolved, Won't Fix |
| Assigned To | Single line text | Who's responsible |
| Notes | Long text | Investigation notes |
| Resolved At | Date | When fixed |

#### Table: Test Cases (LLM Generated)

| Field Name | Field Type | Options/Notes |
|------------|------------|---------------|
| Test Case ID | Auto number | Primary field |
| Website | Link to Websites | Link to Websites table |
| Page URL | URL | Which page |
| Test Name | Single line text | Descriptive name |
| Test Type | Single select | Options: Smoke, Regression, E2E |
| Category | Single select | Options: Navigation, Form, Content, Interaction, Visual |
| Priority | Single select | Options: Critical, High, Medium, Low |
| Preconditions | Long text | Setup needed |
| Test Steps | Long text | JSON array of steps |
| Expected Result | Long text | What should happen |
| Selector | Single line text | Main CSS selector |
| Generated By | Single select | Options: LLM, Manual |
| Approved | Checkbox | Human approved? |
| Enabled | Checkbox | Run this test? |
| Last Run Status | Single select | Options: Not Run, Pass, Fail |
| Created At | Created time | Auto |

---

## PHASE 2: Airtable Views

### Websites Table Views

| View Name | Filter | Sort | Purpose |
|-----------|--------|------|---------|
| All Active | Status = Active | Last Test Run DESC | Main working view |
| Needs Testing | Last Test Run < 7 days ago | Created ASC | Overdue tests |
| Failed Last Run | Last Result = Fail | Last Test Run DESC | Attention needed |
| By Client | Group by Client | Name ASC | Client overview |

### Test Runs Table Views

| View Name | Filter | Sort | Purpose |
|-----------|--------|------|---------|
| Recent Runs | Last 30 days | Started At DESC | Quick history |
| Failed Runs | Status = Fail | Started At DESC | Issues to review |
| Running Now | Status = Running | Started At DESC | Monitor active |
| By Website | Group by Website | Started At DESC | Per-site history |

### Failures Table Views

| View Name | Filter | Sort | Purpose |
|-----------|--------|------|---------|
| Open Issues | Resolution Status = Open | Priority ASC | Active problems |
| Critical | Priority = Critical | Created DESC | Urgent items |
| By Website | Group by Website | Created DESC | Per-site issues |
| Resolved | Resolution Status = Resolved | Resolved At DESC | History |

---

## PHASE 3: Airtable Automations

### Automation 1: New Website → Initial Test

**Trigger:** When record created in Websites  
**Condition:** Status = Active  
**Action:** Send webhook to n8n

```json
{
  "action": "run_test",
  "test_type": "smoke",
  "website_id": "{Record ID}",
  "url": "{URL}",
  "name": "{Name}",
  "browsers": "{Browsers}",
  "viewports": "{Viewports}",
  "triggered_by": "new_website"
}
```

### Automation 2: Manual Smoke Test Button

**Trigger:** When button clicked (add button field to Websites)  
**Action:** Send webhook to n8n

```json
{
  "action": "run_test",
  "test_type": "smoke",
  "website_id": "{Record ID}",
  "url": "{URL}",
  "name": "{Name}",
  "browsers": "{Browsers}",
  "viewports": "{Viewports}",
  "triggered_by": "manual"
}
```

### Automation 3: Manual Full Suite Button

**Trigger:** When button clicked  
**Action:** Send webhook to n8n

```json
{
  "action": "run_test",
  "test_type": "full_suite",
  "website_id": "{Record ID}",
  "url": "{URL}",
  "name": "{Name}",
  "browsers": "{Browsers}",
  "viewports": "{Viewports}",
  "config_id": "{Test Configuration Record ID}",
  "triggered_by": "manual"
}
```

### Automation 4: Daily Scheduled Tests

**Trigger:** At scheduled time (6:00 AM daily)  
**Find Records:** Websites where Test Frequency = Daily AND Status = Active  
**For Each:** Send webhook to n8n

```json
{
  "action": "run_test",
  "test_type": "smoke",
  "website_id": "{Record ID}",
  "url": "{URL}",
  "name": "{Name}",
  "browsers": "{Browsers}",
  "viewports": "{Viewports}",
  "triggered_by": "schedule_daily"
}
```

### Automation 5: Weekly Scheduled Tests

**Trigger:** At scheduled time (Sunday 2:00 AM)  
**Find Records:** Websites where Test Frequency = Weekly AND Status = Active  
**For Each:** Send webhook to n8n

```json
{
  "action": "run_test",
  "test_type": "full_suite",
  "website_id": "{Record ID}",
  "url": "{URL}",
  "name": "{Name}",
  "browsers": "{Browsers}",
  "viewports": "{Viewports}",
  "config_id": "{Test Configuration Record ID}",
  "triggered_by": "schedule_weekly"
}
```

### Automation 6: Generate Test Cases Button

**Trigger:** When button clicked  
**Action:** Send webhook to n8n

```json
{
  "action": "generate_test_cases",
  "website_id": "{Record ID}",
  "url": "{URL}",
  "name": "{Name}"
}
```

### Automation 7: Failure Notification

**Trigger:** When record created in Failures  
**Condition:** Priority = Critical OR Priority = High  
**Action:** Send Slack notification + Email (via n8n webhook)

```json
{
  "action": "notify_failure",
  "failure_id": "{Record ID}",
  "website_name": "{Website.Name}",
  "priority": "{Priority}",
  "summary": "{Summary}",
  "test_result_id": "{Test Result}"
}
```

---

## PHASE 4: n8n Workflows

### n8n Instance Details

- **URL:** https://automator.pixelcraftedmedia.com
- **Webhook Base:** https://automator.pixelcraftedmedia.com/webhook/

### Workflow 1: Main Test Orchestrator

**Webhook Path:** `/webhook/testing-agent/run`  
**Method:** POST

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MAIN TEST ORCHESTRATOR                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Webhook  │───►│  Parse   │───►│  Create  │───►│  Switch  │              │
│  │ Trigger  │    │  Input   │    │ Test Run │    │ By Type  │              │
│  └──────────┘    └──────────┘    └──────────┘    └────┬─────┘              │
│                                                        │                    │
│                    ┌──────────────────┬────────────────┼────────────────┐   │
│                    ▼                  ▼                ▼                ▼   │
│              ┌──────────┐      ┌──────────┐     ┌──────────┐    ┌─────────┐│
│              │  Smoke   │      │   Perf   │     │   Load   │    │  Pixel  ││
│              │  Tests   │      │  Tests   │     │  Tests   │    │  Audit  ││
│              └────┬─────┘      └────┬─────┘     └────┬─────┘    └────┬────┘│
│                   │                 │                │               │      │
│                   └─────────────────┴────────────────┴───────────────┘      │
│                                      │                                       │
│                                      ▼                                       │
│                               ┌──────────────┐                              │
│                               │   Collect    │                              │
│                               │   Results    │                              │
│                               └──────┬───────┘                              │
│                                      │                                       │
│                    ┌─────────────────┼─────────────────┐                    │
│                    ▼                 ▼                 ▼                    │
│              ┌──────────┐     ┌──────────┐      ┌──────────┐               │
│              │  Update  │     │ Generate │      │  Notify  │               │
│              │ Airtable │     │  Report  │      │  Slack   │               │
│              └──────────┘     └──────────┘      └──────────┘               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Node Details

| Node # | Type | Name | Configuration |
|--------|------|------|---------------|
| 1 | Webhook | Receive Test Request | Path: /testing-agent/run, Method: POST |
| 2 | Set | Parse Input | Extract: action, test_type, website_id, url, browsers, viewports |
| 3 | Airtable | Create Test Run | Create record in Test Runs table with Status: Running |
| 4 | Switch | Route by Test Type | Conditions: smoke, regression, performance, load, pixel_audit, full_suite |
| 5a | Execute Workflow | Run Smoke Tests | Call Smoke Test sub-workflow |
| 5b | Execute Workflow | Run Performance Tests | Call Performance Test sub-workflow |
| 5c | Execute Workflow | Run Load Tests | Call Load Test sub-workflow |
| 5d | Execute Workflow | Run Pixel Audit | Call Pixel Audit sub-workflow |
| 6 | Merge | Collect All Results | Merge results from all test types |
| 7 | Code | Calculate Summary | Count pass/fail, calculate duration |
| 8 | Airtable | Update Test Run | Update with results, status, summary |
| 9 | Airtable | Create Test Results | Batch create individual test results |
| 10 | HTTP Request | Upload Screenshots | Upload to MinIO |
| 11 | Code | Generate HTML Report | Create formatted report |
| 12 | HTTP Request | Save Report | Save to MinIO |
| 13 | IF | Check Failures | If any tests failed |
| 14 | Execute Workflow | Handle Failures | Create Asana tasks for failures |
| 15 | Slack | Send Notification | Summary message |
| 16 | Email | Send Report | Email with report link |
| 17 | Airtable | Update Website | Update Last Test Run, Last Result |

### Workflow 2: Smoke Test Executor

**Type:** Sub-workflow  
**Input:** url, browsers[], viewports[], website_id, test_run_id

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SMOKE TEST EXECUTOR                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  Input   │───►│  Loop    │───►│  HTTP    │───►│  Parse   │              │
│  │  Params  │    │ Browser/ │    │ Request  │    │ Results  │              │
│  │          │    │ Viewport │    │ (Server) │    │          │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Node Details

| Node # | Type | Name | Configuration |
|--------|------|------|---------------|
| 1 | Set | Prepare Params | Set url, browsers, viewports |
| 2 | Split In Batches | Loop Browsers | Iterate each browser |
| 3 | Split In Batches | Loop Viewports | Iterate each viewport |
| 4 | HTTP Request | Call Test Server | POST to Mercan server Playwright API |
| 5 | Code | Parse Results | Extract test results, screenshots |
| 6 | Merge | Collect Results | Combine all browser/viewport results |
| 7 | Return | Output | Return array of test results |

**HTTP Request to Mercan Server:**

```json
{
  "url": "http://mercan-server:3001/api/test/smoke",
  "method": "POST",
  "body": {
    "target_url": "{{$node.Input.url}}",
    "browser": "{{$node.Loop_Browser.browser}}",
    "viewport": "{{$node.Loop_Viewport.viewport}}",
    "tests": [
      "homepage_loads",
      "navigation_works",
      "no_console_errors",
      "images_load",
      "links_valid"
    ]
  }
}
```

### Workflow 3: Performance Test Executor

**Type:** Sub-workflow  
**Input:** url, test_run_id, thresholds

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PERFORMANCE TEST EXECUTOR                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  Input   │───►│  HTTP    │───►│  Parse   │───►│ Compare  │              │
│  │  Params  │    │ Request  │    │ Metrics  │    │Thresholds│              │
│  │          │    │(Mercan)  │    │          │    │          │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**HTTP Request to Mercan Server:**

```json
{
  "url": "http://mercan-server:3001/api/test/performance",
  "method": "POST",
  "body": {
    "target_url": "{{$node.Input.url}}",
    "device": "desktop",
    "thresholds": {
      "LCP": 2500,
      "CLS": 0.1,
      "TTFB": 800,
      "performance_score": 80
    }
  }
}
```

### Workflow 4: Load Test Executor

**Type:** Sub-workflow  
**Input:** url, test_run_id, config (vus, duration)

**HTTP Request to Mercan Server:**

```json
{
  "url": "http://mercan-server:3001/api/test/load",
  "method": "POST",
  "body": {
    "target_url": "{{$node.Input.url}}",
    "virtual_users": 10,
    "duration": "30s",
    "thresholds": {
      "p95": 500,
      "error_rate": 0.01
    }
  }
}
```

### Workflow 5: Pixel Audit Executor

**Type:** Sub-workflow  
**Input:** url, test_run_id, expected_pixels[]

**HTTP Request to Mercan Server:**

```json
{
  "url": "http://mercan-server:3001/api/test/pixel-audit",
  "method": "POST",
  "body": {
    "target_url": "{{$node.Input.url}}",
    "incognito": true,
    "expected_pixels": ["GA4", "Meta Pixel", "GTM"],
    "capture_har": true
  }
}
```

### Workflow 6: Test Case Generator (LLM)

**Webhook Path:** `/webhook/testing-agent/generate-tests`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TEST CASE GENERATOR                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Webhook  │───►│  Crawl   │───►│ DeepSeek │───►│  Parse   │              │
│  │ Trigger  │    │  Site    │    │   API    │    │  Cases   │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│                                          │                                   │
│                                          ▼                                   │
│                                   ┌──────────┐                              │
│                                   │ Airtable │                              │
│                                   │  Create  │                              │
│                                   │  Cases   │                              │
│                                   └──────────┘                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**DeepSeek API Call:**

```json
{
  "url": "https://api.deepseek.com/v1/chat/completions",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer {{$env.DEEPSEEK_API_KEY}}",
    "Content-Type": "application/json"
  },
  "body": {
    "model": "deepseek-chat",
    "messages": [
      {
        "role": "system",
        "content": "You are a QA engineer. Generate test cases for website testing. Output JSON array."
      },
      {
        "role": "user",
        "content": "Generate smoke test cases for this website:\n\nURL: {{url}}\n\nPage Content:\n{{page_content}}\n\nOutput format:\n[{\"name\": \"...\", \"type\": \"smoke\", \"steps\": [...], \"expected\": \"...\", \"selector\": \"...\"}]"
      }
    ],
    "temperature": 0.3,
    "max_tokens": 2000
  }
}
```

### Workflow 7: Failure Handler

**Type:** Sub-workflow  
**Input:** failure_data, website, client

**Actions:**
1. Create Airtable Failure record
2. Get Client's Asana Project ID
3. Create Asana task with screenshot
4. Update Failure record with Asana URL
5. Send Slack alert
6. Send Email notification

### Workflow 8: Report Generator

**Type:** Sub-workflow  
**Input:** test_run_id, all_results

**Actions:**
1. Fetch all test results from current run
2. Fetch performance metrics
3. Fetch load test results
4. Fetch pixel audit results
5. Generate HTML report using template
6. Upload to MinIO
7. Return report URL

---

## PHASE 5: Mercan Server Setup

### Server Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 16GB | 32GB |
| CPU | 4 cores | 8 cores |
| Storage | 50GB | 100GB |
| OS | Ubuntu 22.04+ | Ubuntu 24.04 |

### Docker Services

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Test API Server (Node.js)
  test-api:
    build: ./test-api
    ports:
      - "3001:3001"
    volumes:
      - ./playwright:/app/playwright
      - ./k6:/app/k6
      - ./artifacts:/app/artifacts
    environment:
      - NODE_ENV=production
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
    depends_on:
      - minio
      - redis

  # Playwright Container
  playwright:
    image: mcr.microsoft.com/playwright:v1.40.0-jammy
    volumes:
      - ./playwright:/app
      - ./artifacts/screenshots:/app/screenshots
      - ./artifacts/videos:/app/videos
    working_dir: /app
    command: npx playwright test --reporter=json

  # k6 Load Testing
  k6:
    image: grafana/k6:latest
    volumes:
      - ./k6:/scripts
      - ./artifacts/k6:/results

  # MinIO Storage
  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    environment:
      - MINIO_ROOT_USER=${MINIO_ACCESS_KEY}
      - MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY}
    command: server /data --console-address ":9001"

  # Redis Queue
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Lighthouse (optional - can run via CLI)
  lighthouse:
    image: femtopixel/google-lighthouse:latest
    volumes:
      - ./artifacts/lighthouse:/home/user/reports

volumes:
  minio_data:
  redis_data:
```

### Test API Server Structure

```
/opt/testing-agent/
├── docker-compose.yml
├── .env
├── test-api/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── index.js              # Express server
│   │   ├── routes/
│   │   │   ├── smoke.js          # /api/test/smoke
│   │   │   ├── performance.js    # /api/test/performance
│   │   │   ├── load.js           # /api/test/load
│   │   │   └── pixel-audit.js    # /api/test/pixel-audit
│   │   ├── services/
│   │   │   ├── playwright.js     # Playwright runner
│   │   │   ├── lighthouse.js     # Lighthouse runner
│   │   │   ├── k6.js             # k6 runner
│   │   │   └── storage.js        # MinIO client
│   │   └── utils/
│   │       ├── screenshot.js
│   │       └── report.js
├── playwright/
│   ├── playwright.config.ts
│   ├── package.json
│   ├── tests/
│   │   ├── smoke/
│   │   │   ├── homepage.spec.ts
│   │   │   ├── navigation.spec.ts
│   │   │   └── forms.spec.ts
│   │   ├── regression/
│   │   │   └── full-suite.spec.ts
│   │   └── pixel-audit/
│   │       └── tracking.spec.ts
├── k6/
│   ├── load-test.js
│   └── stress-test.js
├── artifacts/
│   ├── screenshots/
│   ├── videos/
│   ├── har/
│   └── reports/
└── scripts/
    ├── setup.sh
    └── cleanup.sh
```

### API Endpoints

#### POST /api/test/smoke

```javascript
// Request
{
  "target_url": "https://variablelib.com",
  "browser": "chromium",
  "viewport": { "width": 1920, "height": 1080 },
  "tests": ["homepage_loads", "navigation_works", "no_console_errors"]
}

// Response
{
  "success": true,
  "duration_ms": 5230,
  "results": [
    {
      "name": "homepage_loads",
      "status": "pass",
      "duration_ms": 1200,
      "screenshot": "https://minio.../screenshots/abc123.png"
    },
    {
      "name": "navigation_works",
      "status": "pass",
      "duration_ms": 2100
    }
  ],
  "browser": "chromium",
  "viewport": "1920x1080"
}
```

#### POST /api/test/performance

```javascript
// Request
{
  "target_url": "https://variablelib.com",
  "device": "desktop"
}

// Response
{
  "success": true,
  "metrics": {
    "LCP": 1850,
    "CLS": 0.05,
    "FCP": 980,
    "INP": 120,
    "TTFB": 320,
    "total_requests": 45,
    "page_size_kb": 1250
  },
  "scores": {
    "performance": 89,
    "accessibility": 92,
    "seo": 95,
    "best_practices": 88
  },
  "report_url": "https://minio.../reports/lighthouse-abc123.html"
}
```

#### POST /api/test/load

```javascript
// Request
{
  "target_url": "https://variablelib.com",
  "virtual_users": 10,
  "duration": "30s"
}

// Response
{
  "success": true,
  "metrics": {
    "total_requests": 450,
    "rps": 15.2,
    "p50_ms": 120,
    "p90_ms": 250,
    "p95_ms": 380,
    "p99_ms": 520,
    "error_rate": 0.002
  },
  "status": "pass",
  "report_url": "https://minio.../reports/k6-abc123.json"
}
```

#### POST /api/test/pixel-audit

```javascript
// Request
{
  "target_url": "https://variablelib.com",
  "incognito": true,
  "expected_pixels": ["GA4", "Meta Pixel", "GTM"]
}

// Response
{
  "success": true,
  "pixels_found": [
    {
      "name": "GA4",
      "detected": true,
      "container_id": "G-XXXXXXXXXX",
      "script_url": "https://www.googletagmanager.com/gtag/js"
    },
    {
      "name": "Meta Pixel",
      "detected": true,
      "pixel_id": "123456789",
      "events": ["PageView"]
    },
    {
      "name": "GTM",
      "detected": true,
      "container_id": "GTM-XXXXXXX"
    }
  ],
  "missing_pixels": [],
  "har_url": "https://minio.../har/audit-abc123.har",
  "screenshot_url": "https://minio.../screenshots/audit-abc123.png"
}
```

---

## PHASE 6: Playwright Test Scripts

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['json', { outputFile: 'results.json' }],
    ['html', { outputFolder: 'playwright-report' }]
  ],
  use: {
    baseURL: process.env.TARGET_URL || 'https://variablelib.com',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'retain-on-failure',
  },
  projects: [
    // Desktop browsers
    {
      name: 'chromium-desktop-1920',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'chromium-desktop-1366',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 }
      },
    },
    {
      name: 'webkit-desktop',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    // Tablet
    {
      name: 'chromium-tablet',
      use: {
        ...devices['iPad Pro 11'],
      },
    },
    // Mobile
    {
      name: 'chromium-mobile-360',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 360, height: 800 }
      },
    },
    {
      name: 'chromium-mobile-390',
      use: {
        ...devices['iPhone 14'],
      },
    },
    {
      name: 'webkit-mobile',
      use: {
        ...devices['iPhone 14'],
      },
    },
  ],
});
```

### tests/smoke/homepage.spec.ts

```typescript
import { test, expect } from '@playwright/test';

test.describe('Homepage Smoke Tests', () => {
  
  test('page loads successfully', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/VariableLib|Variable/i);
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    expect(errors).toHaveLength(0);
  });

  test('all images load', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const images = await page.locator('img').all();
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        expect(naturalWidth, `Image ${src} should load`).toBeGreaterThan(0);
      }
    }
  });

  test('no broken links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const links = await page.locator('a[href]').all();
    const brokenLinks: string[] = [];
    
    for (const link of links.slice(0, 20)) { // Check first 20 links
      const href = await link.getAttribute('href');
      if (href && href.startsWith('http')) {
        try {
          const response = await page.request.head(href);
          if (response.status() >= 400) {
            brokenLinks.push(`${href} (${response.status()})`);
          }
        } catch (e) {
          brokenLinks.push(`${href} (failed)`);
        }
      }
    }
    
    expect(brokenLinks, 'Broken links found').toHaveLength(0);
  });

  test('main navigation visible', async ({ page }) => {
    await page.goto('/');
    
    const nav = page.locator('nav, header, [role="navigation"]').first();
    await expect(nav).toBeVisible();
  });

  test('footer visible', async ({ page }) => {
    await page.goto('/');
    
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
  });

  test('page responds within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime, 'Page should load within 5 seconds').toBeLessThan(5000);
  });

});
```

### tests/smoke/navigation.spec.ts

```typescript
import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  
  test('main menu items are clickable', async ({ page }) => {
    await page.goto('/');
    
    // Find navigation links
    const navLinks = page.locator('nav a, header a').filter({ hasText: /.+/ });
    const count = await navLinks.count();
    
    expect(count, 'Should have navigation links').toBeGreaterThan(0);
    
    // Click first few nav items
    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = navLinks.nth(i);
      const href = await link.getAttribute('href');
      
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        await link.click();
        await page.waitForLoadState('domcontentloaded');
        
        const response = page.url();
        expect(response, `Navigation to ${href} should work`).toBeTruthy();
        
        await page.goBack();
      }
    }
  });

  test('logo links to homepage', async ({ page }) => {
    await page.goto('/about'); // Start from non-home page
    
    const logo = page.locator('header a:has(img), header a:has(svg), a[href="/"]').first();
    await logo.click();
    
    await expect(page).toHaveURL(/\/$/);
  });

});
```

### tests/pixel-audit/tracking.spec.ts

```typescript
import { test, expect, Page } from '@playwright/test';

interface NetworkRequest {
  url: string;
  method: string;
}

test.describe('Pixel Audit', () => {
  let networkRequests: NetworkRequest[] = [];

  test.beforeEach(async ({ page }) => {
    networkRequests = [];
    
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method()
      });
    });
  });

  test('GA4 is present and firing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for delayed scripts
    
    const ga4Requests = networkRequests.filter(r => 
      r.url.includes('google-analytics.com') || 
      r.url.includes('googletagmanager.com/gtag') ||
      r.url.includes('analytics.google.com')
    );
    
    expect(ga4Requests.length, 'GA4 should be present').toBeGreaterThan(0);
  });

  test('GTM is present', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const gtmRequests = networkRequests.filter(r => 
      r.url.includes('googletagmanager.com/gtm.js')
    );
    
    // Also check for GTM in DOM
    const gtmScript = await page.locator('script[src*="googletagmanager.com/gtm"]').count();
    const gtmNoscript = await page.locator('noscript iframe[src*="googletagmanager.com"]').count();
    
    const hasGTM = gtmRequests.length > 0 || gtmScript > 0 || gtmNoscript > 0;
    expect(hasGTM, 'GTM should be present').toBeTruthy();
  });

  test('Meta Pixel is present', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const metaRequests = networkRequests.filter(r => 
      r.url.includes('facebook.com/tr') || 
      r.url.includes('connect.facebook.net')
    );
    
    // Also check for fbq in window
    const hasFbq = await page.evaluate(() => {
      return typeof (window as any).fbq !== 'undefined';
    });
    
    const hasMeta = metaRequests.length > 0 || hasFbq;
    expect(hasMeta, 'Meta Pixel should be present').toBeTruthy();
  });

  test('no duplicate tracking pixels', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for duplicate GA4 tags
    const ga4Scripts = await page.locator('script[src*="googletagmanager.com/gtag"]').count();
    expect(ga4Scripts, 'Should not have duplicate GA4 scripts').toBeLessThanOrEqual(1);
    
    // Check for duplicate GTM containers
    const gtmScripts = await page.locator('script[src*="googletagmanager.com/gtm"]').count();
    expect(gtmScripts, 'Should not have duplicate GTM scripts').toBeLessThanOrEqual(1);
  });

});
```

---

## PHASE 7: k6 Load Test Scripts

### k6/load-test.js

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    errors: ['rate<0.01'],             // Error rate under 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'https://variablelib.com';

export default function () {
  // Homepage
  let res = http.get(BASE_URL);
  
  check(res, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads in <2s': (r) => r.timings.duration < 2000,
  });
  
  errorRate.add(res.status !== 200);
  responseTime.add(res.timings.duration);
  
  sleep(1);
  
  // Check other pages if they exist
  const pages = ['/about', '/contact', '/pricing'];
  
  for (const page of pages) {
    res = http.get(`${BASE_URL}${page}`);
    
    check(res, {
      [`${page} status is 2xx or redirect`]: (r) => r.status < 400,
    });
    
    errorRate.add(res.status >= 400);
    responseTime.add(res.timings.duration);
    
    sleep(0.5);
  }
}

export function handleSummary(data) {
  return {
    'results.json': JSON.stringify(data, null, 2),
  };
}
```

---

## PHASE 8: Environment Variables

### .env (Mercan Server)

```bash
# Server
NODE_ENV=production
PORT=3001

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=your_minio_access_key
MINIO_SECRET_KEY=your_minio_secret_key
MINIO_BUCKET=testing-agent

# n8n Connection
N8N_WEBHOOK_URL=https://automator.pixelcraftedmedia.com/webhook

# Optional: Browserless
BROWSERLESS_URL=ws://browserless:3000
```

### n8n Environment Variables

```bash
# Airtable
AIRTABLE_API_KEY=your_airtable_pat
AIRTABLE_BASE_ID=your_base_id

# DeepSeek
DEEPSEEK_API_KEY=your_deepseek_key

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_app_password

# Asana
ASANA_ACCESS_TOKEN=your_asana_token

# Mercan Server
MERCAN_TEST_API_URL=http://your-mercan-ip:3001

# MinIO
MINIO_PUBLIC_URL=https://your-minio-domain
```

---

## PHASE 9: Implementation Checklist

### Day 1: Airtable Setup

- [ ] Create Airtable base "AI Testing Agent"
- [ ] Create Clients table with all fields
- [ ] Create Websites table with all fields
- [ ] Create Test Configurations table
- [ ] Create Test Runs table
- [ ] Create Test Results table
- [ ] Create Performance Metrics table
- [ ] Create Load Test Results table
- [ ] Create Pixel Audit Results table
- [ ] Create Failures table
- [ ] Create Test Cases table
- [ ] Create all views for each table
- [ ] Add button fields for manual triggers
- [ ] Create automation: New Website → Webhook
- [ ] Create automation: Manual Smoke Test button
- [ ] Create automation: Manual Full Suite button
- [ ] Create automation: Daily scheduled tests
- [ ] Create automation: Weekly scheduled tests
- [ ] Create automation: Generate Test Cases button
- [ ] Test all automations with dummy data

### Day 2: n8n Workflows - Part 1

- [ ] Create Main Test Orchestrator workflow
- [ ] Configure webhook endpoint
- [ ] Add Airtable integration (fetch config)
- [ ] Add Airtable integration (create test run)
- [ ] Add Switch node for test type routing
- [ ] Test webhook receives Airtable data

### Day 3: n8n Workflows - Part 2

- [ ] Create Smoke Test Executor sub-workflow
- [ ] Create Performance Test Executor sub-workflow
- [ ] Create Load Test Executor sub-workflow
- [ ] Create Pixel Audit Executor sub-workflow
- [ ] Connect sub-workflows to main orchestrator

### Day 4: Mercan Server Setup

- [ ] SSH into Mercan server
- [ ] Create /opt/testing-agent directory
- [ ] Create docker-compose.yml
- [ ] Create .env file
- [ ] Build test-api Docker image
- [ ] Start all services
- [ ] Verify MinIO is accessible
- [ ] Verify Redis is running
- [ ] Test API endpoints with curl

### Day 5: Playwright Tests

- [ ] Create playwright directory structure
- [ ] Install Playwright dependencies
- [ ] Create playwright.config.ts
- [ ] Create homepage.spec.ts
- [ ] Create navigation.spec.ts
- [ ] Create tracking.spec.ts (pixel audit)
- [ ] Run tests locally to verify
- [ ] Integrate with test-api

### Day 6: k6 Load Tests

- [ ] Create k6 directory
- [ ] Create load-test.js
- [ ] Test k6 script locally
- [ ] Integrate with test-api

### Day 7: Integration & Testing

- [ ] Connect n8n to Mercan test-api
- [ ] Test full flow: Airtable → n8n → Mercan → Airtable
- [ ] Verify screenshots upload to MinIO
- [ ] Verify reports generate correctly
- [ ] Test Slack notifications
- [ ] Test email notifications
- [ ] Create Asana integration for failures

### Day 8: LLM Test Case Generator

- [ ] Create Test Case Generator workflow in n8n
- [ ] Configure DeepSeek API integration
- [ ] Create crawl4ai or Playwright site crawler
- [ ] Test LLM prompt for test case generation
- [ ] Save generated cases to Airtable
- [ ] Test full generation flow

### Day 9: Documentation & Polish

- [ ] Document all webhook endpoints
- [ ] Document Airtable automation triggers
- [ ] Create user guide for client
- [ ] Test all scenarios end-to-end
- [ ] Fix any bugs discovered
- [ ] Deploy final version

---

## API Reference

### n8n Webhook Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /webhook/testing-agent/run | POST | Trigger test run |
| /webhook/testing-agent/generate-tests | POST | Generate test cases |
| /webhook/testing-agent/notify-failure | POST | Handle failure notification |

### Mercan Server API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/test/smoke | POST | Run smoke tests |
| /api/test/performance | POST | Run Lighthouse |
| /api/test/load | POST | Run k6 load test |
| /api/test/pixel-audit | POST | Run pixel audit |
| /api/health | GET | Health check |

### Airtable Tables Reference

| Table | ID Field | Primary Purpose |
|-------|----------|-----------------|
| Clients | Client Name | Client management |
| Websites | URL | Test targets |
| Test Configurations | Config Name | Test settings |
| Test Runs | Run ID | Execution history |
| Test Results | Result ID | Individual test outcomes |
| Performance Metrics | Metric ID | Lighthouse data |
| Load Test Results | Load Test ID | k6 data |
| Pixel Audit Results | Audit ID | Tracking verification |
| Failures | Failure ID | Issues tracking |
| Test Cases | Test Case ID | LLM-generated tests |

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Webhook not triggering | Airtable automation disabled | Enable automation in Airtable |
| Tests timeout | Server overloaded | Increase timeout, reduce parallelism |
| Screenshots missing | MinIO connection failed | Check MinIO credentials |
| Pixel not detected | Script loaded async | Increase wait time in test |
| Load test fails | Target rate limiting | Reduce VUs or add delays |

### Debug Commands

```bash
# Check Docker services
docker-compose ps
docker-compose logs test-api

# Test API manually
curl -X POST http://localhost:3001/api/test/smoke \
  -H "Content-Type: application/json" \
  -d '{"target_url":"https://variablelib.com","browser":"chromium"}'

# Run Playwright manually
cd playwright && npx playwright test --project=chromium-desktop-1920

# Run k6 manually
docker run -v ./k6:/scripts grafana/k6 run /scripts/load-test.js
```

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Smoke test completion | < 3 minutes |
| Full suite completion | < 10 minutes |
| Performance test completion | < 2 minutes |
| Load test completion | < 3 minutes |
| Pixel audit completion | < 1 minute |
| False positive rate | < 5% |
| System uptime | > 99% |
| Report generation | < 30 seconds |

---

## Next Steps After MVP

1. **Add Visual Regression** - BackstopJS integration
2. **Add Accessibility Testing** - Pa11y integration
3. **Add API Testing** - Postman/Newman integration
4. **Add Security Scanning** - OWASP ZAP integration
5. **Build Custom Dashboard** - React/Next.js UI
6. **Add Multi-tenant Support** - For multiple clients
7. **Add Scheduled Monitoring** - 24/7 uptime checks
8. **Add AI-powered Analysis** - Failure root cause analysis

---

*Document Version: 1.0*  
*Created: December 2024*  
*Author: Claude Code Assistant for Wassim/PixelCraftedMedia*