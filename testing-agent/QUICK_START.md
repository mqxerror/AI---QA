# AI Website Testing Agent - Quick Start Guide

## 🚀 Deploy in 3 Steps

### Step 1: Deploy to Mercan Server (5 minutes)

```bash
# From your local machine
cd "/Users/mqxerrormac16/Documents/QA  - Smart System/testing-agent"

# Run automated deployment
./deploy.sh

# Or manual:
ssh -p 2222 root@38.97.60.181
mkdir -p /opt/testing-agent
# Upload files, then:
cd /opt/testing-agent
cp .env.example .env
docker-compose up -d
```

**Verify:**
```bash
curl http://38.97.60.181:3001/api/health
# Should return: {"status":"healthy",...}
```

---

### Step 2: Set Up Airtable (10 minutes)

1. **Create Base:**
   - Go to https://airtable.com/create
   - Name: "AI Testing Agent"

2. **Create 10 Tables:**
   - Use `airtable-schema.json` as reference
   - Or follow `AIRTABLE_SETUP_GUIDE.md`

3. **Add First Website:**
   - Go to "Websites" table
   - Add URL: https://variablelib.com
   - Name: VariableLib Main
   - Test Frequency: Daily
   - Browsers: Chrome, Safari
   - Status: Active

---

### Step 3: Configure n8n (10 minutes)

1. **Go to n8n:**
   - URL: https://automator.pixelcraftedmedia.com

2. **Create Workflow: "Testing Agent - Main Orchestrator"**

3. **Add Webhook Node:**
   - Path: `testing-agent/run`
   - Method: POST

4. **Add HTTP Request Node:**
   - URL: `http://38.97.60.181:3001/api/test/smoke`
   - Method: POST
   - Body:
   ```json
   {
     "target_url": "{{$json.url}}",
     "browser": "chromium",
     "viewport": {"width": 1920, "height": 1080}
   }
   ```

5. **Activate Workflow**

6. **Test It:**
   ```bash
   curl -X POST https://automator.pixelcraftedmedia.com/webhook/testing-agent/run \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://variablelib.com",
       "test_type": "smoke"
     }'
   ```

---

## ✅ You're Done!

Now you can:
- ✅ Click "Run Smoke Test" button in Airtable
- ✅ View results in "Test Runs" table
- ✅ See screenshots in MinIO: http://38.97.60.181:9001
- ✅ Schedule automated daily tests

---

## 📚 Full Documentation

| Guide | Purpose |
|-------|---------|
| `PROJECT_SUMMARY.md` | **Start here - complete overview** |
| `DEPLOYMENT_GUIDE.md` | **Detailed step-by-step deployment** |
| `README.md` | API documentation |
| `AIRTABLE_SETUP_GUIDE.md` | Airtable configuration |

---

## 🆘 Quick Troubleshooting

**API not responding:**
```bash
ssh -p 2222 root@38.97.60.181
cd /opt/testing-agent
docker-compose logs test-api
docker-compose restart test-api
```

**Check all services:**
```bash
docker-compose ps
```

**Test API directly:**
```bash
curl -X POST http://38.97.60.181:3001/api/test/smoke \
  -H "Content-Type: application/json" \
  -d '{"target_url": "https://variablelib.com", "browser": "chromium"}'
```

---

## 🎯 Next Steps

1. Add more websites to test
2. Create scheduled automations in Airtable
3. Set up Slack notifications
4. Generate AI test cases
5. Build custom reports

---

**Need help?** Read `DEPLOYMENT_GUIDE.md` for detailed instructions.

**Ready to deploy?** Run `./deploy.sh`
