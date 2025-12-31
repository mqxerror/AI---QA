import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './ActivityLogModal.css';

export default function ActivityLogModal({ isOpen, onClose, activity }) {
  if (!activity) return null;

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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Parse metadata if it's a string
  const metadata = typeof activity.metadata === 'string'
    ? JSON.parse(activity.metadata || '{}')
    : activity.metadata || {};

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="activity-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="activity-modal-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.3 }}
          >
            {/* Header */}
            <div className="activity-modal-header">
              <div className="activity-modal-title-wrapper">
                <span className="activity-action-icon">{getActionIcon(activity.action)}</span>
                <div>
                  <h2 className="activity-modal-title">
                    {activity.action && activity.action.charAt(0).toUpperCase() + activity.action.slice(1)} {activity.resource_type}
                  </h2>
                  <span className={`activity-status-badge ${getStatusBadge(activity.status)}`}>
                    {activity.status}
                  </span>
                </div>
              </div>
              <button className="activity-modal-close" onClick={onClose} aria-label="Close">
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="activity-modal-body">
              <div className="activity-details-grid">
                {/* Basic Info Section */}
                <div className="activity-detail-section">
                  <h3 className="activity-section-title">Basic Information</h3>
                  <div className="activity-detail-row">
                    <span className="activity-detail-label">Action</span>
                    <span className="activity-detail-value">{activity.action || 'N/A'}</span>
                  </div>
                  <div className="activity-detail-row">
                    <span className="activity-detail-label">Resource Type</span>
                    <span className="activity-detail-value">{activity.resource_type || 'N/A'}</span>
                  </div>
                  <div className="activity-detail-row">
                    <span className="activity-detail-label">Resource Name</span>
                    <span className="activity-detail-value">{activity.resource_name || 'N/A'}</span>
                  </div>
                  <div className="activity-detail-row">
                    <span className="activity-detail-label">Status</span>
                    <span className={`activity-detail-value ${getStatusBadge(activity.status)}`}>
                      {activity.status || 'N/A'}
                    </span>
                  </div>
                  {activity.description && (
                    <div className="activity-detail-row">
                      <span className="activity-detail-label">Description</span>
                      <span className="activity-detail-value">{activity.description}</span>
                    </div>
                  )}
                </div>

                {/* Metadata Section */}
                <div className="activity-detail-section">
                  <h3 className="activity-section-title">Metadata</h3>
                  {Object.keys(metadata).length > 0 ? (
                    Object.entries(metadata).map(([key, value]) => (
                      <div key={key} className="activity-detail-row">
                        <span className="activity-detail-label">{key}</span>
                        <span className="activity-detail-value">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="activity-detail-row">
                      <span className="activity-detail-value activity-no-data">No metadata available</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="activity-modal-footer">
              <div className="activity-modal-footer-info">
                <span className="activity-id">ID: {activity.id}</span>
                <span className="activity-timestamp">{formatDate(activity.created_at)}</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
