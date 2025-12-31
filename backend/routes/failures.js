const express = require('express');
const router = express.Router();
const db = require('../database').default;
const { authenticate } = require('../middleware/auth');
const ActivityLogger = require('../services/ActivityLogger');

// Get all failures with filters
router.get('/', authenticate, (req, res) => {
  try {
    const { status, priority, limit = 50 } = req.query;

    let query = `
      SELECT f.*,
             tr.run_id, tr.test_type,
             w.name as website_name, w.url as website_url
      FROM failures f
      LEFT JOIN test_runs tr ON f.test_run_id = tr.id
      LEFT JOIN websites w ON tr.website_id = w.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND f.status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND f.priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY f.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const failures = db.prepare(query).all(...params);
    res.json(failures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get failure statistics
router.get('/stats', authenticate, (req, res) => {
  try {
    const stats = {
      total: db.prepare('SELECT COUNT(*) as count FROM failures').get().count,
      open: db.prepare('SELECT COUNT(*) as count FROM failures WHERE status = "Open"').get().count,
      in_progress: db.prepare('SELECT COUNT(*) as count FROM failures WHERE status = "In Progress"').get().count,
      resolved: db.prepare('SELECT COUNT(*) as count FROM failures WHERE status = "Resolved"').get().count,
      by_priority: {
        critical: db.prepare('SELECT COUNT(*) as count FROM failures WHERE priority = "Critical" AND status != "Resolved"').get().count,
        high: db.prepare('SELECT COUNT(*) as count FROM failures WHERE priority = "High" AND status != "Resolved"').get().count,
        medium: db.prepare('SELECT COUNT(*) as count FROM failures WHERE priority = "Medium" AND status != "Resolved"').get().count,
        low: db.prepare('SELECT COUNT(*) as count FROM failures WHERE priority = "Low" AND status != "Resolved"').get().count
      }
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create failure
router.post('/', authenticate, (req, res) => {
  try {
    const {
      test_run_id,
      test_result_id,
      failure_type,
      priority = 'Medium',
      title,
      description,
      reproduction_steps
    } = req.body;

    const result = db.prepare(`
      INSERT INTO failures (
        test_run_id, test_result_id, failure_type, priority,
        title, description, reproduction_steps, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Open')
    `).run(
      test_run_id || null,
      test_result_id || null,
      failure_type,
      priority,
      title,
      description || null,
      reproduction_steps || null
    );

    ActivityLogger.log({
      user: req.user.username,
      action: 'create',
      resource: 'failure',
      status: 'success',
      metadata: { failure_id: result.lastInsertRowid, title, priority }
    });

    res.json({ id: result.lastInsertRowid, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update failure
router.put('/:id', authenticate, (req, res) => {
  try {
    const {
      status,
      priority,
      assigned_to,
      resolution_notes,
      title,
      description,
      reproduction_steps
    } = req.body;

    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (reproduction_steps !== undefined) {
      updates.push('reproduction_steps = ?');
      params.push(reproduction_steps);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
      if (status === 'Resolved') {
        updates.push('resolved_at = CURRENT_TIMESTAMP');
      }
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      params.push(priority);
    }
    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      params.push(assigned_to);
    }
    if (resolution_notes !== undefined) {
      updates.push('resolution_notes = ?');
      params.push(resolution_notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(req.params.id);
    const query = `UPDATE failures SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...params);

    ActivityLogger.log({
      user: req.user.username,
      action: 'update',
      resource: 'failure',
      status: 'success',
      metadata: { failure_id: req.params.id, updates: Object.keys(req.body) }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete failure
router.delete('/:id', authenticate, (req, res) => {
  try {
    db.prepare('DELETE FROM failures WHERE id = ?').run(req.params.id);

    ActivityLogger.log({
      user: req.user.username,
      action: 'delete',
      resource: 'failure',
      status: 'success',
      metadata: { failure_id: req.params.id }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
