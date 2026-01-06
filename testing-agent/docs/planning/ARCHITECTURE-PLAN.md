# Architecture Optimization Plan

**Owner:** Marcus (System Architect)
**Created:** January 5, 2026

---

## A1. Queue System Activation

### Current State
- Bull queue service created in `test-api/src/services/queue.js`
- Queue routes in `test-api/src/routes/queue.js`
- Redis NOT configured on production server

### Implementation

#### Step 1: Install Redis on Mercan Server
```bash
# SSH to server
ssh -p 2222 root@38.97.60.181

# Option A: Docker (via Dokploy)
# Add to docker-compose.yml:
redis:
  image: redis:7-alpine
  restart: always
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  command: redis-server --appendonly yes

# Option B: Direct install
apt update && apt install redis-server -y
systemctl enable redis-server
systemctl start redis-server
```

#### Step 2: Configure Environment
```bash
# Add to .env
REDIS_HOST=redis  # or localhost if direct install
REDIS_PORT=6379
REDIS_PASSWORD=  # optional
```

#### Step 3: Queue Configuration
```javascript
// services/queue.js enhancements
const QUEUE_CONFIG = {
  discovery: {
    concurrency: 2,
    timeout: 300000,  // 5 minutes
    retries: 3
  },
  loadTest: {
    concurrency: 1,
    timeout: 600000,  // 10 minutes
    retries: 1
  },
  fullSuite: {
    concurrency: 2,
    timeout: 900000,  // 15 minutes
    retries: 2
  },
  visualRegression: {
    concurrency: 3,
    timeout: 180000,  // 3 minutes
    retries: 2
  }
};
```

#### Step 4: Queue Dashboard
```javascript
// Add Bull Board for monitoring
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const { ExpressAdapter } = require('@bull-board/express');

const serverAdapter = new ExpressAdapter();
createBullBoard({
  queues: [
    new BullAdapter(discoveryQueue),
    new BullAdapter(loadTestQueue),
    new BullAdapter(fullSuiteQueue),
    new BullAdapter(visualRegressionQueue)
  ],
  serverAdapter
});

app.use('/admin/queues', serverAdapter.getRouter());
```

---

## A2. Browser Pool Optimization

### Current State
- Basic browser pool in `playwright.js`
- No limits per client
- No health monitoring

### Implementation

#### Step 1: Pool Configuration
```javascript
// services/browserPool.js
const POOL_CONFIG = {
  maxBrowsers: 10,
  maxPagesPerBrowser: 5,
  browserTimeout: 300000,
  healthCheckInterval: 60000,
  maxMemoryMB: 2048
};

class BrowserPool {
  constructor() {
    this.browsers = new Map();
    this.activePages = 0;
    this.startHealthCheck();
  }

  async acquireBrowser(clientId) {
    // Check client limits
    const clientBrowsers = this.getClientBrowserCount(clientId);
    if (clientBrowsers >= POOL_CONFIG.maxBrowsersPerClient) {
      throw new Error('Client browser limit reached');
    }
    // ... acquire logic
  }

  startHealthCheck() {
    setInterval(() => {
      this.browsers.forEach(async (browser, id) => {
        const health = await this.checkBrowserHealth(browser);
        if (!health.healthy) {
          await this.recycleBrowser(id);
        }
      });
    }, POOL_CONFIG.healthCheckInterval);
  }

  async checkBrowserHealth(browser) {
    try {
      const pages = browser.contexts().flatMap(c => c.pages());
      const memory = process.memoryUsage();
      return {
        healthy: memory.heapUsed < POOL_CONFIG.maxMemoryMB * 1024 * 1024,
        pageCount: pages.length,
        memoryMB: Math.round(memory.heapUsed / 1024 / 1024)
      };
    } catch {
      return { healthy: false };
    }
  }
}
```

---

## A3. Self-Healing AI Integration

### Current State
- Foundation in `playwright.js`: `captureHealingContext()`, `sendToHealingEndpoint()`
- `/api/heal` endpoint receives failures
- No AI analysis yet

### Implementation

#### Step 1: Claude API Integration
```javascript
// services/healing.js
const Anthropic = require('@anthropic-ai/sdk');

class SelfHealingService {
  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async analyzeSelectorFailure(context) {
    const { failedSelector, htmlSnapshot, error, screenshot } = context;

    const prompt = `Analyze this selector failure and suggest fixes:

Failed Selector: ${failedSelector}
Error: ${error}

HTML Context (relevant portion):
${htmlSnapshot.substring(0, 5000)}

Suggest:
1. Why the selector failed
2. 3 alternative selectors (most reliable first)
3. Confidence score (0-100) for each suggestion

