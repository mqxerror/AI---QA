# AI Website Testing Agent - Project Summary

## 🎯 What We Built

A complete automated website testing system that runs smoke tests, performance audits, load tests, and pixel tracking verification on client websites. The system uses Airtable as the interface, n8n for orchestration, and a custom-built test execution API running on your Mercan server.

---

## 📋 Project Status

### ✅ Completed Components

| Component | Status | Location |
|-----------|--------|----------|
| **Test API Server** | ✅ Complete | `testing-agent/test-api/` |
| **Docker Infrastructure** | ✅ Complete | `testing-agent/docker-compose.yml` |
| **Playwright Tests** | ✅ Complete | `testing-agent/playwright/` |
| **k6 Load Tests** | ✅ Complete | `testing-agent/k6/` |
| **Airtable Schema** | ✅ Complete | `airtable-schema.json` |
| **n8n Workflow Templates** | ✅ Complete | `testing-agent/n8n-workflows/` |
| **Deployment Scripts** | ✅ Complete | `testing-agent/deploy.sh` |
| **Documentation** | ✅ Complete | All guides written |

### 🔄 Pending Deployment Tasks

| Task | Est. Time | Priority |
|------|-----------|----------|
| Deploy Docker stack to Mercan server | 15 min | High |
| Create Airtable base and tables | 30 min | High |
| Configure n8n workflows | 20 min | High |
| Test end-to-end flow | 15 min | High |
| Add first test website (VariableLib) | 5 min | Medium |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌──────────────┐         ┌────────────────────┐       ┌─────────────┐ │
│  │   AIRTABLE   │ Webhook │        n8n         │  HTTP │   MERCAN    │ │
│  │              │────────►│  automator.pixel   │──────►│   SERVER    │ │
│  │  - Clients   │         │                    │       │             │ │
│  │  - Websites  │◄────────│  - Orchestration   │◄──────│ - Playwright│ │
│  │  - Test Runs │ Results │  - Routing         │       │ - Lighthouse│ │
│  │  - Results   │         │  - Airtable sync   │       │ - k6        │ │
│  │              │         │                    │       │ - MinIO     │ │
│  └──────────────┘         └────────────────────┘       └─────────────┘ │
│                                                                          │
│  User clicks button → Airtable webhook → n8n workflow → Test API        │
│  Test API runs tests → Uploads to MinIO → Returns results → n8n → Airtable│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Details

**Airtable** (Cloud)
- 10 tables for data management
- Button-triggered tests
- Scheduled automations (daily/weekly)
- Results visualization

**n8n** (23.94.185.25 - automator.pixelcraftedmedia.com)
- Workflow orchestration
- Webhook endpoint
- Airtable integration
- Test routing logic

**Mercan Server** (38.97.60.181)
- Test execution (Playwright, k6, Lighthouse)
- MinIO artifact storage
- Redis queue
- Docker containerized

---

## 📦 What's in the Package

### 1. Test API Server (`testing-agent/test-api/`)

**Features:**
- RESTful API with 4 test endpoints
- Playwright integration for smoke tests
- Lighthouse integration for performance audits
- k6 integration for load testing
- MinIO client for artifact storage
- Comprehensive logging

**Files:**
```
test-api/
├── Dockerfile                    # Multi-stage Docker build
├── package.json                  # Dependencies
├── src/
│   ├── index.js                  # Express server
│   ├── routes/
│   │   ├── smoke.js              # POST /api/test/smoke
│   │   ├── performance.js        # POST /api/test/performance
│   │   ├── load.js               # POST /api/test/load
│   │   └── pixel-audit.js        # POST /api/test/pixel-audit
│   ├── services/
│   │   ├── playwright.js         # Playwright test runner
│   │   ├── lighthouse.js         # Lighthouse runner
│   │   └── k6.js                 # k6 load test runner
│   └── utils/
│       ├── logger.js             # Winston logger
│       └── storage.js            # MinIO client
```

### 2. Playwright Tests (`testing-agent/playwright/`)

