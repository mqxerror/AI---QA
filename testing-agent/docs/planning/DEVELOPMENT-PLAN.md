# Development & Technical Wins Plan

**Owner:** Derek (Developer)
**Created:** January 5, 2026

---

## D1. Parallel Test Execution

### Current State
- Tests run sequentially
- Single browser instance
- Long wait times for full suites

### Implementation

```javascript
// services/parallelRunner.js
const { chromium } = require('playwright');

class ParallelTestRunner {
  constructor(options = {}) {
    this.maxWorkers = options.maxWorkers || 4;
    this.timeout = options.timeout || 30000;
    this.results = [];
  }

  async runTests(testSuite, pages) {
    const chunks = this.chunkArray(pages, this.maxWorkers);
    const browser = await chromium.launch();

    const results = await Promise.all(
      chunks.map(async (chunk, workerIndex) => {
        const context = await browser.newContext();
        const workerResults = [];

        for (const page of chunk) {
          const result = await this.runSingleTest(context, page, testSuite);
          workerResults.push(result);

          // Emit progress
          this.emit('progress', {
            completed: this.results.length + workerResults.length,
            total: pages.length,
            current: page.url
          });
        }

        await context.close();
        return workerResults;
      })
    );

    await browser.close();
    return results.flat();
  }

  async runSingleTest(context, pageConfig, testSuite) {
    const page = await context.newPage();
    const startTime = Date.now();

    try {
      await page.goto(pageConfig.url, { timeout: this.timeout });

      const checks = await this.runChecks(page, testSuite.checks);

      return {
        url: pageConfig.url,
        status: 'passed',
        duration: Date.now() - startTime,
        checks
      };
    } catch (error) {
      return {
        url: pageConfig.url,
        status: 'failed',
        duration: Date.now() - startTime,
        error: error.message
      };
    } finally {
      await page.close();
    }
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

module.exports = ParallelTestRunner;
```

### Progress Tracking

```javascript
// WebSocket progress updates
const runTestsWithProgress = async (websiteId, testType) => {
  const runner = new ParallelTestRunner({ maxWorkers: 4 });

  runner.on('progress', (progress) => {
    websocketServer.emit(`test:${websiteId}`, {
      type: 'progress',
      completed: progress.completed,
      total: progress.total,
      currentUrl: progress.current,
      percentage: Math.round((progress.completed / progress.total) * 100)
    });
  });

  const results = await runner.runTests(testSuite, pages);

  websocketServer.emit(`test:${websiteId}`, {
    type: 'complete',
    results
  });

  return results;
};
```

---

## D2. Result Caching

### Content Hashing

```javascript
// services/cacheService.js
const crypto = require('crypto');
const Redis = require('ioredis');

class CacheService {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.ttl = 86400; // 24 hours
  }

  async hashContent(content) {
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex')
      .substring(0, 16);
  }

  async getPageHash(url) {
    const response = await fetch(url);
    const html = await response.text();
    return this.hashContent(html);
  }

  async shouldRunTest(url, testType) {
    const currentHash = await this.getPageHash(url);
    const cacheKey = `test:${testType}:${url}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const { hash, result } = JSON.parse(cached);
      if (hash === currentHash) {
        return { shouldRun: false, cachedResult: result };
      }
    }

    return { shouldRun: true, currentHash };
  }

  async cacheResult(url, testType, hash, result) {
    const cacheKey = `test:${testType}:${url}`;
    await this.redis.setex(
      cacheKey,
      this.ttl,
      JSON.stringify({ hash, result, cachedAt: new Date().toISOString() })
    );
  }

  async invalidate(url, testType = null) {
    if (testType) {
      await this.redis.del(`test:${testType}:${url}`);
    } else {
      const keys = await this.redis.keys(`test:*:${url}`);
      if (keys.length) await this.redis.del(...keys);
    }
  }

  async getStats() {
    const keys = await this.redis.keys('test:*');
    let hits = 0, misses = 0;

    // Track in separate counters
    hits = parseInt(await this.redis.get('cache:hits') || '0');
    misses = parseInt(await this.redis.get('cache:misses') || '0');

    return {
      totalCached: keys.length,
      hits,
      misses,
      hitRate: hits + misses > 0
        ? ((hits / (hits + misses)) * 100).toFixed(1) + '%'
        : 'N/A'
    };
  }
}

