import { useState } from 'react'
import {
  IconX,
  IconRocket,
  IconAccessible,
  IconBolt,
  IconChartBar,
  IconShield,
  IconSeo,
  IconPhoto,
  IconPalette,
  IconPlayerPlay,
  IconLoader2
} from '@tabler/icons-react'
import './TestDrawer.css'

const testTypes = [
  {
    id: 'smoke',
    name: 'Smoke Test',
    description: 'Quick health check - verify basic functionality and critical paths',
    duration: '3-5s',
    tool: 'Playwright',
    icon: IconRocket,
    color: '#3b82f6',
    category: 'Quick Tests'
  },
  {
    id: 'accessibility',
    name: 'Accessibility Test',
    description: 'WCAG 2.1 AA compliance - screen readers and keyboard navigation',
    duration: '10-15s',
    tool: 'Axe-core',
    icon: IconAccessible,
    color: '#10b981',
    category: 'Quick Tests'
  },
  {
    id: 'performance',
    name: 'Performance Test',
    description: 'Lighthouse audit - load time, FCP, LCP, and Core Web Vitals',
    duration: '30-60s',
    tool: 'Lighthouse',
    icon: IconBolt,
    color: '#f59e0b',
    category: 'Performance'
  },
  {
    id: 'load',
    name: 'Load Test',
    description: 'Stress test with concurrent users - capacity and response time',
    duration: '60-90s',
    tool: 'K6',
    icon: IconChartBar,
    color: '#8b5cf6',
    category: 'Performance'
  },
  {
    id: 'security',
    name: 'Security Scan',
    description: 'OWASP vulnerability scan - XSS, SQL injection, security headers',
    duration: '45-60s',
    tool: 'ZAP',
    icon: IconShield,
    color: '#ef4444',
    category: 'Security'
  },
  {
    id: 'seo',
    name: 'SEO Audit',
    description: 'Meta tags, structured data, sitemap, and search optimization',
    duration: '20-30s',
    tool: 'Lighthouse',
    icon: IconSeo,
    color: '#06b6d4',
    category: 'SEO'
  },
  {
    id: 'visual',
    name: 'Visual Regression',
    description: 'Screenshot comparison - detect unintended visual changes',
    duration: '15-25s',
    tool: 'Percy/BackstopJS',
    icon: IconPhoto,
    color: '#ec4899',
    category: 'Visual'
  },
  {
    id: 'pixel',
    name: 'Pixel Perfect Audit',
    description: 'Design precision check - compare against reference mockups',
    duration: '20-30s',
    tool: 'BackstopJS',
    icon: IconPalette,
    color: '#14b8a6',
    category: 'Visual'
  }
]

export default function TestDrawer({ isOpen, onClose, websiteId, websiteName, websiteUrl, runningTests, onRunTest }) {
  const [selectedCategory, setSelectedCategory] = useState('all')

  if (!isOpen) return null

  const categories = ['all', ...new Set(testTypes.map(t => t.category))]

  const filteredTests = selectedCategory === 'all'
    ? testTypes
    : testTypes.filter(t => t.category === selectedCategory)

  const handleTestClick = (testId) => {
    onRunTest(testId, websiteId)
  }

  const handleRunAllTests = () => {
    testTypes.forEach(test => {
      onRunTest(test.id, websiteId)
    })
  }

  const totalRunning = runningTests ? runningTests.size : 0

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop fade show" onClick={onClose}></div>

      {/* Offcanvas Drawer */}
      <div className="offcanvas offcanvas-end show" tabIndex="-1" style={{ visibility: 'visible', width: '600px' }}>
        {/* Header */}
        <div className="offcanvas-header">
          <h3 className="offcanvas-title">
            <IconPlayerPlay size={24} className="me-2" style={{ color: 'var(--tblr-primary)' }} />
            Run Quality Tests
            {totalRunning > 0 && (
              <span className="badge bg-primary ms-2">{totalRunning} Running</span>
            )}
          </h3>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            aria-label="Close"
          ></button>
        </div>

        {/* Website Info */}
        <div className="offcanvas-body p-0">
          <div className="alert alert-info mx-3 mt-3 mb-0" style={{ background: 'rgba(var(--tblr-primary-rgb), 0.1)', border: '1px solid rgba(var(--tblr-primary-rgb), 0.2)' }}>
            <div className="d-flex align-items-center">
              <div>
                <strong className="text-primary">{websiteName}</strong>
                <div className="text-muted small">{websiteUrl}</div>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="px-3 pt-3 pb-2">
            <div className="btn-group w-100" role="group">
              {categories.map(category => (
                <button
                  key={category}
                  type="button"
                  className={`btn btn-sm ${selectedCategory === category ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === 'all' ? 'All Tests' : category}
                </button>
              ))}
            </div>
          </div>

          {/* Test Cards */}
          <div className="px-3 pb-3" style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
            <div className="row g-3 mt-1">
              {filteredTests.map(test => {
                const isRunning = runningTests?.has(`${test.id}-${websiteId}`)
                const Icon = test.icon
                const runningCount = runningTests ?
                  Array.from(runningTests).filter(key => key.startsWith(`${test.id}-`)).length : 0

                return (
                  <div key={test.id} className="col-12">
                    <div
                      className={`card card-sm test-card ${isRunning ? 'test-card-running' : ''}`}
                      onClick={() => !isRunning && handleTestClick(test.id)}
                      style={{
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        borderLeft: `3px solid ${test.color}`,
                        transition: 'all 0.2s',
                        opacity: isRunning ? 0.7 : 1
                      }}
                    >
                      <div className="card-body">
                        <div className="d-flex align-items-start">
                          <div
                            className="avatar avatar-sm me-3"
                            style={{
                              background: `${test.color}20`,
                              color: test.color
                            }}
                          >
                            <Icon size={20} />
                          </div>
                          <div className="flex-fill">
                            <div className="d-flex justify-content-between align-items-start mb-1">
                              <h4 className="card-title mb-0">{test.name}</h4>
                              <span className="badge bg-muted text-muted-foreground">{test.duration}</span>
                            </div>
                            <p className="text-muted small mb-2">{test.description}</p>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="badge bg-azure-lt">
                                {test.tool}
                              </span>
                              {isRunning && (
                                <div className="d-flex align-items-center gap-1">
                                  <IconLoader2 size={16} className="icon-spin text-primary" />
                                  <span className="text-primary small fw-bold">Running...</span>
                                  {runningCount > 1 && (
                                    <span className="badge bg-primary">{runningCount}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="offcanvas-footer border-top p-3">
          <div className="d-flex gap-2">
            <button
              className="btn btn-primary flex-fill"
              onClick={handleRunAllTests}
              disabled={totalRunning > 0}
            >
              <IconPlayerPlay size={16} className="me-2" />
              Run All Tests ({testTypes.length})
            </button>
            <button className="btn btn-outline-secondary" onClick={onClose}>
              Close
            </button>
          </div>
          <div className="text-muted small mt-2 text-center">
            💡 Click any test to run it • Tests run independently
          </div>
        </div>
      </div>

      <style jsx>{`
        .icon-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .test-card:hover:not(.test-card-running) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .test-card-running {
          background: rgba(var(--tblr-primary-rgb), 0.03);
        }
      `}</style>
    </>
  )
}