**Test Suites:**
- ✅ Homepage smoke tests (7 tests)
- ✅ Navigation tests (3 tests)
- ✅ Pixel audit tests (6 tests)

**Features:**
- Multi-browser support (Chromium, Firefox, WebKit)
- Multi-device/viewport testing
- Screenshot capture
- Video recording on failure
- Console error detection
- Broken link detection
- Marketing pixel detection

### 3. k6 Load Tests (`testing-agent/k6/`)

**Features:**
- Configurable virtual users (VUs)
- Ramp-up/ramp-down stages
- Custom metrics (error rate, response time)
- Threshold validation
- JSON result export

### 4. Docker Infrastructure

**Services:**
- `test-api`: Node.js test execution server (port 3001)
- `minio`: Object storage for artifacts (ports 9000, 9001)
- `redis`: Queue and caching (port 6379)
- `playwright`: Standalone Playwright container
- `k6`: Standalone k6 container

### 5. Airtable Schema

**10 Tables:**
1. **Clients** - Client management
2. **Websites** - Test targets
3. **Test Configurations** - Test settings
4. **Test Runs** - Execution history
5. **Test Results** - Individual test outcomes
6. **Performance Metrics** - Lighthouse data
7. **Load Test Results** - k6 data
8. **Pixel Audit Results** - Pixel detection
9. **Failures** - Issue tracking
10. **Test Cases** - LLM-generated tests

### 6. Documentation

| Document | Purpose |
|----------|---------|
| `README.md` | API documentation and quick start |
| `DEPLOYMENT_GUIDE.md` | **Complete step-by-step deployment** |
| `AIRTABLE_SETUP_GUIDE.md` | Airtable configuration |
| `SERVER_INFRASTRUCTURE_REFERENCE.md` | Server credentials and access |
| `Prd Project.md` | Original project requirements |
| `PROJECT_SUMMARY.md` | This document |

---

## 🚀 Quick Deployment

### Option 1: Automated (Recommended)

```bash
cd "/Users/mqxerrormac16/Documents/QA  - Smart System/testing-agent"
./deploy.sh
```

This will:
1. Connect to Mercan server
2. Upload all files
3. Configure environment
4. Start Docker services
5. Verify deployment

### Option 2: Manual

```bash
# 1. SSH to Mercan
ssh -p 2222 root@38.97.60.181

# 2. Create directory
mkdir -p /opt/testing-agent
cd /opt/testing-agent

# 3. Upload files (from local machine)
rsync -avz -e "ssh -p 2222" \
  "/Users/mqxerrormac16/Documents/QA  - Smart System/testing-agent/" \
  root@38.97.60.181:/opt/testing-agent/

# 4. Configure and start (back on Mercan)
cp .env.example .env
nano .env  # Edit configuration
docker-compose up -d

# 5. Verify
curl http://localhost:3001/api/health
```

---

## 🔑 Key Endpoints

### Test API Endpoints (Mercan Server)

```bash
# Health check
GET http://38.97.60.181:3001/api/health

# Smoke test
POST http://38.97.60.181:3001/api/test/smoke
Body: {
  "target_url": "https://variablelib.com",
  "browser": "chromium",
  "viewport": {"width": 1920, "height": 1080}
}

# Performance test
POST http://38.97.60.181:3001/api/test/performance
Body: {
  "target_url": "https://variablelib.com",
  "device": "desktop"
}

# Load test
POST http://38.97.60.181:3001/api/test/load
Body: {
  "target_url": "https://variablelib.com",
  "virtual_users": 10,
  "duration": "30s"
}

# Pixel audit
POST http://38.97.60.181:3001/api/test/pixel-audit
Body: {
  "target_url": "https://variablelib.com",
  "expected_pixels": ["GA4", "Meta Pixel", "GTM"]
}
```

### n8n Webhook Endpoints

```bash
# Main orchestrator
POST https://automator.pixelcraftedmedia.com/webhook/testing-agent/run

# Test case generator
POST https://automator.pixelcraftedmedia.com/webhook/testing-agent/generate-tests
```

