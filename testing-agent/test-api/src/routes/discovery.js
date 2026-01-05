const express = require('express');
const router = express.Router();
const discoveryService = require('../services/discovery');
const logger = require('../utils/logger');

/**
 * POST /api/test/discover
 * Discover pages on a domain and auto-generate test suites
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      domain,
      depth = 2,
      maxPages = 50,
      autoTest = false,
      webhookUrl = null
    } = req.body;

    // Validate required fields
    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'domain is required'
      });
    }

    // Validate depth
    if (depth < 1 || depth > 3) {
      return res.status(400).json({
        success: false,
        error: 'depth must be between 1 and 3'
      });
    }

    // Validate maxPages
    if (maxPages < 1 || maxPages > 200) {
      return res.status(400).json({
        success: false,
        error: 'maxPages must be between 1 and 200'
      });
    }

    logger.info('Starting discovery', { domain, depth, maxPages, autoTest });

    // Run discovery
    const result = await discoveryService.discover({
      domain,
      depth,
      maxPages,
      autoTest,
      webhookUrl
    });

    // Add timing
    result.total_duration_ms = Date.now() - startTime;

    res.json(result);

  } catch (error) {
    logger.error('Discovery endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      duration_ms: Date.now() - startTime
    });
  }
});

/**
 * POST /api/test/discover/classify
 * Classify a single URL without full crawl
 */
router.post('/classify', async (req, res) => {
  try {
    const { url, html } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'url is required'
      });
    }

    const classification = discoveryService.classifyPage({ url, html: html || '' });

    res.json({
      success: true,
      url,
      classification
    });

  } catch (error) {
    logger.error('Classification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/test/discover/templates
 * Get available test templates by page type
 */
router.get('/templates', (req, res) => {
  res.json({
    success: true,
    templates: discoveryService.testTemplates,
    pageTypes: Object.keys(discoveryService.pagePatterns)
  });
});

/**
 * POST /api/test/discover/sitemap
 * Quick sitemap-based discovery (faster, less detailed)
 */
router.post('/sitemap', async (req, res) => {
  const startTime = Date.now();

  try {
    const { domain, maxPages = 100 } = req.body;

    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'domain is required'
      });
    }

    const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;

    // Use fallback discovery which tries sitemap first
    const result = await discoveryService.fallbackDiscovery(baseUrl, maxPages);

    // Classify the pages
    const classifiedPages = discoveryService.classifyPages(result.pages);
    const testSuites = discoveryService.generateTestSuites(classifiedPages, domain);

    res.json({
      success: true,
      domain: result.domain,
      method: 'sitemap',
      summary: {
        totalPages: result.totalPages,
        byType: Object.fromEntries(
          Object.entries(classifiedPages)
            .filter(([_, pages]) => pages.length > 0)
            .map(([type, pages]) => [type, pages.length])
        )
      },
      testSuites,
      duration_ms: Date.now() - startTime
    });

  } catch (error) {
    logger.error('Sitemap discovery error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      duration_ms: Date.now() - startTime
    });
  }
});

module.exports = router;
