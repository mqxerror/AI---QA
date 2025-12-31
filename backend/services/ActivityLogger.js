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
 * Central activity logging service
 * Tracks all user actions, API calls, and system events
 */
class ActivityLogger {
    /**
     * Log an activity
     */
    static log({ user = 'system', action, resource, status, metadata = {} }) {
        try {
            const metadataString = JSON.stringify(metadata);
            const result = database_1.default.prepare(`
        INSERT INTO activities (user, action, resource, status, metadata)
        VALUES (?, ?, ?, ?, ?)
      `).run(user, action, resource, status, metadataString);
            // Emit real-time update
            const activity = database_1.default.prepare('SELECT * FROM activities WHERE id = ?').get(result.lastInsertRowid);
            if (activity) {
                getWsServer().emitActivity({
                    ...activity,
                    metadata // Use original object instead of stringified version
                });
            }
            return true;
        }
        catch (error) {
            console.error('Failed to log activity:', error);
            return false;
        }
    }
    /**
     * Get recent activities with optional filtering
     */
    static getActivities(options = {}) {
        try {
            const { limit = 50, user, action, resource, status } = options;
            let query = 'SELECT * FROM activities WHERE 1=1';
            const params = [];
            if (user) {
                query += ' AND user = ?';
                params.push(user);
            }
            if (action) {
                query += ' AND action = ?';
                params.push(action);
            }
            if (resource) {
                query += ' AND resource = ?';
                params.push(resource);
            }
            if (status) {
                query += ' AND status = ?';
                params.push(status);
            }
            query += ' ORDER BY created_at DESC LIMIT ?';
            params.push(limit);
            const activities = database_1.default.prepare(query).all(...params);
            // Parse metadata JSON
            return activities.map(activity => ({
                ...activity,
                metadata: activity.metadata ? JSON.parse(activity.metadata) : {}
            }));
        }
        catch (error) {
            console.error('Failed to get activities:', error);
            return [];
        }
    }
    /**
     * Get activity statistics
     */
    static getStats() {
        try {
            const stats = {
                total: database_1.default.prepare('SELECT COUNT(*) as count FROM activities').get().count,
                today: database_1.default.prepare(`
          SELECT COUNT(*) as count FROM activities
          WHERE DATE(created_at) = DATE('now')
        `).get().count,
                by_status: database_1.default.prepare(`
          SELECT status, COUNT(*) as count
          FROM activities
          GROUP BY status
        `).all(),
                recent_actions: database_1.default.prepare(`
          SELECT action, COUNT(*) as count
          FROM activities
          WHERE created_at > datetime('now', '-24 hours')
          GROUP BY action
          ORDER BY count DESC
          LIMIT 5
        `).all()
            };
            return stats;
        }
        catch (error) {
            console.error('Failed to get activity stats:', error);
            return null;
        }
    }
    /**
     * Cleanup old activities (retention policy)
     */
    static cleanup(days = 30) {
        try {
            const result = database_1.default.prepare(`
        DELETE FROM activities
        WHERE created_at < datetime('now', '-' || ? || ' days')
      `).run(days);
            console.log(`🧹 Cleaned up ${result.changes} old activities`);
            return result.changes;
        }
        catch (error) {
            console.error('Failed to cleanup activities:', error);
            return 0;
        }
    }
}
exports.default = ActivityLogger;
//# sourceMappingURL=ActivityLogger.js.map