---

## 🎨 Features Implemented

### ✅ Core Testing
- [x] Smoke tests (Playwright)
- [x] Performance audits (Lighthouse)
- [x] Load tests (k6)
- [x] Pixel detection (GA4, GTM, Meta, etc.)

### ✅ Infrastructure
- [x] Docker containerization
- [x] MinIO artifact storage
- [x] Redis caching/queue
- [x] Health check endpoints

### ✅ Integration
- [x] n8n workflow orchestration
- [x] Airtable database schema
- [x] Webhook triggers
- [x] Result storage

### ✅ Documentation
- [x] Complete API docs
- [x] Deployment guide
- [x] Airtable setup guide
- [x] Troubleshooting guide

### 🔄 Future Enhancements
- [ ] Asana task creation for failures
- [ ] Slack/Email notifications
- [ ] AI test case generation (DeepSeek)
- [ ] Custom HTML reports
- [ ] Visual regression testing
- [ ] Accessibility testing (Pa11y)

---

## 📊 Testing Capabilities

### Smoke Tests
- Homepage load verification
- Navigation link checking
- Console error detection
- Image load validation
- Broken link detection
- Performance timing

### Performance Tests (Lighthouse)
- **Core Web Vitals:**
  - LCP (Largest Contentful Paint)
  - CLS (Cumulative Layout Shift)
  - FCP (First Contentful Paint)
  - INP (Interaction to Next Paint)
  - TTFB (Time to First Byte)
- **Scores:**
  - Performance (0-100)
  - Accessibility (0-100)
  - SEO (0-100)
  - Best Practices (0-100)
- **Recommendations:**
  - Unused JavaScript
  - Image optimization
  - CSS minification

### Load Tests (k6)
- **Metrics:**
  - Requests per second (RPS)
  - Response time percentiles (P50, P90, P95, P99)
  - Error rate
  - Data throughput
- **Configuration:**
  - Adjustable virtual users
  - Ramp-up/ramp-down stages
  - Custom thresholds
  - Multi-stage load patterns

### Pixel Audits
**Supported Pixels:**
- Google Analytics 4 (GA4)
- Google Tag Manager (GTM)
- Meta Pixel (Facebook)
- Google Ads
- TikTok
- LinkedIn Insight Tag
- Pinterest Tag
- Hotjar
- Microsoft Clarity

**Detection:**
- Script presence
- Container IDs
- PageView event firing
- Network request capture
- HAR file generation

---

## 💻 System Requirements

### Mercan Server
- ✅ Available: 124GB RAM, 32 cores, 1.8TB disk
- ✅ Docker & Docker Compose installed
- ✅ Ports 3001, 9000, 9001, 6379 available
- ✅ SSH access on port 2222

### n8n Server (23.94.185.25)
- ✅ n8n installed and running
- ✅ Public webhook access
- ✅ Airtable integration available

### Local Development
- Node.js 18+
- Docker & Docker Compose
- curl or Postman for testing

---

## 🔐 Security Considerations

### Implemented
- ✅ MinIO access keys configured
- ✅ Rate limiting on API (100 req/15min)
- ✅ Helmet.js security headers
- ✅ Input validation
- ✅ Error handling with sanitized responses

### Recommended
- [ ] Add API authentication (Bearer tokens)
- [ ] Implement n8n webhook secrets
- [ ] Set up SSL/TLS for MinIO
- [ ] Configure firewall rules
- [ ] Add request logging/monitoring

---

## 📈 Monitoring

### Health Checks
```bash
# API health
curl http://38.97.60.181:3001/api/health

# Docker services
ssh -p 2222 root@38.97.60.181 'cd /opt/testing-agent && docker-compose ps'

# Disk space
ssh -p 2222 root@38.97.60.181 'df -h /opt/testing-agent/artifacts'
```

