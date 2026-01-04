# Airtable Quick Setup Guide

## Create Base
1. Go to https://airtable.com
2. Click "Add a base" > "Start from scratch"
3. Name: **AI Testing Agent**

## Table 1: Clients
**Fields:**
- Client Name (Single line text) - Primary
- Contact Email (Email)
- Slack Webhook (URL)
- Asana Project ID (Single line text)
- Status (Single select): Active (green), Paused (yellow), Archived (gray)
- Created (Created time)

## Table 2: Websites
**Fields:**
- URL (URL) - Primary
- Client (Link to Clients)
- Name (Single line text)
- Login Required (Checkbox)
- Login URL (URL)
- Login Username (Single line text)
- Login Password (Single line text)
- Test Frequency (Single select): Daily (blue), Weekly (green), On-demand (gray)
- Browsers (Multiple select): Chrome, Safari, Firefox
- Viewports (Multiple select): Mobile-360, Mobile-390, Tablet-768, Desktop-1366, Desktop-1920
- Last Test Run (Date - ISO format)
- Last Result (Single select): Pass (green), Fail (red), Partial (yellow), Error (orange)
- Last Report URL (URL)
- Status (Single select): Active (green), Paused (gray)
- Run Smoke Test (Button) - Label: "▶️ Run Smoke Test"
- Run Full Suite (Button) - Label: "🚀 Run Full Suite"
- Generate Tests (Button) - Label: "🤖 Generate Test Cases"

## Table 3: Test Configurations
**Fields:**
- Config Name (Single line text) - Primary
- Website (Link to Websites)
- Test Types (Multiple select): Smoke, Regression, Performance, Load, Pixel Audit, Accessibility
- Performance Thresholds (Long text) - JSON format
- Load Test Config (Long text) - JSON format
- Pixel Vendors (Multiple select): GA4, Meta Pixel, GTM, Google Ads, TikTok, LinkedIn, Pinterest, Hotjar, Clarity
- Custom Test Steps (Long text)
- Enabled (Checkbox)

## Table 4: Test Runs
**Fields:**
- Run ID (Autonumber) - Primary
- Website (Link to Websites)
- Test Type (Single select): Smoke, Regression, Performance, Load, Pixel Audit, Full Suite
- Triggered By (Single select): Manual, Schedule, Webhook
- Started At (Date - include time)
- Completed At (Date - include time)
- Duration Seconds (Number - integer)
- Status (Single select): Queued (gray), Running (yellow), Pass (green), Fail (red), Error (orange)
- Total Tests (Number - integer)
- Passed (Number - integer)
- Failed (Number - integer)
- Skipped (Number - integer)
- Report URL (URL)
- Summary (Long text)
- Error Log (Long text)

## Table 5: Test Results
**Fields:**
- Result ID (Autonumber) - Primary
- Test Run (Link to Test Runs)
- Test Name (Single line text)
- Category (Single select): UI, UX, Performance, Load, Pixel, Accessibility
- Browser (Single select): Chrome, Safari, Firefox
- Viewport (Single select): 360x800, 390x844, 768x1024, 1366x768, 1920x1080
- Status (Single select): Pass (green), Fail (red), Skip (gray)
- Duration MS (Number - integer)
- Error Message (Long text)
- Screenshot (Attachment)
- Video (Attachment)
- Selector (Single line text)
- Expected (Long text)
- Actual (Long text)

## Table 6: Performance Metrics
**Fields:**
- Metric ID (Autonumber) - Primary
- Test Run (Link to Test Runs)
- Page URL (URL)
- Browser (Single select): Chrome, Safari, Firefox
- Viewport (Single line text)
- LCP (Number - decimal)
- CLS (Number - 3 decimals)
- INP (Number - decimal)
- FCP (Number - decimal)
- TTFB (Number - decimal)
- Total Requests (Number - integer)
- Page Size KB (Number - decimal)
- Performance Score (Number - integer)
- Accessibility Score (Number - integer)
- SEO Score (Number - integer)
- Best Practices Score (Number - integer)
- Status (Single select): Good (green), Needs Work (yellow), Poor (red)
- Full Report JSON (Long text)

