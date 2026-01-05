const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const storage = require('../utils/storage');
const { v4: uuidv4 } = require('uuid');

/**
 * Self-Healing Test System
 *
 * This endpoint receives selector failures and provides suggested fixes.
 * In a production environment, this would integrate with an AI/LLM service
 * to analyze the HTML and suggest new selectors.
 */

// In-memory store for healing records (use database in production)
const healingHistory = new Map();

/**
 * POST /api/heal
 * Receive a selector failure and attempt to suggest a fix
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      event,
      context,
      testMetadata,
      timestamp
    } = req.body;

    // Validate required fields
    if (!event || event !== 'selector_failure') {
      return res.status(400).json({
        success: false,
        error: 'Invalid event type. Expected: selector_failure'
      });
    }

    if (!context || !context.failedSelector) {
      return res.status(400).json({
        success: false,
        error: 'Missing context or failedSelector'
      });
    }

    const healId = uuidv4();
    logger.info('Received healing request', {
      healId,
      selector: context.failedSelector,
      url: context.pageUrl
    });

    // Analyze the failure and suggest fixes
    const analysis = analyzeFailure(context);

    // Store the healing record
    const healingRecord = {
      id: healId,
      originalSelector: context.failedSelector,
      errorMessage: context.errorMessage,
      pageUrl: context.pageUrl,
      pageTitle: context.pageTitle,
      analysis,
      testMetadata,
      createdAt: new Date().toISOString(),
      status: analysis.suggestedSelector ? 'suggested' : 'pending'
    };

    healingHistory.set(healId, healingRecord);

    // Save HTML snapshot for future reference (if provided)
    if (context.htmlBody) {
      try {
        const htmlPath = `/app/artifacts/heal/${healId}-snapshot.html`;
        const fs = require('fs').promises;
        await fs.mkdir('/app/artifacts/heal', { recursive: true });
        await fs.writeFile(htmlPath, context.htmlBody);

        healingRecord.htmlSnapshotPath = htmlPath;
        logger.debug('Saved HTML snapshot', { path: htmlPath });
      } catch (err) {
        logger.warn('Failed to save HTML snapshot:', err.message);
      }
    }

    // Return the analysis result
    res.json({
      success: true,
      healId,
      originalSelector: context.failedSelector,
      suggestedSelector: analysis.suggestedSelector,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
      alternativeSelectors: analysis.alternatives,
      similarElements: context.similarElements?.slice(0, 5),
      duration_ms: Date.now() - startTime
    });

  } catch (error) {
    logger.error('Healing endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      duration_ms: Date.now() - startTime
    });
  }
});

/**
 * GET /api/heal/:id
 * Get a specific healing record
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const record = healingHistory.get(id);

  if (!record) {
    return res.status(404).json({
      success: false,
      error: 'Healing record not found'
    });
  }

  res.json({
    success: true,
    record
  });
});

/**
 * GET /api/heal
 * List recent healing records
 */
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const records = Array.from(healingHistory.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);

  res.json({
    success: true,
    count: records.length,
    records
  });
});

/**
 * POST /api/heal/:id/apply
 * Apply a suggested fix (update test definition)
 */
router.post('/:id/apply', async (req, res) => {
  const { id } = req.params;
  const { confirm } = req.body;

  const record = healingHistory.get(id);

  if (!record) {
    return res.status(404).json({
      success: false,
      error: 'Healing record not found'
    });
  }

  if (!record.analysis?.suggestedSelector) {
    return res.status(400).json({
      success: false,
      error: 'No suggested selector available for this record'
    });
  }

  // In production, this would update the test_definitions table
  // For now, we just mark it as applied
  record.status = 'applied';
  record.appliedAt = new Date().toISOString();
  record.appliedSelector = record.analysis.suggestedSelector;

  logger.info('Applied healing fix', {
    healId: id,
    original: record.originalSelector,
    new: record.appliedSelector
  });

  res.json({
    success: true,
    message: 'Healing fix applied',
    record
  });
});

/**
 * Analyze the failure and suggest fixes
 * This is a rule-based analyzer. In production, integrate with AI/LLM.
 */
function analyzeFailure(context) {
  const { failedSelector, similarElements, errorMessage, htmlBody } = context;
  const result = {
    suggestedSelector: null,
    confidence: 0,
    reasoning: '',
    alternatives: []
  };

  // If we have similar elements, try to find a match
  if (similarElements && similarElements.length > 0) {
    // Look for element with matching ID
    const withId = similarElements.find(el => el.id && el.id.length > 0);
    if (withId) {
      result.alternatives.push({
        selector: `#${withId.id}`,
        confidence: 0.9,
        reason: 'Found element with unique ID'
      });
    }

    // Look for element with unique class
    const withClass = similarElements.find(el =>
      el.className &&
      typeof el.className === 'string' &&
      el.className.length > 0
    );
    if (withClass) {
      const classes = withClass.className.split(' ').filter(c => c.length > 0);
      if (classes.length > 0) {
        result.alternatives.push({
          selector: `.${classes[0]}`,
          confidence: 0.6,
          reason: 'Found element with class'
        });
      }
    }

    // Look for element with text content
    const withText = similarElements.find(el => el.text && el.text.length > 2);
    if (withText) {
      result.alternatives.push({
        selector: `text="${withText.text}"`,
        confidence: 0.7,
        reason: 'Found element with text content'
      });
    }

    // Look for data-testid or similar test attributes
    if (htmlBody) {
      const testIdMatch = htmlBody.match(/data-testid=["']([^"']+)["']/);
      if (testIdMatch) {
        result.alternatives.push({
          selector: `[data-testid="${testIdMatch[1]}"]`,
          confidence: 0.95,
          reason: 'Found data-testid attribute'
        });
      }
    }

    // Select the best alternative
    if (result.alternatives.length > 0) {
      result.alternatives.sort((a, b) => b.confidence - a.confidence);
      const best = result.alternatives[0];
      result.suggestedSelector = best.selector;
      result.confidence = best.confidence;
      result.reasoning = best.reason;
    }
  }

  // Analyze the error message for hints
  if (!result.suggestedSelector && errorMessage) {
    if (errorMessage.includes('strict mode violation')) {
      result.reasoning = 'Multiple elements matched the selector. Consider adding more specificity.';
      result.confidence = 0.3;
    } else if (errorMessage.includes('Timeout')) {
      result.reasoning = 'Element took too long to appear. The selector may be correct but the page is slow.';
      result.confidence = 0.4;
    } else if (errorMessage.includes('not attached')) {
      result.reasoning = 'Element was removed from DOM. Consider waiting for stability.';
      result.confidence = 0.5;
    }
  }

  // Pattern-based suggestions for common selector changes
  if (failedSelector) {
    // Check for common class name changes
    if (failedSelector.includes('btn-primary')) {
      result.alternatives.push({
        selector: failedSelector.replace('btn-primary', 'btn-submit'),
        confidence: 0.5,
        reason: 'Common Bootstrap class variation'
      });
    }

    // Check for common ID patterns
    if (failedSelector.includes('submit-btn')) {
      result.alternatives.push({
        selector: failedSelector.replace('submit-btn', 'submit-button'),
        confidence: 0.5,
        reason: 'Common ID naming variation'
      });
    }
  }

  return result;
}

module.exports = router;
