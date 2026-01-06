/**
 * ExecutiveSummary Component
 * At-a-glance health overview for client dashboard
 *
 * Task: U1.2
 * Owner: Sally (UX Designer)
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import HealthScoreCard from './HealthScoreCard';
import './ExecutiveSummary.css';

const ExecutiveSummary = ({
  metrics = {},
  lastUpdated = null,
  onCardClick = null,
  loading = false
}) => {
  // Calculate overall health score from individual metrics
  const overallHealth = useMemo(() => {
    const scores = [
      metrics.performance?.score,
      metrics.seo?.score,
      metrics.accessibility?.score,
      metrics.smokeTests?.passRate,
      metrics.visualRegression?.score
    ].filter(s => s !== undefined && s !== null);

    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [metrics]);

  // Format relative time
  const formatLastUpdated = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const updated = new Date(date);
    const diffMs = now - updated;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Skeleton loader for cards
  const SkeletonCard = () => (
    <div className="executive-summary__skeleton">
      <div className="executive-summary__skeleton-ring" />
      <div className="executive-summary__skeleton-label" />
    </div>
  );

  const staggerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="executive-summary">
      {/* Header */}
      <div className="executive-summary__header">
        <div className="executive-summary__title-area">
          <h2 className="executive-summary__title">Site Health Overview</h2>
          <span className="executive-summary__last-updated">
            Updated {formatLastUpdated(lastUpdated)}
          </span>
        </div>
        <div className="executive-summary__overall">
          <span className="executive-summary__overall-label">Overall Health</span>
          <span
            className={`executive-summary__overall-score ${
              overallHealth >= 90 ? 'excellent' :
              overallHealth >= 70 ? 'good' :
              overallHealth >= 50 ? 'warning' : 'critical'
            }`}
          >
            {overallHealth}%
          </span>
        </div>
      </div>

      {/* Health Cards Grid */}
      <motion.div
        className="executive-summary__grid"
        variants={staggerVariants}
        initial="hidden"
        animate="visible"
      >
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <motion.div variants={cardVariants}>
              <HealthScoreCard
                score={metrics.performance?.score ?? 0}
                label="Performance"
                icon="⚡"
                trend={metrics.performance?.trend}
                trendLabel="vs last week"
                onClick={onCardClick ? () => onCardClick('performance') : null}
              />
            </motion.div>

            <motion.div variants={cardVariants}>
              <HealthScoreCard
                score={metrics.seo?.score ?? 0}
                label="SEO"
                icon="🔍"
                trend={metrics.seo?.trend}
                trendLabel="vs last week"
                onClick={onCardClick ? () => onCardClick('seo') : null}
              />
            </motion.div>

            <motion.div variants={cardVariants}>
              <HealthScoreCard
                score={metrics.accessibility?.score ?? 0}
                label="Accessibility"
                icon="♿"
                trend={metrics.accessibility?.trend}
                trendLabel="vs last week"
                onClick={onCardClick ? () => onCardClick('accessibility') : null}
              />
            </motion.div>

            <motion.div variants={cardVariants}>
              <HealthScoreCard
                score={metrics.smokeTests?.passRate ?? 0}
                label="Smoke Tests"
                icon="🧪"
                trend={metrics.smokeTests?.trend}
                trendLabel={`${metrics.smokeTests?.passed ?? 0}/${metrics.smokeTests?.total ?? 0} passing`}
                onClick={onCardClick ? () => onCardClick('smoke') : null}
              />
            </motion.div>

            <motion.div variants={cardVariants}>
              <HealthScoreCard
                score={metrics.visualRegression?.score ?? 0}
                label="Visual Stability"
                icon="🎨"
                trend={metrics.visualRegression?.trend}
                trendLabel={`${metrics.visualRegression?.diffs ?? 0} differences`}
                onClick={onCardClick ? () => onCardClick('visual') : null}
              />
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Quick Stats */}
      <div className="executive-summary__stats">
        <div className="executive-summary__stat">
          <span className="executive-summary__stat-value">
            {metrics.pagesMonitored ?? 0}
          </span>
          <span className="executive-summary__stat-label">Pages Monitored</span>
        </div>
        <div className="executive-summary__stat">
          <span className="executive-summary__stat-value">
            {metrics.testsRun24h ?? 0}
          </span>
          <span className="executive-summary__stat-label">Tests (24h)</span>
        </div>
        <div className="executive-summary__stat">
          <span className="executive-summary__stat-value">
            {metrics.issuesFound ?? 0}
          </span>
          <span className="executive-summary__stat-label">Issues Found</span>
        </div>
        <div className="executive-summary__stat">
          <span className="executive-summary__stat-value">
            {metrics.issuesResolved ?? 0}
          </span>
          <span className="executive-summary__stat-label">Resolved</span>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummary;
