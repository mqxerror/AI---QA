import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './TestModal.css'

const testTypes = [
  {
    id: 'smoke',
    name: 'Smoke Test',
    description: 'Quick health check to verify basic functionality and critical paths',
    duration: '3-5s',
    tool: 'Playwright',
    icon: '🚀',
    color: '#3b82f6',
    category: 'Quick Tests'
  },
  {
    id: 'accessibility',
    name: 'Accessibility Test',
    description: 'WCAG 2.1 compliance check for screen readers and keyboard navigation',
    duration: '10-15s',
    tool: 'Axe-core',
    icon: '♿',
    color: '#10b981',
    category: 'Quick Tests'
  },
  {
    id: 'performance',
    name: 'Performance Test',
    description: 'Lighthouse audit for load time, FCP, LCP, and Core Web Vitals',
    duration: '30-60s',
    tool: 'Lighthouse',
    icon: '⚡',
    color: '#f59e0b',
    category: 'Performance & Analysis'
  },
  {
    id: 'load',
    name: 'Load Test',
    description: 'Stress test with concurrent users to measure capacity and response',
    duration: '60-90s',
    tool: 'K6',
    icon: '📊',
    color: '#8b5cf6',
    category: 'Performance & Analysis'
  },
  {
    id: 'security',
    name: 'Security Scan',
    description: 'OWASP vulnerability scan for XSS, SQL injection, and security headers',
    duration: '45-60s',
    tool: 'ZAP',
    icon: '🔒',
    color: '#ef4444',
    category: 'Performance & Analysis'
  },
  {
    id: 'seo',
    name: 'SEO Audit',
    description: 'Meta tags, structured data, sitemap, and search engine optimization',
    duration: '20-30s',
    tool: 'Lighthouse',
    icon: '🔍',
    color: '#06b6d4',
    category: 'Performance & Analysis'
  },
  {
    id: 'visual',
    name: 'Visual Regression',
    description: 'Screenshot comparison to detect unintended visual changes',
    duration: '15-25s',
    tool: 'Percy/BackstopJS',
    icon: '📸',
    color: '#ec4899',
    category: 'Advanced Tests'
  },
  {
    id: 'pixel',
    name: 'Pixel Perfect Audit',
    description: 'Design precision check comparing against reference mockups',
    duration: '20-30s',
    tool: 'BackstopJS',
    icon: '🎨',
    color: '#14b8a6',
    category: 'Advanced Tests'
  }
]

export default function TestModal({ isOpen, onClose, websiteId, websiteName, websiteUrl, runningTests, onRunTest }) {
  if (!isOpen) return null

  const categories = [...new Set(testTypes.map(t => t.category))]

  const handleTestClick = (testId) => {
    onRunTest(testId, websiteId)
    // Don't close modal - let user run multiple tests
  }

  const handleRunAllTests = () => {
    // Run all tests sequentially
    testTypes.forEach(test => {
      onRunTest(test.id, websiteId)
    })
  }

  const isAnyTestRunning = runningTests && runningTests.size > 0
  const totalRunningTests = runningTests ? runningTests.size : 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="modal-container"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
          >
            <div className="modal-header">
              <div>
                <h2>
                  Run Quality Tests
                  {totalRunningTests > 0 && (
                    <span className="total-running-badge">{totalRunningTests} Running</span>
                  )}
                </h2>
                <p>
                  {websiteName && (
                    <>
                      <strong style={{ color: '#3b82f6' }}>{websiteName}</strong>
                      {' '}
                    </>
                  )}
                  {websiteUrl && (
                    <span style={{ color: '#6b7280' }}>({websiteUrl})</span>
                  )}
                  {!websiteName && !websiteUrl && 'Select a test to run on this website'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  className="btn-run-all"
                  onClick={handleRunAllTests}
                  disabled={isAnyTestRunning}
                  aria-label="Run all tests"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  Run All Tests
                </button>
                <button className="modal-close" onClick={onClose} aria-label="Close modal">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="modal-body">
              {categories.map((category) => (
                <div key={category} className="test-category">
                  <h3 className="category-title">{category}</h3>
                  <div className="test-grid">
                    {testTypes
                      .filter((test) => test.category === category)
                      .map((test) => {
                        const isRunning = runningTests?.has(`${test.id}-${websiteId}`)

                        // Count how many of this test type are running across all websites
                        const runningCount = runningTests ?
                          Array.from(runningTests).filter(key => key.startsWith(`${test.id}-`)).length : 0

                        return (
                          <motion.button
                            key={test.id}
                            className={`test-card ${isRunning ? 'running' : ''}`}
                            onClick={() => handleTestClick(test.id)}
                            disabled={isRunning}
                            whileHover={{ scale: 1.02, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            style={{ '--test-color': test.color }}
                          >
                            <div className="test-card-header">
                              <span className="test-icon">{test.icon}</span>
                              <span className="test-duration">{test.duration}</span>
                            </div>
                            <h4 className="test-name">{test.name}</h4>
                            <p className="test-description">{test.description}</p>
                            <div className="test-footer">
                              <span className="test-tool">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                                </svg>
                                {test.tool}
                              </span>
                              {runningCount > 0 && (
                                <span className="running-indicator">
                                  <span className="spinner"></span>
                                  <span className="queue-badge">{runningCount}</span>
                                  Running...
                                </span>
                              )}
                            </div>
                          </motion.button>
                        )
                      })}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <p className="modal-footer-text">
                💡 Click any test card to run it immediately • Tests run independently • You can run multiple tests at once
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
