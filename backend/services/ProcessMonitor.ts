import db from '../database';
import type { Process, ProcessWithMetadata, ProcessMonitorStartParams, ProcessStats } from '../types';

interface WebSocketServer {
  emitProcessCreated: (process: ProcessWithMetadata) => void;
  emitProcessUpdate: (process: ProcessWithMetadata) => void;
  emitProcessCompleted: (process: ProcessWithMetadata) => void;
  emitProcessFailed: (process: ProcessWithMetadata) => void;
}

let wsServer: WebSocketServer | null = null;

// Lazy load to avoid circular dependency
const getWsServer = (): WebSocketServer => {
  if (!wsServer) {
    wsServer = require('../websocket').default;
  }
  return wsServer!;
};

/**
 * Process monitoring service
 * Tracks running tests and long-running operations
 */
class ProcessMonitor {
  /**
   * Start tracking a new process
   */
  static start({ process_type, metadata = {} }: ProcessMonitorStartParams): number | null {
    try {
      const metadataString = JSON.stringify(metadata);

      const result = db.prepare(`
        INSERT INTO processes (process_type, status, progress, metadata)
        VALUES (?, 'running', 0, ?)
      `).run(process_type, metadataString);

      const processId = Number(result.lastInsertRowid);

      // Emit real-time update
      const process = this.getProcess(processId);
      if (process) {
        getWsServer().emitProcessCreated(process);
      }

      return processId;
    } catch (error) {
      console.error('Failed to start process monitoring:', error);
      return null;
    }
  }

  /**
   * Update process progress
   */
  static updateProgress(processId: number, progress: number): boolean {
    try {
      const clampedProgress = Math.min(100, Math.max(0, progress));

      db.prepare(`
        UPDATE processes
        SET progress = ?
        WHERE id = ?
      `).run(clampedProgress, processId);

      // Emit real-time update
      const process = this.getProcess(processId);
      if (process) {
        getWsServer().emitProcessUpdate(process);
      }

      return true;
    } catch (error) {
      console.error('Failed to update process progress:', error);
      return false;
    }
  }

  /**
   * Complete a process
   */
  static complete(processId: number, status: 'completed' | 'failed' = 'completed', output_path: string | null = null): boolean {
    try {
      db.prepare(`
        UPDATE processes
        SET status = ?, progress = 100, completed_at = CURRENT_TIMESTAMP, output_path = ?
        WHERE id = ?
      `).run(status, output_path, processId);

      // Emit real-time update
      const process = this.getProcess(processId);
      if (process) {
        getWsServer().emitProcessCompleted(process);
      }

      return true;
    } catch (error) {
      console.error('Failed to complete process:', error);
      return false;
    }
  }

  /**
   * Fail a process
   */
  static fail(processId: number, errorMessage: string): boolean {
    try {
      // Get existing metadata
      const process = db.prepare('SELECT metadata FROM processes WHERE id = ?').get(processId) as Process | undefined;
      const metadata = process ? JSON.parse(process.metadata || '{}') : {};
      metadata.error = errorMessage;

      db.prepare(`
        UPDATE processes
        SET status = 'failed', completed_at = CURRENT_TIMESTAMP, metadata = ?
        WHERE id = ?
      `).run(JSON.stringify(metadata), processId);

      // Emit real-time update
      const updatedProcess = this.getProcess(processId);
      if (updatedProcess) {
        getWsServer().emitProcessFailed(updatedProcess);
      }

      return true;
    } catch (error) {
      console.error('Failed to mark process as failed:', error);
      return false;
    }
  }

  /**
   * Get all processes with optional filtering
   */
  static getProcesses(options: {
    limit?: number;
    status?: 'running' | 'completed' | 'failed';
    process_type?: string;
  } = {}): ProcessWithMetadata[] {
    try {
      const { limit = 50, status, process_type } = options;

      let query = 'SELECT * FROM processes WHERE 1=1';
      const params: (string | number)[] = [];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      if (process_type) {
        query += ' AND process_type = ?';
        params.push(process_type);
      }

      query += ' ORDER BY started_at DESC LIMIT ?';
      params.push(limit);

      const processes = db.prepare(query).all(...params) as Process[];

      // Parse metadata JSON
      return processes.map(process => ({
        ...process,
        metadata: process.metadata ? JSON.parse(process.metadata) : {}
      }));
    } catch (error) {
      console.error('Failed to get processes:', error);
      return [];
    }
  }

  /**
   * Get running processes
   */
  static getRunning(): ProcessWithMetadata[] {
    return this.getProcesses({ status: 'running' });
  }

  /**
   * Get process by ID
   */
  static getProcess(processId: number): ProcessWithMetadata | null {
    try {
      const process = db.prepare('SELECT * FROM processes WHERE id = ?').get(processId) as Process | undefined;
      if (!process) return null;

      return {
        ...process,
        metadata: process.metadata ? JSON.parse(process.metadata) : {}
      };
    } catch (error) {
      console.error('Failed to get process:', error);
      return null;
    }
  }

  /**
   * Get process statistics
   */
  static getStats(): ProcessStats | null {
    try {
      const stats: ProcessStats = {
        running: (db.prepare('SELECT COUNT(*) as count FROM processes WHERE status = ?').get('running') as { count: number }).count,
        completed: (db.prepare('SELECT COUNT(*) as count FROM processes WHERE status = ?').get('completed') as { count: number }).count,
        failed: (db.prepare('SELECT COUNT(*) as count FROM processes WHERE status = ?').get('failed') as { count: number }).count,
        total: (db.prepare('SELECT COUNT(*) as count FROM processes').get() as { count: number }).count,
        by_type: db.prepare(`
          SELECT process_type, COUNT(*) as count
          FROM processes
          WHERE started_at > datetime('now', '-7 days')
          GROUP BY process_type
        `).all() as { process_type: string; count: number }[]
      };

      return stats;
    } catch (error) {
      console.error('Failed to get process stats:', error);
      return null;
    }
  }

  /**
   * Cleanup old completed/failed processes
   */
  static cleanup(days: number = 30): number {
    try {
      const result = db.prepare(`
        DELETE FROM processes
        WHERE status IN ('completed', 'failed')
        AND completed_at < datetime('now', '-' || ? || ' days')
      `).run(days);

      console.log(`🧹 Cleaned up ${result.changes} old processes`);
      return result.changes;
    } catch (error) {
      console.error('Failed to cleanup processes:', error);
      return 0;
    }
  }
}

export default ProcessMonitor;
