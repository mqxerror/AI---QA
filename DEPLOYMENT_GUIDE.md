# AI Website Testing Agent - Complete Deployment Guide

## System Overview

This system provides automated website testing with:
- **Smoke Tests** (Playwright)
- **Performance Tests** (Lighthouse)
- **Load Tests** (k6)
- **Pixel Audits** (Marketing pixel detection)
- **AI Test Generation** (DeepSeek LLM)

## Infrastructure

| Component | Location | Purpose |
|-----------|----------|---------|
| **Airtable** | Cloud | UI, database, triggers |
| **n8n** | 23.94.185.25 (automator.pixelcraftedmedia.com) | Workflow orchestration |
| **Mercan Server** | 38.97.60.181 | Test execution (Playwright, k6, Lighthouse) |

## Deployment Steps

### Phase 1: Mercan Server Setup (Test Execution)

#### 1.1 Deploy Docker Stack

```bash
# On your local machine, navigate to the project
cd "/Users/mqxerrormac16/Documents/QA  - Smart System/testing-agent"

# Make deploy script executable
chmod +x deploy.sh

# Run deployment script (will prompt for confirmation)
./deploy.sh

# Or manual deployment:
ssh -p 2222 root@38.97.60.181
mkdir -p /opt/testing-agent
cd /opt/testing-agent

# Upload files via rsync or scp
rsync -avz -e "ssh -p 2222" ./ root@38.97.60.181:/opt/testing-agent/
```

#### 1.2 Configure Environment

```bash
# SSH into Mercan
ssh -p 2222 root@38.97.60.181
cd /opt/testing-agent

# Create .env file
cp .env.example .env
nano .env
```

Set these values in `.env`:
```bash
NODE_ENV=production
PORT=3001
MINIO_ACCESS_KEY=testing_agent_minio
MINIO_SECRET_KEY=$(openssl rand -base64 32)
MINIO_PUBLIC_URL=http://38.97.60.181:9000
```

#### 1.3 Start Services

```bash
cd /opt/testing-agent

# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps

# Check logs
docker-compose logs -f test-api

# Test API
curl http://localhost:3001/api/health
```

#### 1.4 Verify External Access

```bash
# From your local machine
curl http://38.97.60.181:3001/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","uptime":...}
```

### Phase 2: Airtable Setup

#### 2.1 Create Airtable Base

1. Go to https://airtable.com/create
2. Create new base: **"AI Testing Agent"**
3. Copy the Base ID from URL (starts with `app`)

#### 2.2 Create Tables

Use the schema in `airtable-schema.json` to create 10 tables:

**Priority Order:**
1. ✅ **Clients** (6 fields)
2. ✅ **Websites** (17 fields)
3. ✅ **Test Configurations** (8 fields)
4. ✅ **Test Runs** (15 fields)
5. ✅ **Test Results** (14 fields)
6. ✅ **Performance Metrics** (18 fields)
7. ✅ **Load Test Results** (18 fields)
8. ✅ **Pixel Audit Results** (13 fields)
9. ✅ **Failures** (13 fields)
10. ✅ **Test Cases** (16 fields)

**Quick Setup Option:**
- Use the automated script:
  ```bash
  cd "/Users/mqxerrormac16/Documents/QA  - Smart System"
  # Get your Airtable Personal Access Token
  # Run: node scripts/setup-airtable.js
  ```

#### 2.3 Create Views

For each table, create the views specified in `AIRTABLE_SETUP_GUIDE.md`

**Websites table** - Key views:
- All Active
- Needs Testing
- Failed Last Run
- By Client

**Test Runs table** - Key views:
- Recent Runs
- Failed Runs
- Running Now

#### 2.4 Add Test Data

Add your first client and website:

**Clients table:**
- Client Name: PixelCraftedMedia
- Contact Email: wassim@pixelcraftedmedia.com
- Status: Active

**Websites table:**
- URL: https://variablelib.com
- Client: (link to PixelCraftedMedia)
- Name: VariableLib Main
- Test Frequency: Daily
- Browsers: Chrome, Safari
- Viewports: Desktop-1920, Mobile-390
- Status: Active

### Phase 3: n8n Configuration

#### 3.1 Access n8n

```bash
# n8n is already running on your server
URL: https://automator.pixelcraftedmedia.com
```

#### 3.2 Set Up Credentials

In n8n, go to **Settings** > **Credentials**:

**1. Airtable Personal Access Token**
- Name: `Airtable - Testing Agent`
- Get token: https://airtable.com/create/tokens
- Scopes: `data.records:read`, `data.records:write`, `schema.bases:read`
- Access to: Your "AI Testing Agent" base