### Logs
```bash
# Real-time logs
ssh -p 2222 root@38.97.60.181 'cd /opt/testing-agent && docker-compose logs -f'

# Specific service
ssh -p 2222 root@38.97.60.181 'cd /opt/testing-agent && docker-compose logs test-api'

# Application logs
ssh -p 2222 root@38.97.60.181 'tail -f /opt/testing-agent/test-api/logs/combined.log'
```

---

## 🎯 Next Steps

### Immediate (This Week)
1. ✅ **Deploy to Mercan Server**
   - Run `./deploy.sh` or follow manual steps
   - Verify all services running
   - Test API endpoints

2. ✅ **Configure Airtable**
   - Create base and 10 tables
   - Add views and automations
   - Add first client (PixelCraftedMedia)
   - Add first website (VariableLib)

3. ✅ **Set up n8n Workflows**
   - Create main orchestrator workflow
   - Configure Airtable credentials
   - Test webhook integration

4. ✅ **Run First Test**
   - Click "Run Smoke Test" in Airtable
   - Verify results appear in tables
   - Check MinIO for screenshots

### Short Term (This Month)
5. ⏳ **Add More Websites**
   - Mercan.com
   - MerCare.ca
   - Other client sites

6. ⏳ **Set up Notifications**
   - Slack integration
   - Email alerts
   - Asana task creation

7. ⏳ **Create Test Case Generator**
   - DeepSeek API integration
   - AI-powered test generation
   - Approval workflow

### Long Term
8. ⏳ **Enhance Reporting**
   - Custom HTML reports
   - Trend analysis
   - Executive dashboards

9. ⏳ **Add Advanced Testing**
   - Visual regression (BackstopJS)
   - Accessibility testing (Pa11y)
   - Security scanning (OWASP ZAP)

---

## 🆘 Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| API not responding | `docker-compose restart test-api` |
| Tests timing out | Increase timeout in n8n (300s) |
| MinIO not accessible | Check docker logs: `docker-compose logs minio` |
| Playwright crashes | Increase memory limit in docker-compose.yml |
| Webhook not firing | Check Airtable automation is enabled |
| Airtable errors | Verify credentials and base ID |

---

## 📞 Support

**Documentation:**
- Full deployment guide: `DEPLOYMENT_GUIDE.md`
- API reference: `README.md`
- Airtable guide: `AIRTABLE_SETUP_GUIDE.md`

**Server Access:**
- Mercan SSH: `ssh -p 2222 root@38.97.60.181`
- n8n: https://automator.pixelcraftedmedia.com
- MinIO Console: http://38.97.60.181:9001

---

## ✅ Project Checklist

### Pre-Deployment
- [x] Code complete
- [x] Docker configuration ready
- [x] Documentation written
- [x] Deployment scripts created

### Deployment
- [ ] Deploy to Mercan server
- [ ] Configure environment variables
- [ ] Start Docker services
- [ ] Verify API health

### Configuration
- [ ] Create Airtable base
- [ ] Set up all tables
- [ ] Configure views
- [ ] Add automations
- [ ] Create n8n workflows
- [ ] Configure credentials

### Testing
- [ ] Test API endpoints directly
- [ ] Test via n8n webhook
- [ ] Test via Airtable button
- [ ] Verify results in Airtable
- [ ] Check MinIO artifacts

### Launch
- [ ] Add first client
- [ ] Add first website
- [ ] Run first test
- [ ] Monitor execution
- [ ] Review results

---

## 🎉 Success Criteria

System is considered successfully deployed when:

1. ✅ All Docker services running on Mercan server
2. ✅ API health check returns 200 OK
3. ✅ Airtable base configured with all tables
4. ✅ n8n workflow active and accessible
5. ✅ First smoke test completes successfully
6. ✅ Results appear in Airtable tables
7. ✅ Screenshots uploaded to MinIO
8. ✅ Scheduled tests running automatically

---

**Project Status**: ✅ **READY FOR DEPLOYMENT**
**Build Date**: December 27, 2025
**Version**: 1.0.0
**Built For**: Wassim / PixelCraftedMedia

---

*This system was built following the "bmad method" - modular, automated, and deployable. All components are containerized, documented, and ready for production deployment.*
