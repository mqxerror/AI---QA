# AI Website Testing Agent

Automated website testing system with comprehensive UI, UX, performance, load, and marketing pixel testing.

## Architecture

```
┌──────────────┐      ┌──────────────────────────┐      ┌──────────────┐
│   AIRTABLE   │ ───► │ n8n (automator.pixel...) │ ───► │   MERCAN     │
│  (Interface) │ ◄─── │     (Orchestration)      │ ◄─── │   SERVER     │
└──────────────┘      └──────────────────────────┘      └──────────────┘
```

## Features

- ✅ **Smoke Tests**: Homepage load, navigation, console errors, broken links
- ✅ **Performance Tests**: Lighthouse audits (LCP, CLS, FCP, TTFB, etc.)
- ✅ **Load Tests**: k6 stress testing with configurable VUs
- ✅ **Pixel Audit**: Detect GA4, GTM, Meta Pixel, and 6 other marketing pixels
- ✅ **Automated Scheduling**: Daily/Weekly test runs via Airtable
- ✅ **AI Test Generation**: LLM-powered test case generation (DeepSeek)
- ✅ **Failure Tracking**: Automatic Asana task creation for failures
- ✅ **Reports**: HTML reports with screenshots, videos, and HAR files

## Quick Start

### 1. Deploy to Mercan Server

```bash
# SSH into Mercan server
ssh -p 2222 root@38.97.60.181

# Create directory
mkdir -p /opt/testing-agent

# Clone or upload the testing-agent folder
cd /opt/testing-agent

# Create .env file
cp .env.example .env
nano .env  # Configure your settings

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f test-api
```

### 2. Configure Airtable

Follow the guide in `AIRTABLE_SETUP_GUIDE.md` to:
- Create the Airtable base
- Set up all 10 tables
- Configure views and automations
- Add button webhooks

### 3. Import n8n Workflows

1. Go to https://automator.pixelcraftedmedia.com
2. Navigate to **Settings** > **Import from File**
3. Import `n8n-workflows/main-orchestrator.json`
4. Import `n8n-workflows/test-case-generator.json`
5. Import `n8n-workflows/failure-handler.json`
6. Configure Airtable credentials in n8n

### 4. Test the System

```bash
# Test API health
curl http://38.97.60.181:3001/api/health

# Run a smoke test
curl -X POST http://38.97.60.181:3001/api/test/smoke \
  -H "Content-Type: application/json" \
  -d '{
    "target_url": "https://variablelib.com",
    "browser": "chromium",
    "viewport": {"width": 1920, "height": 1080}
  }'

# Run performance test
curl -X POST http://38.97.60.181:3001/api/test/performance \
  -H "Content-Type: application/json" \
  -d '{
    "target_url": "https://variablelib.com",
    "device": "desktop"
  }'
```

## Directory Structure