**2. HTTP Request - Mercan Server**
- Name: `Mercan Test API`
- Authentication: None
- Base URL: `http://38.97.60.181:3001`

**3. DeepSeek API (for test generation)**
- Name: `DeepSeek API`
- Type: Header Auth
- Name: `Authorization`
- Value: `Bearer YOUR_DEEPSEEK_API_KEY`
- Get key: https://platform.deepseek.com

#### 3.3 Create Main Orchestrator Workflow

**Method 1: Manual Creation**

1. Create new workflow: **"Testing Agent - Main Orchestrator"**

2. Add nodes in this order:

```
[Webhook] → [Set] → [Airtable: Fetch Website] → [Airtable: Create Test Run]
                                                           ↓
                                                       [Switch by Type]
                                                           ↓
                        ┌──────────────────┬──────────────┼──────────────┐
                        ↓                  ↓              ↓              ↓
                   [HTTP: Smoke]    [HTTP: Perf]   [HTTP: Load]   [HTTP: Pixel]
                        ↓                  ↓              ↓              ↓
                        └──────────────────┴──────────────┴──────────────┘
                                           ↓
                                      [Merge Results]
                                           ↓
                                    [Code: Calculate]
                                           ↓
                                [Airtable: Update Run]
```

**Node Details:**

**Webhook Node:**
- Path: `testing-agent/run`
- Method: POST
- Respond: Immediately

**HTTP Request - Smoke Test:**
- Method: POST
- URL: `http://38.97.60.181:3001/api/test/smoke`
- Body:
```json
{
  "target_url": "{{$json.url}}",
  "browser": "chromium",
  "viewport": {"width": 1920, "height": 1080}
}
```

**HTTP Request - Performance Test:**
- Method: POST
- URL: `http://38.97.60.181:3001/api/test/performance`
- Body:
```json
{
  "target_url": "{{$json.url}}",
  "device": "desktop"
}
```

**HTTP Request - Load Test:**
- Method: POST
- URL: `http://38.97.60.181:3001/api/test/load`
- Body:
```json
{
  "target_url": "{{$json.url}}",
  "virtual_users": 10,
  "duration": "30s"
}
```

**HTTP Request - Pixel Audit:**
- Method: POST
- URL: `http://38.97.60.181:3001/api/test/pixel-audit`
- Body:
```json
{
  "target_url": "{{$json.url}}",
  "expected_pixels": ["GA4", "Meta Pixel", "GTM"]
}
```

#### 3.4 Activate Workflow

1. Save the workflow
2. Toggle to **Active**
3. Copy the webhook URL (will look like: `https://automator.pixelcraftedmedia.com/webhook/testing-agent/run`)

### Phase 4: Connect Airtable to n8n

#### 4.1 Update Button Fields in Airtable

In **Websites** table, update button field URLs:

**Run Smoke Test button:**
```
https://automator.pixelcraftedmedia.com/webhook/testing-agent/run?type=smoke&website_id={RECORD_ID()}
```

Add these URL parameters to the button configuration.

#### 4.2 Create Airtable Automations

**Automation 1: Manual Smoke Test**
- Trigger: When button clicked (Run Smoke Test)
- Action: Send request to webhook
- URL: `https://automator.pixelcraftedmedia.com/webhook/testing-agent/run`
- Method: POST
- Body:
```json
{
  "action": "run_test",
  "test_type": "smoke",
  "website_id": "{Website ID}",
  "url": "{URL}",
  "triggered_by": "manual"
}
```

**Automation 2: Daily Scheduled Tests**
- Trigger: Every day at 6:00 AM
- Find records: Websites where `Test Frequency = Daily` AND `Status = Active`
- For each: Send webhook request (same as above)

### Phase 5: Test the System

#### 5.1 Test API Directly

```bash
# Smoke test
curl -X POST http://38.97.60.181:3001/api/test/smoke \
  -H "Content-Type: application/json" \
  -d '{
    "target_url": "https://variablelib.com",
    "browser": "chromium",
    "viewport": {"width": 1920, "height": 1080}
  }'

# Performance test
curl -X POST http://38.97.60.181:3001/api/test/performance \
  -H "Content-Type: application/json" \
  -d '{
    "target_url": "https://variablelib.com",
    "device": "desktop"
  }'

# Load test
curl -X POST http://38.97.60.181:3001/api/test/load \
  -H "Content-Type: application/json" \
  -d '{
    "target_url": "https://variablelib.com",
    "virtual_users": 10,
    "duration": "30s"
  }'

# Pixel audit
curl -X POST http://38.97.60.181:3001/api/test/pixel-audit \
  -H "Content-Type: application/json" \
  -d '{
    "target_url": "https://variablelib.com",
    "expected_pixels": ["GA4", "Meta Pixel", "GTM"]
  }'
```

