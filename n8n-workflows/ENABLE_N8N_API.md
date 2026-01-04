# Enable n8n API Access

## Generate API Key

1. **Login to n8n**: http://38.97.60.181:5680
   - Username: `wassim`
   - Password: `5ty6%TY^5ty6`

2. **Go to Settings**:
   - Click your profile picture (top right)
   - Select **Settings**

3. **API Access**:
   - Go to **API** section
   - Click **Create API Key**
   - Name it: `Testing Agent Automation`
   - Copy the generated key (you'll only see it once!)

4. **Save the API Key**:
   ```
   Save it somewhere secure - you'll need it for programmatic access
   ```

## Use API to Import Workflows

Once you have the API key:

```bash
# Set your API key
N8N_API_KEY="your-generated-api-key-here"

# Create Smoke Test Workflow
curl -X POST "http://38.97.60.181:5680/api/v1/workflows" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d @"/Users/mqxerrormac16/Documents/QA  - Smart System/n8n-workflows/01-smoke-test-workflow.json"

# Create Performance Test Workflow
curl -X POST "http://38.97.60.181:5680/api/v1/workflows" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d @"/Users/mqxerrormac16/Documents/QA  - Smart System/n8n-workflows/02-performance-test-workflow.json"

# Create Full Suite Workflow
curl -X POST "http://38.97.60.181:5680/api/v1/workflows" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d @"/Users/mqxerrormac16/Documents/QA  - Smart System/n8n-workflows/03-full-suite-workflow.json"

# Create Scheduled Tests Workflow
curl -X POST "http://38.97.60.181:5680/api/v1/workflows" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d @"/Users/mqxerrormac16/Documents/QA  - Smart System/n8n-workflows/04-scheduled-tests-workflow.json"
```

## Activate Workflows via API

```bash
# Get all workflows
curl -X GET "http://38.97.60.181:5680/api/v1/workflows" \
  -H "X-N8N-API-KEY: $N8N_API_KEY"

# Activate a workflow (replace WORKFLOW_ID)
curl -X PATCH "http://38.97.60.181:5680/api/v1/workflows/WORKFLOW_ID" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"active": true}'
```

## n8n API Reference

- **Base URL**: `http://38.97.60.181:5680/api/v1`
- **Authentication**: `X-N8N-API-KEY` header
- **Documentation**: http://38.97.60.181:5680/api-docs (if enabled)

### Common Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/workflows` | GET | List all workflows |
| `/workflows` | POST | Create new workflow |
| `/workflows/:id` | GET | Get workflow details |
| `/workflows/:id` | PATCH | Update workflow |
| `/workflows/:id` | DELETE | Delete workflow |
| `/workflows/:id/activate` | POST | Activate workflow |
| `/executions` | GET | List executions |
| `/credentials` | GET | List credentials |

## Troubleshooting

### Error: API Key Required
Make sure you're sending the `X-N8N-API-KEY` header with every request.

### Error: Unauthorized
Your API key might be incorrect or expired. Generate a new one.

### Error: Workflow Already Exists
Check existing workflows first with GET /workflows before creating.
