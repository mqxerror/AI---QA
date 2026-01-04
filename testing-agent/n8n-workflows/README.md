# n8n Workflows for AI Testing Agent

## Workflows Overview

| Workflow | Purpose | Trigger |
|----------|---------|---------|
| 1. Main Test Orchestrator | Routes test requests and collects results | Webhook from Airtable |
| 2. Test Case Generator | Generates test cases using DeepSeek LLM | Manual button or webhook |
| 3. Failure Handler | Creates Asana tasks and sends notifications | Called by orchestrator |

## Import Instructions

### 1. Access n8n
Go to: https://automator.pixelcraftedmedia.com

### 2. Import Workflows

1. Click **Settings** (gear icon) in the left sidebar
2. Go to **Import from File**
3. Upload each JSON file:
   - `main-orchestrator.json`
   - `test-case-generator.json`
   - `failure-handler.json`

### 3. Configure Credentials

After importing, you'll need to set up credentials for:

#### Airtable
- Name: `Airtable - Testing Agent`
- Type: Personal Access Token
- Get token from: https://airtable.com/create/tokens
- Required scopes: `data.records:read`, `data.records:write`
- Required base: Your "AI Testing Agent" base

#### HTTP Request (for Mercan Server)
- Base URL: `http://38.97.60.181:3001`
- No authentication required (internal server)

#### Slack (Optional)
- Type: Webhook URL
- Get webhook from: https://api.slack.com/messaging/webhooks

#### Email (SMTP)
- Use your existing SMTP credentials

#### Asana (Optional)
- Type: OAuth2
- Connect your Asana account

### 4. Configure Webhooks

Each workflow has webhook nodes that need URLs:

#### Main Orchestrator Webhook Path:
```
/webhook/testing-agent/run
```
Full URL:
```
https://automator.pixelcraftedmedia.com/webhook/testing-agent/run
```

#### Test Case Generator Webhook Path:
```
/webhook/testing-agent/generate-tests
```
Full URL:
```
https://automator.pixelcraftedmedia.com/webhook/testing-agent/generate-tests
```

### 5. Update Airtable Button URLs

After activating workflows, update button fields in Airtable:

**Websites table > Run Smoke Test button:**
```
https://automator.pixelcraftedmedia.com/webhook/testing-agent/run?type=smoke&website_id={RECORD_ID()}
```

**Websites table > Run Full Suite button:**
```
https://automator.pixelcraftedmedia.com/webhook/testing-agent/run?type=full_suite&website_id={RECORD_ID()}
```

**Websites table > Generate Tests button:**
```
https://automator.pixelcraftedmedia.com/webhook/testing-agent/generate-tests?website_id={RECORD_ID()}
```

### 6. Activate Workflows

1. Open each imported workflow
2. Click the **Inactive** toggle in the top right
3. Workflow should now show **Active**

## Workflow Details

### 1. Main Test Orchestrator

**Flow:**
```
Webhook Trigger
  ↓
Parse Request (Set node)
  ↓
Fetch Website Config (Airtable)
  ↓
Create Test Run Record (Airtable)
  ↓
Switch by Test Type
  ├─ Smoke → HTTP Request to /api/test/smoke
  ├─ Performance → HTTP Request to /api/test/performance
  ├─ Load → HTTP Request to /api/test/load
  ├─ Pixel Audit → HTTP Request to /api/test/pixel-audit
  └─ Full Suite → Execute all above
  ↓
Collect Results (Merge node)
  ↓
Calculate Summary (Code node)
  ↓
Update Test Run (Airtable)
  ↓
Create Test Results (Airtable - batch)
  ↓
IF failures detected
  ↓
Call Failure Handler (Execute Workflow)
  ↓
Send Notifications (Slack + Email)
```

**Test Payload:**
```json
{
  "action": "run_test",
  "test_type": "smoke",
  "website_id": "recXXXXXX",
  "url": "https://variablelib.com",
  "triggered_by": "manual"
}
```

### 2. Test Case Generator

**Flow:**
```
Webhook Trigger
  ↓
Fetch Website Details (Airtable)
  ↓
Crawl Website (HTTP Request or Crawl4AI)
  ↓
Extract Page Content (Code node)
  ↓
Generate Test Cases (DeepSeek API)
  ↓
Parse JSON Response (Code node)
  ↓
Create Test Case Records (Airtable - loop)
  ↓
Return Summary
```

**DeepSeek Prompt:**
```
You are a QA engineer. Generate test cases for website testing.

URL: {url}
Page Content: {page_content}

Output JSON array:
[
  {
    "name": "Test name",
    "type": "smoke",
    "category": "Navigation",
    "priority": "High",
    "steps": ["Step 1", "Step 2"],
    "expected": "Expected result",
    "selector": "CSS selector"
  }
]

Generate 5-10 realistic test cases focusing on:
- Navigation
- Form interactions
- Content validation
- Responsive behavior
```

### 3. Failure Handler

**Flow:**
```
Workflow Trigger (from orchestrator)
  ↓
Create Failure Record (Airtable)
  ↓
IF Priority = Critical or High
  ↓
Create Asana Task (with screenshot)
  ↓
Update Failure with Asana URL
  ↓
Send Slack Alert
  ↓
Send Email Notification
```

## Testing Workflows

### Test Main Orchestrator

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

### Test Case Generator

```bash
curl -X POST https://automator.pixelcraftedmedia.com/webhook/testing-agent/generate-tests \
  -H "Content-Type: application/json" \
  -d '{
    "website_id": "recXXXXXX",
    "url": "https://variablelib.com",
    "name": "VariableLib Main"
  }'
```

## Troubleshooting

### Workflow not executing
1. Check if workflow is **Active**
2. Check execution logs in n8n
3. Verify webhook URL is correct
4. Check Airtable credentials

### Mercan Server not responding
```bash
# Test API directly
curl http://38.97.60.181:3001/api/health

# Check Docker logs
ssh -p 2222 root@38.97.60.181
cd /opt/testing-agent
docker-compose logs test-api
```

### Airtable errors
1. Verify Personal Access Token is valid
2. Check token has correct scopes
3. Verify base ID is correct
4. Check table names match exactly

## Workflow Maintenance

### Update Mercan Server URL
If server IP changes, update HTTP Request nodes:
1. Open workflow
2. Find HTTP Request nodes
3. Update base URL from `http://38.97.60.181:3001` to new URL

### Add New Test Types
1. Open Main Orchestrator workflow
2. Add new case to Switch node
3. Add HTTP Request node for new test type
4. Update Merge node connections

## Best Practices

1. **Test in Staging First**: Import to a test n8n instance if possible
2. **Monitor Executions**: Check n8n execution logs regularly
3. **Set Timeouts**: Configure appropriate timeouts for long-running tests
4. **Error Handling**: Workflows include IF nodes to handle errors gracefully
5. **Logging**: Use Set/Code nodes to log important data points

## Support

If you encounter issues:
1. Check n8n execution logs
2. Verify all credentials are configured
3. Test API endpoints manually with curl
4. Check Docker logs on Mercan server
5. Review Airtable automation logs

---

**Last Updated**: December 2024
**n8n Version**: Compatible with n8n 1.0+
**Server**: automator.pixelcraftedmedia.com
