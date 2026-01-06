/**
 * ScheduleStep Component
 * Configure test schedule preferences
 *
 * Task: P3.2
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const TEST_TYPES = [
  {
    id: 'smoke',
    label: 'Smoke Tests',
    description: 'Quick checks to verify all pages load correctly',
    icon: '🧪',
    recommended: 'daily'
  },
  {
    id: 'lighthouse',
    label: 'Performance Audits',
    description: 'Lighthouse scores for performance, SEO, accessibility',
    icon: '⚡',
    recommended: 'daily'
  },
  {
    id: 'visualRegression',
    label: 'Visual Regression',
    description: 'Screenshot comparisons to catch UI changes',
    icon: '🎨',
    recommended: 'weekly'
  },
  {
    id: 'discovery',
    label: 'Page Discovery',
    description: 'Find new pages added to your site',
    icon: '🔍',
    recommended: 'monthly'
  }
];

const FREQUENCY_OPTIONS = [
  { value: 'hourly', label: 'Every Hour', description: 'For critical apps' },
  { value: 'daily', label: 'Daily', description: 'Recommended for most sites' },
  { value: 'weekly', label: 'Weekly', description: 'Good for stable sites' },
  { value: 'monthly', label: 'Monthly', description: 'Minimal monitoring' }
];

const ScheduleStep = ({ data, updateData, goNext, goBack }) => {
  const [schedule, setSchedule] = useState(data.schedule || {
    smoke: { enabled: true, frequency: 'daily' },
    lighthouse: { enabled: true, frequency: 'daily' },
    visualRegression: { enabled: true, frequency: 'weekly' },
    discovery: { enabled: true, frequency: 'monthly' }
  });

  // Toggle test type enabled
  const toggleEnabled = (testId) => {
    setSchedule(prev => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        enabled: !prev[testId].enabled
      }
    }));
  };

  // Update frequency
  const updateFrequency = (testId, frequency) => {
    setSchedule(prev => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        frequency
      }
    }));
  };

  // Continue to next step
  const handleContinue = async () => {
    updateData('schedule', schedule);

    // Save schedule to API
    if (data.websiteId) {
      try {
        await fetch(`/api/scheduler/website/${data.websiteId}/initialize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config: schedule })
        });
      } catch (err) {
        console.error('Failed to save schedule:', err);
      }
    }

    goNext();
  };

  // Use recommended settings
  const useRecommended = () => {
    const recommended = {};
    TEST_TYPES.forEach(test => {
      recommended[test.id] = {
        enabled: true,
        frequency: test.recommended
      };
    });
    setSchedule(recommended);
  };

  return (
    <div className="onboarding-step schedule-step">
      <motion.h2
        className="step-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Set Your Testing Schedule
      </motion.h2>

      <motion.p
        className="step-description"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        Choose how often each test type should run. You can adjust these settings anytime.
      </motion.p>

      <motion.button
        className="btn btn-text use-recommended"
        onClick={useRecommended}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        ✨ Use Recommended Settings
      </motion.button>

      <motion.div
        className="schedule-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {TEST_TYPES.map((test, index) => (
          <motion.div
            key={test.id}
            className={`schedule-card ${schedule[test.id]?.enabled ? 'enabled' : 'disabled'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <div className="schedule-card__header">
              <div className="schedule-card__toggle">
                <button
                  className={`toggle-btn ${schedule[test.id]?.enabled ? 'on' : 'off'}`}
                  onClick={() => toggleEnabled(test.id)}
                >
                  <span className="toggle-slider" />
                </button>
              </div>
              <span className="schedule-card__icon">{test.icon}</span>
              <h3 className="schedule-card__title">{test.label}</h3>
            </div>

            <p className="schedule-card__description">{test.description}</p>

            {schedule[test.id]?.enabled && (
              <div className="schedule-card__frequency">
                <label>Run frequency:</label>
                <div className="frequency-options">
                  {FREQUENCY_OPTIONS.map(freq => (
                    <button
                      key={freq.value}
                      className={`frequency-btn ${
                        schedule[test.id]?.frequency === freq.value ? 'selected' : ''
                      } ${freq.value === test.recommended ? 'recommended' : ''}`}
                      onClick={() => updateFrequency(test.id, freq.value)}
                      title={freq.description}
                    >
                      {freq.label}
                      {freq.value === test.recommended && (
                        <span className="recommended-badge">★</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Summary */}
      <motion.div
        className="schedule-summary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <h4>Schedule Summary</h4>
        <ul>
          {TEST_TYPES.filter(t => schedule[t.id]?.enabled).map(test => (
            <li key={test.id}>
              {test.icon} {test.label}: <strong>{schedule[test.id]?.frequency}</strong>
            </li>
          ))}
          {TEST_TYPES.filter(t => !schedule[t.id]?.enabled).length === TEST_TYPES.length && (
            <li className="no-tests">No tests scheduled</li>
          )}
        </ul>
      </motion.div>

      {/* Actions */}
      <div className="step-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={goBack}
        >
          ← Back
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleContinue}
        >
          Finish Setup →
        </button>
      </div>
    </div>
  );
};

export default ScheduleStep;
