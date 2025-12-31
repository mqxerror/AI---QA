"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../database"));
let wsServer = null;
// Lazy load to avoid circular dependency
const getWsServer = () => {
    if (!wsServer) {
        wsServer = require('../websocket').default;
    }
    return wsServer;
};
/**
 * Process monitoring service
 * Tracks running tests and long-running operations
 */
class ProcessMonitor {
    /**
     * Start tracking a new process
     */
    static start({ process_type, metadata = {} }) {
        try {
            const metadataString = JSON.stringify(metadata);
            const result = database_1.default.prepare(`
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
        }
        catch (error) {
            console.error('Failed to start process monitoring:', error);
            return null;
        }
    }
    /**
     * Update process progress
     */
    static updateProgress(processId, progress) {
        try {
            const clampedProgress = Math.min(100, Math.max(0, progress));
            database_1.default.prepare(`
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
        }
        catch (error) {
            console.error('Failed to update process progress:', error);
            return false;
        }
    }
    /**
     * Complete a process
     */
    static complete(processId, status = 'completed', output_path = null) {
        try {
            database_1.default.prepare(`
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
        }
        catch (error) {
            console.error('Failed to complete process:', error);
            return false;
        }
    }
    /**
     * Fail a process
     */
    static fail(processId, errorMessage) {
        try {
            // Get existing metadata
            const process = database_1.default.prepare('SELECT metadata FROM processes WHERE id = ?').get(processId);
            const metadata = process ? JSON.parse(process.metadata || '{}') : {};
            metadata.error = errorMessage;
            database_1.default.prepare(`
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
        }
        catch (error) {
            console.error('Failed to mark process as failed:', error);
            return false;
        }
    }
    /**
     * Get all processes with optional filtering
     */
    static getProcesses(options = {}) {
        try {
            const { limit = 50, status, process_type } = options;
            let query = 'SELECT * FROM processes WHERE 1=1';
            const params = [];
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
            const processes = database_1.default.prepare(query).all(...params);
            // Parse metadata JSON
            return processes.map(process => ({
                ...process,
                metadata: process.metadata ? JSON.parse(process.metadata) : {}
            }));
        }
        catch (error) {
            console.error('Failed to get processes:', error);
            return [];
        }
    }
    /**
     * Get running processes
     */
    static getRunning() {
        return this.getProcesses({ status: 'running' });
    }
    /**
     * Get process by ID
     */
    static getProcess(processId) {
        try {
            const process = database_1.default.prepare('SELECT * FROM processes WHERE id = ?').get(processId);
            if (!process)
                return null;
            return {
                ...process,
                metadata: process.metadata ? JSON.parse(process.metadata) : {}
            };
        }
        catch (error) {
            console.error('Failed to get process:', error);
            return null;
        }
    }
    /**
     * Get process statistics
     */
    static getStats() {
        try {
            const stats = {
                running: database_1.default.prepare('SELECT COUNT(*) as count FROM processes WHERE status = ?').get('running').count,
                completed: database_1.default.prepare('SELECT COUNT(*) as count FROM processes WHERE status = ?').get('completed').count,
                failed: database_1.default.prepare('SELECT COUNT(*) as count FROM processes WHERE status = ?').get('failed').count,
                total: database_1.default.prepare('SELECT COUNT(*) as count FROM processes').get().count,
                by_type: database_1.default.prepare(`
          SELECT process_type, COUNT(*) as count
          FROM processes
          WHERE started_at > datetime('now', '-7 days')
          GROUP BY process_type
        `).all()
            };
            return stats;
        }
        catch (error) {
            console.error('Failed to get process stats:', error);
            return null;
        }
    }
    /**
     * Cleanup old completed/failed processes
     */
    static cleanup(days = 30) {
        try {
            const result = database_1.default.prepare(`
        DELETE FROM processes
        WHERE status IN ('completed', 'failed')
        AND completed_at < datetime('now', '-' || ? || ' days')
      `).run(days);
            console.log(`🧹 Cleaned up ${result.changes} old processes`);
            return result.changes;
        }
        catch (error) {
            console.error('Failed to cleanup processes:', error);
            return 0;
        }
    }
}
exports.default = ProcessMonitor;
//# sourceMappingURL=ProcessMonitor.js.map