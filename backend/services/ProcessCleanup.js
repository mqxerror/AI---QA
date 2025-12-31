const db = require('../database').default;

/**
 * Cleanup service for stuck processes
 * Marks processes as failed if they've been running for too long
 */
class ProcessCleanup {
  /**
   * Mark stuck processes as failed
   * @param {number} timeoutMinutes - Processes running longer than this are considered stuck
   * @returns {number} Number of processes cleaned up
   */
  static cleanupStuckProcesses(timeoutMinutes = 10) {
    try {
      // Find processes that have been running for more than timeout minutes
      const stuckProcesses = db.prepare(`
        SELECT * FROM processes
        WHERE status = 'running'
        AND datetime(started_at) < datetime('now', '-' || ? || ' minutes')
      `).all(timeoutMinutes);

      if (stuckProcesses.length === 0) {
        return 0;
      }

      // Mark them as failed
      const updateStmt = db.prepare(`
        UPDATE processes
        SET status = 'failed',
            completed_at = CURRENT_TIMESTAMP,
            metadata = json_set(
              COALESCE(metadata, '{}'),
              '$.error',
              'Process timed out after ' || ? || ' minutes'
            )
        WHERE id = ?
      `);

      let cleaned = 0;
      for (const process of stuckProcesses) {
        updateStmt.run(timeoutMinutes, process.id);
        cleaned++;
        console.log(`⚠️  Marked stuck process #${process.id} (${process.process_type}) as failed`);
      }

      return cleaned;
    } catch (error) {
      console.error('Failed to cleanup stuck processes:', error);
      return 0;
    }
  }

  /**
   * Start periodic cleanup (runs every 5 minutes)
   */
  static startPeriodicCleanup(intervalMinutes = 5, timeoutMinutes = 10) {
    console.log(`🧹 Starting periodic process cleanup (every ${intervalMinutes}min, timeout ${timeoutMinutes}min)`);

    // Run immediately
    this.cleanupStuckProcesses(timeoutMinutes);

    // Then run periodically
    setInterval(() => {
      const cleaned = this.cleanupStuckProcesses(timeoutMinutes);
      if (cleaned > 0) {
        console.log(`🧹 Cleaned up ${cleaned} stuck process(es)`);
      }
    }, intervalMinutes * 60 * 1000);
  }
}

module.exports = ProcessCleanup;
