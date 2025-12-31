import { useState, useEffect } from 'react';
import api from '../services/api';
import { useActivityUpdates } from '../hooks/useRealtimeUpdates';
import { Activity, RefreshCw, Filter } from 'lucide-react';
import {
  AnimatedCounter,
  TextShimmer,
  ScrollReveal,
  FadeText,
  ShineButton
} from '../components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import ActivityLogModal from '../components/ActivityLogModal';
import './ActivityLog.css';

export default function ActivityLog() {
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    resource: '',
    status: '',
    limit: 100
  });
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Real-time updates via WebSocket
  useActivityUpdates((data) => {
    // Prepend new activity to the list
    setActivities(prevActivities => [data, ...prevActivities]);

    // Refresh stats
    fetchStats();
  }, []);

  useEffect(() => {
    fetchActivities();
    fetchStats();
  }, [filters]);

  const fetchActivities = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.action) params.append('action', filters.action);
      if (filters.resource) params.append('resource', filters.resource);
      if (filters.status) params.append('status', filters.status);
      params.append('limit', filters.limit);

      const response = await api.get(`/activities?${params}`);
      setActivities(response.data);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/activities/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      success: 'status-success',
      error: 'status-error',
      running: 'status-running',
      pending: 'status-pending',
      fail: 'status-error'
    };
    return badges[status] || 'status-default';
  };

  const getActionIcon = (action) => {
    const icons = {
      create: '➕',
      update: '✏️',
      delete: '🗑️',
      test: '🧪',
      login: '🔐',
      logout: '🚪'
    };
    return icons[action] || '📝';
  };

  const getStatusIcon = (status) => {
    const icons = {
      success: '✓',
      error: '✗',
      fail: '✗',
      running: '⏳',
      pending: '⚠'
    };
    return icons[status] || '•';
  };

  const handleStatClick = (statusFilter) => {
    setFilters({ ...filters, status: statusFilter });
  };

  const getTotalFailures = () => {
    if (!stats || !stats.by_status) return 0;
    const errorCount = stats.by_status.find(s => s.status === 'error')?.count || 0;
    const failCount = stats.by_status.find(s => s.status === 'fail')?.count || 0;
    return errorCount + failCount;
  };

  const getSuccessRate = () => {
    if (!stats || stats.total === 0) return 0;
    const successCount = stats.by_status?.find(s => s.status === 'success')?.count || 0;
    return Math.round((successCount / stats.total) * 100);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleViewActivity = (activity) => {
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedActivity(null);
  };

  if (loading) return <div className="loading">Loading activities...</div>;

  return (
    <div className="activity-log" style={{ position: 'relative' }}>
      <div className="activity-header">
        <FadeText direction="down">
          <div>
            <TextShimmer className="activity-title-shimmer">
              <h1>Activity Log</h1>
            </TextShimmer>
            <p>Real-time system activities and user actions</p>
          </div>
        </FadeText>
        <button onClick={fetchActivities} className="refresh-btn">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {stats && (
        <div className="stats-row">
          <div
            className="stat-card clickable"
            onClick={() => setFilters({ ...filters, status: '' })}
          >
            <div className="stat-value">
              <AnimatedCounter value={stats.total || 0} />
            </div>
            <div className="stat-label">Total Activities</div>
          </div>

          <div
            className="stat-card clickable"
            onClick={() => setFilters({ ...filters, status: '' })}
          >
            <div className="stat-value">
              <AnimatedCounter value={stats.today || 0} />
            </div>
            <div className="stat-label">Today</div>
          </div>

          <div
            className="stat-card stat-success clickable"
            onClick={() => handleStatClick('success')}
          >
            <div className="stat-value">
              <AnimatedCounter value={stats.by_status?.find(s => s.status === 'success')?.count || 0} />
            </div>
            <div className="stat-label">Success</div>
            <div className="stat-progress">
              <div className="progress-bar" style={{ width: `${getSuccessRate()}%` }}></div>
            </div>
            <div className="stat-meta">{getSuccessRate()}% rate</div>
          </div>

          <div
            className="stat-card stat-failure clickable"
            onClick={() => handleStatClick('error')}
          >
            <div className="stat-value">
              <AnimatedCounter value={getTotalFailures()} />
            </div>
            <div className="stat-label">Failures</div>
            <div className="stat-meta">
              {stats.by_status?.find(s => s.status === 'fail')?.count || 0} Fail + {stats.by_status?.find(s => s.status === 'error')?.count || 0} Error
            </div>
          </div>

          {stats.by_status?.find(s => s.status === 'running')?.count > 0 && (
            <div
              className="stat-card stat-running clickable"
              onClick={() => handleStatClick('running')}
            >
              <div className="stat-value">
                <AnimatedCounter value={stats.by_status.find(s => s.status === 'running')?.count || 0} />
                <span className="live-indicator"></span>
              </div>
              <div className="stat-label">Running</div>
              <div className="stat-meta">Live</div>
            </div>
          )}

          {stats.by_status?.find(s => s.status === 'pending')?.count > 0 && (
            <div
              className="stat-card stat-pending clickable"
              onClick={() => handleStatClick('pending')}
            >
              <div className="stat-value">
                <AnimatedCounter value={stats.by_status.find(s => s.status === 'pending')?.count || 0} />
              </div>
              <div className="stat-label">Pending</div>
            </div>
          )}
        </div>
      )}

      <div className="filters-bar">
        <div className="filters-inline">
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          >
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="test">Test</option>
          </select>

          <select
            value={filters.resource}
            onChange={(e) => setFilters({ ...filters, resource: e.target.value })}
          >
            <option value="">All Resources</option>
            <option value="website">Website</option>
            <option value="smoke_test">Smoke Test</option>
            <option value="performance_test">Performance Test</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
            <option value="fail">Fail</option>
            <option value="running">Running</option>
          </select>

          <select
            value={filters.limit}
            onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
          >
            <option value="50">Last 50</option>
            <option value="100">Last 100</option>
            <option value="200">Last 200</option>
            <option value="500">Last 500</option>
          </select>
        </div>
        <span className="activities-count">{activities.length} {activities.length === 1 ? 'activity' : 'activities'}</span>
      </div>

      <div className="activities-table-container card">
        {activities.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Activity size={48} />
            </div>
            <p>No activity logs yet</p>
            <p className="text-muted">Activity logs will appear here as you perform actions like running tests, adding websites, or managing configurations</p>
          </div>
        ) : (
          <table className="activities-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>Status</th>
                <th>Test Type</th>
                <th>Website</th>
                <th>User</th>
                <th>Time</th>
                <th style={{ width: '80px' }}>Duration</th>
                <th style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity, index) => (
                <motion.tr
                  key={activity.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={`activity-row ${getStatusBadge(activity.status)}`}
                >
                  <td className="status-cell">
                    <span className={`status-icon ${getStatusBadge(activity.status)}`}>
                      {getStatusIcon(activity.status)}
                    </span>
                  </td>
                  <td>
                    <span className="resource-text">{activity.resource || activity.action}</span>
                  </td>
                  <td>
                    <span className="website-name">
                      {activity.metadata?.website_name || activity.metadata?.name || '—'}
                    </span>
                  </td>
                  <td>
                    <span className="user-text">{activity.user || 'system'}</span>
                  </td>
                  <td className="time-cell">
                    {formatDate(activity.created_at)}
                  </td>
                  <td className="duration-cell">
                    {activity.metadata?.duration ? `${activity.metadata.duration}s` : '—'}
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn-view-details"
                      onClick={() => handleViewActivity(activity)}
                    >
                      View
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ActivityLogModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        activity={selectedActivity}
      />
    </div>
  );
}
