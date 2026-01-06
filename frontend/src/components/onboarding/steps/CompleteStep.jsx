/**
 * CompleteStep Component
 * Final step - trigger initial tests and show success
 *
 * Task: P3.3
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CompleteStep = ({ data, onComplete }) => {
  const [runningInitialTests, setRunningInitialTests] = useState(true);
  const [testsComplete, setTestsComplete] = useState(false);
  const [testResults, setTestResults] = useState(null);

  // Trigger initial smoke test on mount
  useEffect(() => {
    const runInitialTests = async () => {
      if (!data.websiteId || !data.discovery.selectedPages.length) {
        setRunningInitialTests(false);
        setTestsComplete(true);
        return;
      }

      try {
        // Trigger initial smoke test
        const response = await fetch('/api/test/smoke/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            websiteId: data.websiteId,
            urls: data.discovery.selectedPages.slice(0, 5), // Test first 5 pages
            options: { quick: true }
          })
        });

        if (response.ok) {
          const result = await response.json();
          setTestResults(result);
        }
      } catch (err) {
        console.error('Initial test failed:', err);
      } finally {
        setRunningInitialTests(false);
        setTestsComplete(true);
      }
    };

    runInitialTests();
  }, [data.websiteId, data.discovery.selectedPages]);

  return (
    <div className="onboarding-step complete-step">
      <motion.div
        className="complete-step__icon"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
      >
        {runningInitialTests ? '⏳' : '🎉'}
      </motion.div>

      <motion.h2
        className="step-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {runningInitialTests ? 'Running Initial Tests...' : 'You\'re All Set!'}
      </motion.h2>

      <motion.p
        className="step-description"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {runningInitialTests
          ? 'We\'re running a quick smoke test on your site to make sure everything is working.'
          : 'Your website is now being monitored. Here\'s what happens next:'}
      </motion.p>

      {/* Running indicator */}
      {runningInitialTests && (
        <motion.div
          className="initial-test-progress"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="test-progress-spinner" />
          <p>Testing {data.website.url}...</p>
        </motion.div>
      )}

      {/* Success content */}
      {testsComplete && (
        <motion.div
          className="complete-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* Summary */}
          <div className="setup-summary">
            <div className="summary-item">
              <span className="summary-icon">🌐</span>
              <div className="summary-details">
                <strong>{data.website.name}</strong>
                <span>{data.website.url}</span>
              </div>
            </div>

            <div className="summary-item">
              <span className="summary-icon">📄</span>
              <div className="summary-details">
                <strong>{data.discovery.selectedPages.length} Pages</strong>
                <span>Being monitored</span>
              </div>
            </div>

            <div className="summary-item">
              <span className="summary-icon">📅</span>
              <div className="summary-details">
                <strong>Scheduled Tests</strong>
                <span>
                  {Object.values(data.schedule).filter(s => s.enabled).length} test types active
                </span>
              </div>
            </div>
          </div>

          {/* Test results if available */}
          {testResults && (
            <div className="initial-test-results">
              <h4>Initial Test Results</h4>
              <div className="test-results-summary">
                <div className="result-stat passed">
                  <span className="stat-value">{testResults.passed || 0}</span>
                  <span className="stat-label">Passed</span>
                </div>
                <div className="result-stat failed">
                  <span className="stat-value">{testResults.failed || 0}</span>
                  <span className="stat-label">Failed</span>
                </div>
                <div className="result-stat total">
                  <span className="stat-value">{testResults.total || 0}</span>
                  <span className="stat-label">Total</span>
                </div>
              </div>
            </div>
          )}

          {/* What's next */}
          <div className="whats-next">
            <h4>What's Next?</h4>
            <ul>
              <li>
                <span className="next-icon">📊</span>
                <span>View your dashboard for real-time test results</span>
              </li>
              <li>
                <span className="next-icon">⚙️</span>
                <span>Configure alert thresholds in Settings</span>
              </li>
              <li>
                <span className="next-icon">📧</span>
                <span>Set up email notifications for test failures</span>
              </li>
              <li>
                <span className="next-icon">🔗</span>
                <span>Integrate with your CI/CD pipeline via webhooks</span>
              </li>
            </ul>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      {testsComplete && (
        <motion.div
          className="step-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={onComplete}
          >
            Go to Dashboard →
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default CompleteStep;