#### 5.2 Test via n8n Workflow

```bash
curl -X POST https://automator.pixelcraftedmedia.com/webhook/testing-agent/run \
  -H "Content-Type: application/json" \
  -d '{
    "action": "run_test",
    "test_type": "smoke",
    "url": "https://variablelib.com",
    "website_id": "recXXXXXX",
    "triggered_by": "manual"
  }'
```

Check n8n executions to see the workflow run.

#### 5.3 Test via Airtable Button

1. Go to your Airtable base
2. Open Websites table
3. Click **"Run Smoke Test"** button on VariableLib record
4. Wait 30-60 seconds
5. Check Test Runs table for new record
6. Check Test Results table for individual test results

### Phase 6: Monitor & Verify

#### 6.1 Check Mercan Server

```bash
ssh -p 2222 root@38.97.60.181

# Check Docker services
cd /opt/testing-agent
docker-compose ps

# View logs
docker-compose logs -f test-api

# Check MinIO storage
ls -lah artifacts/screenshots/
ls -lah artifacts/reports/
```

#### 6.2 Check MinIO Console

1. Open: http://38.97.60.181:9001
2. Login with credentials from `.env`
3. Browse to `testing-agent` bucket
4. Verify screenshots, reports, and HAR files are uploading

#### 6.3 Check Airtable

1. Test Runs table: Should have new records
2. Test Results table: Should have individual test results
3. Performance Metrics table: Should have Lighthouse data
4. Pixel Audit Results table: Should have pixel detection data

#### 6.4 Check n8n Executions

1. Go to https://automator.pixelcraftedmedia.com
2. Click **Executions** in left sidebar
3. Find your workflow execution
4. Check each node executed successfully
5. Review any errors

## Troubleshooting

### Issue: API Returns 502/504

**Solution:**
```bash
ssh -p 2222 root@38.97.60.181
cd /opt/testing-agent
docker-compose restart test-api
docker-compose logs test-api
```

### Issue: Tests Timing Out

**Solution:**
- Increase timeout in n8n HTTP Request nodes (Settings > Timeout: 300000 ms)
- Check server resources: `htop` or `docker stats`

### Issue: Airtable Webhook Not Firing

**Solution:**
1. Check automation is enabled in Airtable
2. Check webhook URL is correct
3. Test webhook manually with curl
4. Check n8n workflow is Active

### Issue: Screenshots Not Uploading

**Solution:**
```bash
# Check MinIO is running
docker-compose ps minio

# Check MinIO logs
docker-compose logs minio

# Test MinIO connection
curl http://38.97.60.181:9000/minio/health/live
```

### Issue: Playwright Browser Crashes

**Solution:**
- Increase Docker memory limit in `docker-compose.yml`:
```yaml
services:
  test-api:
    mem_limit: 4g
    memswap_limit: 4g
```

## Maintenance

### Daily Checks
- ✅ Check disk space: `df -h`
- ✅ Check Docker services: `docker-compose ps`
- ✅ Check recent test runs in Airtable

### Weekly Checks
- ✅ Review failed tests in Airtable
- ✅ Clean up old artifacts (>30 days)
- ✅ Check n8n execution history

### Monthly Checks
- ✅ Update Docker images: `docker-compose pull && docker-compose up -d`
- ✅ Backup Airtable data
- ✅ Review and optimize workflows

## Next Steps

1. ✅ Add more websites to test
2. ✅ Create custom test configurations
3. ✅ Set up Slack notifications
4. ✅ Set up Asana integration for failures
5. ✅ Generate AI test cases with DeepSeek
6. ✅ Build custom HTML reports
7. ✅ Add visual regression testing (BackstopJS)

## Support Resources

- **Project Documentation**: `Prd Project.md`
- **Server Reference**: `SERVER_INFRASTRUCTURE_REFERENCE.md`
- **Airtable Guide**: `AIRTABLE_SETUP_GUIDE.md`
- **API Documentation**: `README.md`

## Quick Reference

**Mercan Server:**
```bash
ssh -p 2222 root@38.97.60.181
cd /opt/testing-agent
docker-compose logs -f
```

**Test API Health:**
```bash
curl http://38.97.60.181:3001/api/health
```

**n8n:**
https://automator.pixelcraftedmedia.com

**MinIO Console:**
http://38.97.60.181:9001

---

**Status**: Ready for deployment
**Last Updated**: December 2024
**Version**: 1.0.0
