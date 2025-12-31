import db from '../database';
import type { Activity, ActivityWithMetadata, ActivityLogParams, ActivityStats } from '../types';

interface WebSocketServer {
  emitActivity: (activity: ActivityWithMetadata) => void;
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
 * Central activity logging service
 * Tracks all user actions, API calls, and system events
 */
class ActivityLogger {
  /**
   * Log an activity
   */
  static log({ user = 'system', action, resource, status, metadata = {} }: ActivityLogParams): boolean {
    try {
      const metadataString = JSON.stringify(metadata);

      const result = db.prepare(`
        INSERT INTO activities (user, action, resource, status, metadata)
        VALUES (?, ?, ?, ?, ?)
      `).run(user, action, resource, status, metadataString);

      // Emit real-time update
      const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(result.lastInsertRowid) as Activity | undefined;
      if (activity) {
        getWsServer().emitActivity({
          ...activity,
          metadata // Use original object instead of stringified version
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to log activity:', error);
      return false;
    }
  }

  /**
   * Get recent activities with optional filtering
   */
  static getActivities(options: {
    limit?: number;
    user?: string;
    action?: string;
    resource?: string;
    status?: 'success' | 'error' | 'running' | 'pending';
  } = {}): ActivityWithMetadata[] {
    try {
      const { limit = 50, user, action, resource, status } = options;

      let query = 'SELECT * FROM activities WHERE 1=1';
      const params: (string | number)[] = [];

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

      const activities = db.prepare(query).all(...params) as Activity[];

      // Parse metadata JSON
      return activities.map(activity => ({
        ...activity,
        metadata: activity.metadata ? JSON.parse(activity.metadata) : {}
      }));
    } catch (error) {
      console.error('Failed to get activities:', error);
      return [];
    }
  }

  /**
   * Get activity statistics
   */
  static getStats(): ActivityStats | null {
    try {
      const stats: ActivityStats = {
        total: (db.prepare('SELECT COUNT(*) as count FROM activities').get() as { count: number }).count,
        today: (db.prepare(`
          SELECT COUNT(*) as count FROM activities
          WHERE DATE(created_at) = DATE('now')
        `).get() as { count: number }).count,
        by_status: db.prepare(`
          SELECT status, COUNT(*) as count
          FROM activities
          GROUP BY status
        `).all() as { status: string; count: number }[],
        recent_actions: db.prepare(`
          SELECT action, COUNT(*) as count
          FROM activities
          WHERE created_at > datetime('now', '-24 hours')
          GROUP BY action
          ORDER BY count DESC
          LIMIT 5
        `).all() as { action: string; count: number }[]
      };

      return stats;
    } catch (error) {
      console.error('Failed to get activity stats:', error);
      return null;
    }
  }

  /**
   * Cleanup old activities (retention policy)
   */
  static cleanup(days: number = 30): number {
    try {
      const result = db.prepare(`
        DELETE FROM activities
        WHERE created_at < datetime('now', '-' || ? || ' days')
      `).run(days);

      console.log(`🧹 Cleaned up ${result.changes} old activities`);
      return result.changes;
    } catch (error) {
      console.error('Failed to cleanup activities:', error);
      return 0;
    }
  }
}

export default ActivityLogger;