```
testing-agent/
├── docker-compose.yml          # Main stack configuration
├── .env.example                # Environment variables template
├── test-api/                   # Node.js API server
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js            # Express server
│       ├── routes/             # API endpoints
│       ├── services/           # Test runners (Playwright, Lighthouse, k6)
│       └── utils/              # Logger, storage, helpers
├── playwright/                 # Playwright test suites
│   ├── playwright.config.ts
│   ├── package.json
│   └── tests/
│       ├── smoke/
│       └── pixel-audit/
├── k6/                         # k6 load test scripts
│   └── load-test.js
├── artifacts/                  # Test outputs (mounted volume)
│   ├── screenshots/
│   ├── videos/
│   ├── har/
│   ├── reports/
│   └── k6/
└── n8n-workflows/              # n8n workflow exports
    ├── main-orchestrator.json
    ├── test-case-generator.json
    └── failure-handler.json
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Smoke Tests
```
POST /api/test/smoke
Body: {
  "target_url": "https://example.com",
  "browser": "chromium",
  "viewport": { "width": 1920, "height": 1080 },
  "tests": ["homepage_loads", "navigation_works", "no_console_errors"]
}
```

### Performance Tests
```
POST /api/test/performance
Body: {
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

### Load Tests
```
POST /api/test/load
Body: {
  "target_url": "https://example.com",
  "virtual_users": 10,
  "duration": "30s",
  "thresholds": {
    "p95": 500,
    "error_rate": 0.01
  }
}
```

### Pixel Audit
```
POST /api/test/pixel-audit
Body: {
  "target_url": "https://example.com",
  "incognito": true,
  "expected_pixels": ["GA4", "Meta Pixel", "GTM"],
  "capture_har": true
}
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Test API | 3001 | Main test execution API |
| MinIO | 9000 | Object storage for artifacts |
| MinIO Console | 9001 | Web UI for MinIO |
| Redis | 6379 | Queue and caching |

## Environment Variables

```bash
# Server
NODE_ENV=production
PORT=3001

# MinIO Storage
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET=testing-agent
MINIO_PUBLIC_URL=http://38.97.60.181:9000

# Redis
REDIS_URL=redis://redis:6379

# n8n Webhook
N8N_WEBHOOK_URL=https://automator.pixelcraftedmedia.com/webhook
```

## Workflow Integration

### Airtable → n8n → Test API → Airtable

1. **Trigger**: User clicks button in Airtable or scheduled automation
2. **Webhook**: Airtable sends data to n8n webhook
3. **Orchestrator**: n8n workflow routes to appropriate test type
4. **Execution**: n8n calls Test API on Mercan server
5. **Storage**: Test API uploads artifacts to MinIO
6. **Results**: n8n writes results back to Airtable
7. **Notifications**: Slack/Email sent if failures detected
8. **Asana**: Tasks created for critical failures

## Supported Tracking Pixels

- Google Analytics 4 (GA4)
- Google Tag Manager (GTM)
- Meta Pixel (Facebook)
- Google Ads
- TikTok Pixel
- LinkedIn Insight Tag
- Pinterest Tag
- Hotjar
- Microsoft Clarity

## Performance Metrics

- **LCP**: Largest Contentful Paint
- **CLS**: Cumulative Layout Shift
- **FCP**: First Contentful Paint
- **INP**: Interaction to Next Paint
- **TTFB**: Time to First Byte
- **Lighthouse Scores**: Performance, Accessibility, SEO, Best Practices

## Load Test Metrics

- **RPS**: Requests per second
- **P50, P90, P95, P99**: Response time percentiles
- **Error Rate**: Failed request percentage
- **Throughput**: Data sent/received

## Troubleshooting

### Test API not responding
```bash
docker-compose logs test-api
docker-compose restart test-api
```

### MinIO not accessible
```bash
docker-compose logs minio
# Access MinIO console: http://38.97.60.181:9001
```

### Playwright browser crashes
```bash
# Increase memory limit in docker-compose.yml
services:
  test-api:
    mem_limit: 4g
```

### k6 tests timing out
```bash
# Reduce virtual users or duration
# Check server load: htop
```

## Monitoring

```bash
# Check all services
docker-compose ps

# View real-time logs
docker-compose logs -f

# Check disk space (artifacts can grow)
df -h

# Check MinIO storage usage
docker exec testing-agent-minio mc du minio/testing-agent
```

## Maintenance

### Clean up old artifacts
```bash
# Remove artifacts older than 30 days
find ./artifacts -type f -mtime +30 -delete

# Or use MinIO lifecycle policies
```

### Backup Airtable data
```bash
# Use Airtable API or manual CSV export
# Store in /opt/testing-agent/backups/
```

### Update Docker images
```bash
docker-compose pull
docker-compose up -d
```

## Support

- **Documentation**: See `Prd Project.md` for full specification
- **Server Reference**: See `SERVER_INFRASTRUCTURE_REFERENCE.md`
- **Airtable Guide**: See `AIRTABLE_SETUP_GUIDE.md`

## License

MIT © Wassim / PixelCraftedMedia

---

**Version**: 1.0.0
**Last Updated**: December 2024
**Server**: Mercan (38.97.60.181)
**n8n**: automator.pixelcraftedmedia.com
