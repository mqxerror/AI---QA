const express = require('express');
const router = express.Router();
const db = require('../database').default;
const { authenticate } = require('../middleware/auth');

// Get configurations for a website
router.get('/website/:websiteId', authenticate, (req, res) => {
  try {
    const configs = db.prepare(`
      SELECT * FROM test_configurations WHERE website_id = ?
    `).all(req.params.websiteId);
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update configuration
router.post('/', authenticate, (req, res) => {
  try {
    const {
      website_id,
      test_type,
      enabled = true,
      thresholds,
      browsers,
      viewports,
      login_required = false,
      login_credentials,
      expected_pixels
    } = req.body;

    // Check if config exists
    const existing = db.prepare(`
      SELECT id FROM test_configurations
      WHERE website_id = ? AND test_type = ?
    `).get(website_id, test_type);

    if (existing) {
      // Update
      db.prepare(`
        UPDATE test_configurations SET
          enabled = ?,
          thresholds = ?,
          browsers = ?,
          viewports = ?,
          login_required = ?,
          login_credentials = ?,
          expected_pixels = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        enabled ? 1 : 0,
        thresholds ? JSON.stringify(thresholds) : null,
        browsers ? JSON.stringify(browsers) : null,
        viewports ? JSON.stringify(viewports) : null,
        login_required ? 1 : 0,
        login_credentials || null,
        expected_pixels ? JSON.stringify(expected_pixels) : null,
        existing.id
      );
      res.json({ id: existing.id, success: true, updated: true });
    } else {
      // Insert
      const result = db.prepare(`
        INSERT INTO test_configurations (
          website_id, test_type, enabled, thresholds, browsers, viewports,
          login_required, login_credentials, expected_pixels
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        website_id,
        test_type,
        enabled ? 1 : 0,
        thresholds ? JSON.stringify(thresholds) : null,
        browsers ? JSON.stringify(browsers) : null,
        viewports ? JSON.stringify(viewports) : null,
        login_required ? 1 : 0,
        login_credentials || null,
        expected_pixels ? JSON.stringify(expected_pixels) : null
      );
      res.json({ id: result.lastInsertRowid, success: true, updated: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete configuration
router.delete('/:id', authenticate, (req, res) => {
  try {
    db.prepare('DELETE FROM test_configurations WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
