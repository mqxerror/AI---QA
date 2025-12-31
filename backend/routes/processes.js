const express = require('express');
const router = express.Router();
const ProcessMonitor = require('../services/ProcessMonitor').default || require('../services/ProcessMonitor');

/**
 * GET /api/processes
 * Get processes with optional filtering
 */
router.get('/', (req, res) => {
  try {
    const { limit, status, process_type } = req.query;

    const processes = ProcessMonitor.getProcesses({
      limit: limit ? parseInt(limit) : 50,
      status,
      process_type
    });

    res.json(processes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/processes/running
 * Get all running processes
 */
router.get('/running', (req, res) => {
  try {
    const processes = ProcessMonitor.getRunning();
    res.json(processes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/processes/stats
 * Get process statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = ProcessMonitor.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/processes/:id
 * Get single process by ID
 */
router.get('/:id', (req, res) => {
  try {
    const process = ProcessMonitor.getProcess(parseInt(req.params.id));
    if (!process) {
      return res.status(404).json({ error: 'Process not found' });
    }
    res.json(process);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