module.exports = new CacheService();
```

### Force Refresh Option

```javascript
// routes/smoke.js
router.post('/run', async (req, res) => {
  const { websiteId, forceRefresh = false } = req.body;

  const pages = await getWebsitePages(websiteId);
  const results = [];

  for (const page of pages) {
    if (!forceRefresh) {
      const cache = await cacheService.shouldRunTest(page.url, 'smoke');
      if (!cache.shouldRun) {
        results.push({
          ...cache.cachedResult,
          fromCache: true
        });
        continue;
      }
    }

    const result = await runSmokeTest(page);
    await cacheService.cacheResult(page.url, 'smoke', cache.currentHash, result);
    results.push(result);
  }

  res.json({ results, cacheStats: await cacheService.getStats() });
});
```

---

## D3. Webhook Integration

### Webhook Endpoint

```javascript
// routes/webhook.js
const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// Verify webhook signatures
const verifySignature = (payload, signature, secret) => {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
};

// Generic trigger endpoint
router.post('/trigger', async (req, res) => {
  const { websiteId, tests = ['smoke'], metadata = {} } = req.body;
  const apiKey = req.headers['x-api-key'];

  // Validate API key
  const website = await db.get(
    'SELECT * FROM websites WHERE id = ? AND api_key = ?',
    [websiteId, apiKey]
  );

  if (!website) {
    return res.status(401).json({ error: 'Invalid API key or website' });
  }

  // Queue tests
  const jobIds = [];
  for (const testType of tests) {
    const job = await queueService.addJob(testType, {
      websiteId,
      triggeredBy: 'webhook',
      metadata
    });
    jobIds.push(job.id);
  }

  res.json({
    success: true,
    message: `Queued ${tests.length} test(s)`,
    jobIds
  });
});

// GitHub webhook
router.post('/github', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const event = req.headers['x-github-event'];

  // Find website by repo
  const repo = req.body.repository?.full_name;
  const website = await db.get(
    'SELECT * FROM websites WHERE github_repo = ?',
    [repo]
  );

  if (!website) {
    return res.status(404).json({ error: 'Website not found for repo' });
  }

  // Verify signature
  if (!verifySignature(JSON.stringify(req.body), signature, website.webhook_secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Handle events
  if (event === 'push' && req.body.ref === 'refs/heads/main') {
    await queueService.addJob('smoke', {
      websiteId: website.id,
      triggeredBy: 'github',
      metadata: {
        commit: req.body.after,
        author: req.body.pusher?.name,
        message: req.body.head_commit?.message
      }
    });
  }

  res.json({ success: true });
});

// GitLab webhook
router.post('/gitlab', async (req, res) => {
  const token = req.headers['x-gitlab-token'];
  const event = req.headers['x-gitlab-event'];

  const website = await db.get(
    'SELECT * FROM websites WHERE gitlab_token = ?',
    [token]
  );

  if (!website) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (event === 'Push Hook' && req.body.ref === 'refs/heads/main') {
    await queueService.addJob('smoke', {
      websiteId: website.id,
      triggeredBy: 'gitlab',
      metadata: {
        commit: req.body.checkout_sha,
        author: req.body.user_name
      }
    });
  }

  res.json({ success: true });
});

module.exports = router;
```

---

## D4. API Rate Limiting & Security

### Per-Client Rate Limiting

```javascript
// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const createClientLimiter = () => {
  return rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:'
    }),
    windowMs: 60 * 1000, // 1 minute
    max: async (req) => {
      const org = await getOrganization(req.organizationId);
      return PLAN_LIMITS[org.plan].requestsPerMinute;
    },
    keyGenerator: (req) => req.organizationId,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: res.getHeader('Retry-After')
      });
    }
  });
};

