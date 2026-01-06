/**
 * HealthScoreCard Component
 * Displays a health/performance score with color-coded status
 *
 * Task: U1.2
 * Owner: Sally (UX Designer)
 */

import React from 'react';
import { motion } from 'framer-motion';
import './HealthScoreCard.css';

const HealthScoreCard = ({
  score,
  label,
  icon,
  trend = null,
  trendLabel = '',
  size = 'medium',
  onClick = null
}) => {
  // Determine status based on score
  const getStatus = (score) => {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'warning';
    return 'critical';
  };

  const status = getStatus(score);

  // Status icons
  const statusIcons = {
    excellent: '✓',
    good: '✓',
    warning: '⚠',
    critical: '✗'
  };

  // Trend indicators
  const getTrendIcon = (trend) => {
    if (trend > 0) return '↑';
    if (trend < 0) return '↓';
    return '→';
  };

  const getTrendClass = (trend) => {
    if (trend > 0) return 'trend-up';
    if (trend < 0) return 'trend-down';
    return 'trend-neutral';
  };

  return (
    <motion.div
      className={`health-score-card health-score-card--${size} health-score-card--${status} ${onClick ? 'health-score-card--clickable' : ''}`}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.02, y: -2 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Score Circle */}
      <div className="health-score-card__score-container">
        <svg className="health-score-card__ring" viewBox="0 0 100 100">
          {/* Background ring */}
          <circle
            className="health-score-card__ring-bg"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
          />
          {/* Score ring */}
          <circle
            className="health-score-card__ring-progress"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            strokeDasharray={`${(score / 100) * 283} 283`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="health-score-card__score-value">
          <span className="health-score-card__number">{score}</span>
          <span className="health-score-card__status-icon">{statusIcons[status]}</span>
        </div>
      </div>

      {/* Label */}
      <div className="health-score-card__label">
        {icon && <span className="health-score-card__icon">{icon}</span>}
        <span className="health-score-card__text">{label}</span>
      </div>

      {/* Trend */}
      {trend !== null && (
        <div className={`health-score-card__trend ${getTrendClass(trend)}`}>
          <span className="health-score-card__trend-icon">{getTrendIcon(trend)}</span>
          <span className="health-score-card__trend-value">
            {Math.abs(trend)}%
          </span>
          {trendLabel && (
            <span className="health-score-card__trend-label">{trendLabel}</span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default HealthScoreCard;
