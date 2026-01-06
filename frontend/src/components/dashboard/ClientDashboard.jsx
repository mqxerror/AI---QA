/**
 * ClientDashboard Component
 * Main client-facing dashboard with simplified view toggle
 *
 * Task: U1.1, U1.2
 * Owner: Sally (UX Designer)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ExecutiveSummary from './ExecutiveSummary';
import './ClientDashboard.css';

const ClientDashboard = ({
  websiteId,
  websiteUrl,
  initialView = 'client',
  onViewChange = null,
  showViewToggle = true
}) => {
  const [viewMode, setViewMode] = useState(initialView);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  // Fetch dashboard metrics
  const fetchMetrics = useCallback(async () => {
    if (!websiteId) return;

    setLoading(true);
    try {
      // Fetch latest test results and compute metrics
      const response = await fetch(`/api/dashboard/${websiteId}/summary`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics || {});
        setLastUpdated(data.lastUpdated);
        setRecentActivity(data.recentActivity || []);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [websiteId]);

  useEffect(() => {
    fetchMetrics();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  // Handle view mode change
  const handleViewChange = (mode) => {
    setViewMode(mode);
    onViewChange?.(mode);
  };

  // Handle card click to show details
  const handleCardClick = (category) => {
    setSelectedCategory(category);
  };

  // Get status color class
  const getStatusClass = (status) => {
    switch (status) {
      case 'passed':
      case 'success':
        return 'status--success';
      case 'failed':
      case 'error':
        return 'status--error';
      case 'warning':
        return 'status--warning';
      default:
        return 'status--neutral';
    }
  };

  return (
    <div className={`client-dashboard client-dashboard--${viewMode}`}>
      {/* Header */}
      <header className="client-dashboard__header">
        <div className="client-dashboard__info">
          <h1 className="client-dashboard__title">
            {websiteUrl || 'Dashboard'}
          </h1>
          <span className="client-dashboard__website-id">
            Site ID: {websiteId}
          </span>
        </div>

        {/* View Toggle */}
        {showViewToggle && (
          <div className="client-dashboard__view-toggle">
            <button
              className={`client-dashboard__toggle-btn ${viewMode === 'client' ? 'active' : ''}`}
              onClick={() => handleViewChange('client')}
              title="Client View - Simplified health overview"
            >
              <span className="toggle-icon">📊</span>
              <span className="toggle-label">Client View</span>
            </button>
            <button
              className={`client-dashboard__toggle-btn ${viewMode === 'technical' ? 'active' : ''}`}
              onClick={() => handleViewChange('technical')}
              title="Technical View - Detailed test results"
            >
              <span className="toggle-icon">🔧</span>
              <span className="toggle-label">Technical View</span>
            </button>
          </div>
        )}

        {/* Refresh Button */}
        <button
          className="client-dashboard__refresh-btn"
          onClick={fetchMetrics}
          disabled={loading}
          title="Refresh data"
        >
          <motion.span
            animate={loading ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: 'linear' }}
          >
            ↻
          </motion.span>
        </button>
      </header>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'client' ? (
          <motion.div
            key="client-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="client-dashboard__content"
          >
            {/* Executive Summary */}
            <ExecutiveSummary
              metrics={metrics}
              lastUpdated={lastUpdated}
              onCardClick={handleCardClick}
              loading={loading}
            />

            {/* Recent Activity */}
            <section className="client-dashboard__activity">
              <h3 className="client-dashboard__section-title">Recent Activity</h3>
              <div className="client-dashboard__activity-list">
                {recentActivity.length === 0 ? (
                  <p className="client-dashboard__empty">
                    No recent activity. Tests will appear here after they run.
                  </p>
                ) : (
                  recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={activity.id || index} className="client-dashboard__activity-item">
                      <span className={`client-dashboard__activity-status ${getStatusClass(activity.status)}`}>
                        {activity.status === 'passed' ? '✓' : activity.status === 'failed' ? '✗' : '●'}
                      </span>
                      <span className="client-dashboard__activity-type">{activity.type}</span>
                      <span className="client-dashboard__activity-message">{activity.message}</span>
                      <span className="client-dashboard__activity-time">{activity.time}</span>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Next Scheduled Tests */}
            <section className="client-dashboard__schedule">
              <h3 className="client-dashboard__section-title">Upcoming Tests</h3>
              <div className="client-dashboard__schedule-list">
                <div className="client-dashboard__schedule-item">
                  <span className="schedule-icon">🧪</span>
                  <span className="schedule-type">Smoke Tests</span>
                  <span className="schedule-time">Tomorrow 6:00 AM</span>
                </div>
                <div className="client-dashboard__schedule-item">
                  <span className="schedule-icon">⚡</span>
                  <span className="schedule-type">Lighthouse Audit</span>
                  <span className="schedule-time">Tomorrow 6:00 AM</span>
                </div>
                <div className="client-dashboard__schedule-item">
                  <span className="schedule-icon">🎨</span>
                  <span className="schedule-type">Visual Regression</span>
                  <span className="schedule-time">Saturday 2:00 AM</span>
                </div>
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="technical-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="client-dashboard__content client-dashboard__content--technical"
          >
            {/* Technical view shows detailed test results */}
            <p className="client-dashboard__placeholder">
              Technical view shows detailed test results, logs, and configuration options.
              This view is for agency/developer use.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Detail Modal */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            className="client-dashboard__modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCategory(null)}
          >
            <motion.div
              className="client-dashboard__modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="client-dashboard__modal-header">
                <h3>{selectedCategory} Details</h3>
                <button
                  className="client-dashboard__modal-close"
                  onClick={() => setSelectedCategory(null)}
                >
                  ✕
                </button>
              </div>
              <div className="client-dashboard__modal-content">
                <p>Detailed {selectedCategory} metrics and history will appear here.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientDashboard;