Return JSON format:
{
  "analysis": "explanation",
  "suggestions": [
    { "selector": "...", "confidence": 95, "reason": "..." }
  ]
}`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    return JSON.parse(response.content[0].text);
  }
}
```

#### Step 2: Healing Database Schema
```sql
CREATE TABLE healing_records (
  id TEXT PRIMARY KEY,
  test_run_id TEXT,
  failed_selector TEXT,
  error_message TEXT,
  html_snapshot TEXT,
  screenshot_path TEXT,
  ai_analysis TEXT,
  suggestions JSON,
  applied_fix TEXT,
  applied_at TIMESTAMP,
  success BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Step 3: Approval Workflow
```javascript
// routes/heal.js additions
router.post('/:id/approve', async (req, res) => {
  const { suggestionIndex } = req.body;
  const record = await db.get('SELECT * FROM healing_records WHERE id = ?', [req.params.id]);

  const suggestions = JSON.parse(record.suggestions);
  const selectedFix = suggestions[suggestionIndex];

  // Update test suite with new selector
  await testSuiteService.updateSelector(
    record.test_run_id,
    record.failed_selector,
    selectedFix.selector
  );

  await db.run(
    'UPDATE healing_records SET applied_fix = ?, applied_at = ? WHERE id = ?',
    [selectedFix.selector, new Date().toISOString(), req.params.id]
  );

  res.json({ success: true, appliedSelector: selectedFix.selector });
});
```

---

## A4. Multi-Tenant Architecture

### Current State
- Single tenant (all data shared)
- No organization isolation

### Implementation

#### Step 1: Database Schema
```sql
-- Organizations
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  plan TEXT DEFAULT 'starter',
  settings JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users belong to organizations
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id),
  email TEXT UNIQUE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add organization_id to existing tables
ALTER TABLE websites ADD COLUMN organization_id TEXT REFERENCES organizations(id);
ALTER TABLE test_runs ADD COLUMN organization_id TEXT REFERENCES organizations(id);
ALTER TABLE test_suites ADD COLUMN organization_id TEXT REFERENCES organizations(id);
```

#### Step 2: Middleware
```javascript
// middleware/tenant.js
const tenantMiddleware = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const token = req.headers.authorization?.replace('Bearer ', '');

  let organizationId;

  if (apiKey) {
    const org = await db.get('SELECT id FROM organizations WHERE api_key = ?', [apiKey]);
    organizationId = org?.id;
  } else if (token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    organizationId = decoded.organizationId;
  }

  if (!organizationId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.organizationId = organizationId;
  next();
};
```

#### Step 3: Rate Limiting per Tenant
```javascript
// middleware/rateLimitByTenant.js
const rateLimitByTenant = (options) => {
  const limiters = new Map();

  return async (req, res, next) => {
    const org = await getOrganization(req.organizationId);
    const limits = PLAN_LIMITS[org.plan];

    if (!limiters.has(req.organizationId)) {
      limiters.set(req.organizationId, rateLimit({
        windowMs: 60000,
        max: limits.requestsPerMinute
      }));
    }

    limiters.get(req.organizationId)(req, res, next);
  };
};

const PLAN_LIMITS = {
  starter: { requestsPerMinute: 30, testRunsPerDay: 100 },
  professional: { requestsPerMinute: 100, testRunsPerDay: 1000 },
  agency: { requestsPerMinute: 300, testRunsPerDay: -1 }
};
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Load Balancer                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Rate Limit  │  │ Auth/Tenant │  │  Logging    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│  Test API     │       │  Queue Worker │       │  Self-Healing │
│  (Express)    │       │  (Bull)       │       │  Service      │
└───────────────┘       └───────────────┘       └───────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Browser Pool                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Browser 1│  │ Browser 2│  │ Browser 3│  │ Browser N│        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐               │
│  │ PostgreSQL│    │   Redis   │    │   MinIO   │               │
│  │ (Data)    │    │ (Queue)   │    │ (Artifacts)│              │
│  └───────────┘    └───────────┘    └───────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `services/browserPool.js` | Create | New browser pool manager |
| `services/healing.js` | Create | AI healing service |
| `middleware/tenant.js` | Create | Multi-tenant middleware |
| `middleware/rateLimitByTenant.js` | Create | Per-tenant rate limiting |
| `services/queue.js` | Modify | Add Bull Board |
| `docker-compose.yml` | Modify | Add Redis service |
| `migrations/001_multi_tenant.sql` | Create | Database migration |

---

## Success Criteria

- [ ] Redis running and queues processing
- [ ] Bull Board accessible at /admin/queues
- [ ] Browser pool limiting to 10 max browsers
- [ ] Self-healing generating suggestions
- [ ] Multi-tenant isolation working
- [ ] Per-tenant rate limits enforced