## Table 7: Load Test Results
**Fields:**
- Load Test ID (Autonumber) - Primary
- Test Run (Link to Test Runs)
- Endpoint (URL)
- HTTP Method (Single select): GET, POST, PUT, DELETE
- Virtual Users (Number - integer)
- Duration Seconds (Number - integer)
- Total Requests (Number - integer)
- Requests Per Second (Number - 2 decimals)
- P50 MS (Number - decimal)
- P90 MS (Number - decimal)
- P95 MS (Number - decimal)
- P99 MS (Number - decimal)
- Error Rate Percent (Number - 2 decimals)
- Data Received KB (Number - decimal)
- Data Sent KB (Number - decimal)
- Status (Single select): Pass (green), Fail (red)
- Threshold Breaches (Long text)
- Full Report JSON (Long text)

## Table 8: Pixel Audit Results
**Fields:**
- Audit ID (Autonumber) - Primary
- Test Run (Link to Test Runs)
- Page URL (URL)
- Pixel Name (Single select): GA4, Meta Pixel, GTM, Google Ads, TikTok, LinkedIn, Pinterest, Hotjar, Clarity
- Expected (Checkbox)
- Detected (Checkbox)
- Status (Single select): Found (green), Missing (red), Unexpected (yellow), Error (orange)
- Script URL (URL)
- Container ID (Single line text)
- Events Detected (Long text)
- Network Calls (Long text)
- Evidence Screenshot (Attachment)
- HAR File (Attachment)

## Table 9: Failures
**Fields:**
- Failure ID (Autonumber) - Primary
- Test Result (Link to Test Results)
- Website (Link to Websites)
- Priority (Single select): Critical (red), High (orange), Medium (yellow), Low (gray)
- Failure Type (Single select): UI Bug, Performance, Broken Link, Missing Pixel, Load Error, Accessibility
- Summary (Single line text)
- Reproduction Steps (Long text)
- Asana Task URL (URL)
- Asana Task ID (Single line text)
- Resolution Status (Single select): Open (red), In Progress (yellow), Resolved (green), Won't Fix (gray)
- Assigned To (Single line text)
- Notes (Long text)
- Resolved At (Date - include time)

## Table 10: Test Cases
**Fields:**
- Test Case ID (Autonumber) - Primary
- Website (Link to Websites)
- Page URL (URL)
- Test Name (Single line text)
- Test Type (Single select): Smoke, Regression, E2E
- Category (Single select): Navigation, Form, Content, Interaction, Visual
- Priority (Single select): Critical, High, Medium, Low
- Preconditions (Long text)
- Test Steps (Long text) - JSON array
- Expected Result (Long text)
- Selector (Single line text)
- Generated By (Single select): LLM, Manual
- Approved (Checkbox)
- Enabled (Checkbox)
- Last Run Status (Single select): Not Run (gray), Pass (green), Fail (red)
- Created At (Created time)

## After Creating All Tables

### Update Button URLs in Websites Table
Once you have n8n webhooks set up, update the button field URLs:
1. Go to Websites table
2. Click on "Run Smoke Test" field settings
3. Update URL to: `https://automator.pixelcraftedmedia.com/webhook/smoke-test`
4. Repeat for "Run Full Suite" and "Generate Tests"

### Add Sample Data
1. **Clients table**: Add a test client
2. **Websites table**: Add https://google.com as a test website
3. Link the website to the client

## API Integration
Once set up, get your Airtable Personal Access Token:
1. Go to https://airtable.com/create/tokens
2. Create a new token with scopes: `data.records:read`, `data.records:write`
3. Add the base to the token
4. Copy the token for n8n integration

## Next: n8n Workflows
After Airtable setup is complete, we'll create the n8n workflows to orchestrate tests.