const PLAN_LIMITS = {
  starter: { requestsPerMinute: 30, testRunsPerDay: 100 },
  professional: { requestsPerMinute: 100, testRunsPerDay: 1000 },
  agency: { requestsPerMinute: 300, testRunsPerDay: -1 }
};
```

### API Key Authentication

```javascript
// middleware/apiAuth.js
const apiKeyAuth = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  // Hash the key for lookup
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  const keyRecord = await db.get(
    'SELECT * FROM api_keys WHERE key_hash = ? AND active = 1',
    [keyHash]
  );

  if (!keyRecord) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Check expiration
  if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
    return res.status(401).json({ error: 'API key expired' });
  }

  // Update last used
  await db.run(
    'UPDATE api_keys SET last_used_at = ? WHERE id = ?',
    [new Date().toISOString(), keyRecord.id]
  );

  req.organizationId = keyRecord.organization_id;
  req.apiKeyId = keyRecord.id;
  next();
};
```

### Audit Logging

```javascript
// middleware/auditLog.js
const auditLog = async (req, res, next) => {
  const startTime = Date.now();

  // Capture response
  const originalSend = res.send;
  res.send = function(body) {
    res.body = body;
    return originalSend.call(this, body);
  };

  res.on('finish', async () => {
    await db.run(`
      INSERT INTO audit_logs (
        organization_id, user_id, api_key_id,
        method, path, status_code,
        request_body, response_body,
        ip_address, user_agent,
        duration_ms, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.organizationId,
      req.userId,
      req.apiKeyId,
      req.method,
      req.path,
      res.statusCode,
      JSON.stringify(req.body),
      res.body?.substring(0, 1000),
      req.ip,
      req.headers['user-agent'],
      Date.now() - startTime,
      new Date().toISOString()
    ]);
  });

  next();
};
```

---

## D5. PostgreSQL Migration

### Schema Design

```sql
-- migrations/001_initial_schema.sql

-- Organizations (tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  plan VARCHAR(50) DEFAULT 'starter',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Websites
CREATE TABLE websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  url VARCHAR(2048) NOT NULL,
  name VARCHAR(255),
  settings JSONB DEFAULT '{}',
  github_repo VARCHAR(255),
  webhook_secret VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test Runs
CREATE TABLE test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  test_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  triggered_by VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  results JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_test_runs_website ON test_runs(website_id);
CREATE INDEX idx_test_runs_created ON test_runs(created_at DESC);
CREATE INDEX idx_websites_org ON websites(organization_id);

-- Full-text search
CREATE INDEX idx_websites_search ON websites
  USING GIN (to_tsvector('english', name || ' ' || url));
```

### Migration Script

```javascript
// scripts/migrate-to-postgres.js
const sqlite3 = require('better-sqlite3');
const { Pool } = require('pg');

const migrateToPostgres = async () => {
  const sqliteDb = sqlite3('./data/qa-agent.db');
  const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log('Starting migration...');

  // Migrate organizations (from implicit to explicit)
  const websites = sqliteDb.prepare('SELECT DISTINCT organization_id FROM websites').all();
  for (const { organization_id } of websites) {
    await pgPool.query(
      'INSERT INTO organizations (id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [organization_id, 'Default Organization']
    );
  }

  // Migrate websites
  const allWebsites = sqliteDb.prepare('SELECT * FROM websites').all();
  for (const site of allWebsites) {
    await pgPool.query(`
      INSERT INTO websites (id, organization_id, url, name, settings, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [site.id, site.organization_id, site.url, site.name, site.settings, site.created_at]);
  }

  // Migrate test_runs
  const allRuns = sqliteDb.prepare('SELECT * FROM test_runs').all();
  for (const run of allRuns) {
    await pgPool.query(`
      INSERT INTO test_runs (id, organization_id, website_id, test_type, status, results, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [run.id, run.organization_id, run.website_id, run.test_type, run.status, run.results, run.created_at]);
  }

  console.log('Migration complete!');
  await pgPool.end();
};

migrateToPostgres().catch(console.error);
```

---

## Files Summary

| File | Action | Priority |
|------|--------|----------|
| `services/parallelRunner.js` | Create | High |
| `services/cacheService.js` | Create | Medium |
| `routes/webhook.js` | Create | High |
| `middleware/rateLimiter.js` | Create | High |
| `middleware/apiAuth.js` | Create | High |
| `middleware/auditLog.js` | Create | Medium |
| `migrations/*.sql` | Create | Medium |
| `scripts/migrate-to-postgres.js` | Create | Medium |
