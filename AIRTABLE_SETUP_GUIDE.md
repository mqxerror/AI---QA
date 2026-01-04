# Airtable Setup Guide - AI Testing Agent

## Option 1: Automated Setup (Recommended)

### Prerequisites
- Airtable Personal Access Token with `schema.bases:write` scope
- Base ID (we'll create this first)

### Steps

1. **Create a new Airtable base**
   - Go to https://airtable.com/create
   - Name it: "AI Testing Agent"
   - Copy the Base ID from the URL (starts with `app`)

2. **Run the automated setup script**
   ```bash
   cd "/Users/mqxerrormac16/Documents/QA  - Smart System"
   node scripts/setup-airtable.js
   ```

3. **Enter your credentials when prompted:**
   - Airtable Personal Access Token
   - Base ID

The script will create all 10 tables with fields, views, and automations.

---

## Option 2: Manual Setup

If you prefer to set up manually, follow these steps:

### Step 1: Create Base
1. Go to https://airtable.com/create
2. Create new base: "AI Testing Agent"

### Step 2: Create Tables

Use the JSON schema in `airtable-schema.json` as reference for:
- Table names
- Field names and types
- Field options

### Tables to Create:
1. ✅ Clients (6 fields)
2. ✅ Websites (17 fields including 3 buttons)
3. ✅ Test Configurations (8 fields)
4. ✅ Test Runs (15 fields)
5. ✅ Test Results (14 fields)
6. ✅ Performance Metrics (18 fields)
7. ✅ Load Test Results (18 fields)
8. ✅ Pixel Audit Results (13 fields)
9. ✅ Failures (13 fields)
10. ✅ Test Cases (16 fields)

### Step 3: Create Views

#### Websites Table Views:
- **All Active**: Filter `Status = Active`, Sort `Last Test Run DESC`
- **Needs Testing**: Filter `Last Test Run < 7 days ago`, Sort `Created ASC`
- **Failed Last Run**: Filter `Last Result = Fail`, Sort `Last Test Run DESC`
- **By Client**: Group by `Client`, Sort `Name ASC`

#### Test Runs Table Views:
- **Recent Runs**: Filter `Last 30 days`, Sort `Started At DESC`
- **Failed Runs**: Filter `Status = Fail`, Sort `Started At DESC`
- **Running Now**: Filter `Status = Running`, Sort `Started At DESC`
- **By Website**: Group by `Website`, Sort `Started At DESC`

#### Failures Table Views:
- **Open Issues**: Filter `Resolution Status = Open`, Sort `Priority ASC`
- **Critical**: Filter `Priority = Critical`, Sort `Created DESC`
- **By Website**: Group by `Website`, Sort `Created DESC`
- **Resolved**: Filter `Resolution Status = Resolved`, Sort `Resolved At DESC`

### Step 4: Configure Button Fields

After n8n webhooks are created, update these button URLs in Websites table:

1. **Run Smoke Test** button:
   ```
   https://automator.pixelcraftedmedia.com/webhook/testing-agent/run?type=smoke&website_id={RECORD_ID()}
   ```

2. **Run Full Suite** button:
   ```
   https://automator.pixelcraftedmedia.com/webhook/testing-agent/run?type=full_suite&website_id={RECORD_ID()}
   ```

3. **Generate Tests** button:
   ```
   https://automator.pixelcraftedmedia.com/webhook/testing-agent/generate-tests?website_id={RECORD_ID()}
   ```

### Step 5: Create Automations

#### Automation 1: Daily Scheduled Tests
- **Trigger**: Daily at 6:00 AM
- **Find Records**: `Websites` where `Test Frequency = Daily` AND `Status = Active`
- **For Each**: Send webhook to n8n
- **Webhook URL**: `https://automator.pixelcraftedmedia.com/webhook/testing-agent/run`
- **Body**:
  ```json
  {
    "action": "run_test",
    "test_type": "smoke",
    "website_id": "{Record ID}",
    "url": "{URL}",
    "triggered_by": "schedule_daily"
  }
  ```

#### Automation 2: Weekly Scheduled Tests
- **Trigger**: Weekly on Sunday at 2:00 AM
- **Find Records**: `Websites` where `Test Frequency = Weekly` AND `Status = Active`
- **For Each**: Send webhook to n8n
- **Body**:
  ```json
  {
    "action": "run_test",
    "test_type": "full_suite",
    "website_id": "{Record ID}",
    "url": "{URL}",
    "triggered_by": "schedule_weekly"
  }
  ```

#### Automation 3: Failure Notification
- **Trigger**: When record created in `Failures`
- **Condition**: `Priority = Critical` OR `Priority = High`
- **Action**: Send webhook to n8n
- **Webhook URL**: `https://automator.pixelcraftedmedia.com/webhook/testing-agent/notify-failure`
- **Body**:
  ```json
  {
    "action": "notify_failure",
    "failure_id": "{Record ID}",
    "website_name": "{Website.Name}",
    "priority": "{Priority}",
    "summary": "{Summary}"
  }
  ```

---

## After Setup

1. Get your Airtable Base ID and Personal Access Token
2. Add them to the environment configuration:
   - n8n credentials: `Settings > Credentials > Airtable`
   - Test API server: `.env` file

3. Test the connection:
   ```bash
   curl "https://api.airtable.com/v0/YOUR_BASE_ID/Clients" \
     -H "Authorization: Bearer YOUR_PAT"
   ```

---

## Quick Reference

### Airtable API Endpoints

```bash
# Base URL
BASE_URL="https://api.airtable.com/v0/YOUR_BASE_ID"

# List records
GET ${BASE_URL}/Websites

# Create record
POST ${BASE_URL}/Test%20Runs
Content-Type: application/json
{
  "fields": {
    "Website": ["recXXXXX"],
    "Test Type": "Smoke",
    "Status": "Running"
  }
}

# Update record
PATCH ${BASE_URL}/Test%20Runs/recXXXXX
{
  "fields": {
    "Status": "Pass",
    "Completed At": "2025-12-27T12:00:00.000Z"
  }
}
```

### Table IDs (After Creation)

Update these in your n8n workflows:
- Clients: `tblXXXXXX`
- Websites: `tblXXXXXX`
- Test Runs: `tblXXXXXX`
- Test Results: `tblXXXXXX`
- etc.

---

## Next Steps

After Airtable is set up:
1. ✅ Deploy Test API to Mercan server
2. ✅ Create n8n workflows
3. ✅ Test the complete flow
4. ✅ Add your first website (VariableLib.com)
