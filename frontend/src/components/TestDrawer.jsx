import { useState } from 'react'
import {
  Rocket,
  Accessibility,
  Zap,
  BarChart3,
  Shield,
  Search,
  Camera,
  Palette,
  Play,
  X,
  Clock,
  Globe,
  ExternalLink,
  Loader2,
  CheckCircle
} from 'lucide-react'
import './TestDrawer.css'

const testTypes = [
  {
    id: 'smoke',
    name: 'Smoke',
    fullName: 'Smoke Test',
    description: 'Basic functionality check',
    duration: '~5s',
    tool: 'Playwright',
    icon: Rocket,
    color: '#3b82f6',
    bgColor: '#eff6ff',
    category: 'quick'
  },
  {
    id: 'accessibility',
    name: 'A11y',
    fullName: 'Accessibility Test',
    description: 'WCAG 2.1 AA compliance',
    duration: '~15s',
    tool: 'Axe-core',
    icon: Accessibility,
    color: '#10b981',
    bgColor: '#ecfdf5',
    category: 'quick'
  },
  {
    id: 'performance',
    name: 'Perf',
    fullName: 'Performance Test',
    description: 'Core Web Vitals & Lighthouse',
    duration: '~45s',
    tool: 'Lighthouse',
    icon: Zap,
    color: '#f59e0b',
    bgColor: '#fef3c7',
    category: 'performance'
  },
  {
    id: 'load',
    name: 'Load',
    fullName: 'Load Test',
    description: 'Stress test with VUs',
    duration: '~90s',
    tool: 'K6',
    icon: BarChart3,
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    category: 'performance'
  },
  {
    id: 'security',
    name: 'Security',
    fullName: 'Security Scan',
    description: 'OWASP vulnerabilities',
    duration: '~60s',
    tool: 'Custom',
    icon: Shield,
    color: '#ef4444',
    bgColor: '#fef2f2',
    category: 'security'
  },
  {
    id: 'seo',
    name: 'SEO',
    fullName: 'SEO Audit',
    description: 'Meta tags & structure',
    duration: '~25s',
    tool: 'Lighthouse',
    icon: Search,
    color: '#06b6d4',
    bgColor: '#ecfeff',
    category: 'seo'
  },
  {
    id: 'visual',
    name: 'Visual',
    fullName: 'Visual Regression',
    description: 'Screenshot comparison',
    duration: '~20s',
    tool: 'Playwright',
    icon: Camera,
    color: '#ec4899',
    bgColor: '#fdf2f8',
    category: 'visual'
  },
  {
    id: 'pixel',
    name: 'Pixel',
    fullName: 'Pixel Audit',
    description: 'Tracking pixels check',
    duration: '~25s',
    tool: 'Playwright',
    icon: Palette,
    color: '#14b8a6',
    bgColor: '#f0fdfa',
    category: 'visual'
  }
]

export default function TestDrawer({ isOpen, onClose, websiteId, websiteName, websiteUrl, runningTests, onRunTest }) {
  const [hoveredTest, setHoveredTest] = useState(null)

  if (!isOpen) return null

  const handleTestClick = (testId) => {
    onRunTest(testId, websiteId)
  }

  const handleRunAllTests = () => {
    testTypes.forEach(test => {
      onRunTest(test.id, websiteId)
    })
  }

  const totalRunning = runningTests ? runningTests.size : 0
  const completedTests = 0 // Could track this if needed

  return (
    <>
      {/* Backdrop */}
      <div className="test-drawer-backdrop" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="test-drawer">
        {/* Header */}
        <div className="test-drawer-header">
          <div className="header-content">
            <div className="header-icon">
              <Play size={20} />
            </div>
            <div className="header-text">
              <h2>Run Tests</h2>
              <p>Select tests to run on this website</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Website Info Card */}
        <div className="website-info-card">
          <div className="website-avatar">
            {websiteName?.substring(0, 2).toUpperCase() || 'WS'}
          </div>
          <div className="website-details">
            <h3>{websiteName || 'Website'}</h3>
            <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="website-link">
              <Globe size={12} />
              {websiteUrl}
              <ExternalLink size={12} />
            </a>
          </div>
          {totalRunning > 0 && (
            <div className="running-badge">
              <Loader2 size={14} className="spin" />
              {totalRunning} Running
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="test-stats">
          <div className="stat-item">
            <span className="stat-value">{testTypes.length}</span>
            <span className="stat-label">Available</span>
          </div>
          <div className="stat-item running">
            <span className="stat-value">{totalRunning}</span>
            <span className="stat-label">Running</span>
          </div>
          <div className="stat-item success">
            <span className="stat-value">{completedTests}</span>
            <span className="stat-label">Complete</span>
          </div>
        </div>

        {/* Test Grid */}
        <div className="test-grid-container">
          <div className="test-grid">
            {testTypes.map(test => {
              const isRunning = runningTests?.has(`${test.id}-${websiteId}`)
              const Icon = test.icon
              const isHovered = hoveredTest === test.id

              return (
                <button
                  key={test.id}
                  className={`test-card ${isRunning ? 'running' : ''} ${isHovered ? 'hovered' : ''}`}
                  onClick={() => !isRunning && handleTestClick(test.id)}
                  onMouseEnter={() => setHoveredTest(test.id)}
                  onMouseLeave={() => setHoveredTest(null)}
                  disabled={isRunning}
                  style={{
                    '--test-color': test.color,
                    '--test-bg': test.bgColor
                  }}
                >
                  <div className="test-card-icon" style={{ background: test.bgColor, color: test.color }}>
                    {isRunning ? <Loader2 size={20} className="spin" /> : <Icon size={20} />}
                  </div>
                  <div className="test-card-content">
                    <div className="test-card-name">{test.name}</div>
                    <div className="test-card-duration">
                      <Clock size={10} />
                      {test.duration}
                    </div>
                  </div>
                  {isRunning && <div className="test-card-progress" />}
                  {!isRunning && <div className="test-card-play"><Play size={14} /></div>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Hover Info Panel */}
        {hoveredTest && (
          <div className="hover-info">
            {(() => {
              const test = testTypes.find(t => t.id === hoveredTest)
              if (!test) return null
              return (
                <>
                  <div className="hover-info-header">
                    <strong>{test.fullName}</strong>
                    <span className="tool-badge">{test.tool}</span>
                  </div>
                  <p>{test.description}</p>
                </>
              )
            })()}
          </div>
        )}

        {/* Footer */}
        <div className="test-drawer-footer">
          <button
            className="run-all-btn"
            onClick={handleRunAllTests}
            disabled={totalRunning > 0}
          >
            {totalRunning > 0 ? (
              <>
                <Loader2 size={16} className="spin" />
                Tests Running...
              </>
            ) : (
              <>
                <Play size={16} />
                Run All Tests ({testTypes.length})
              </>
            )}
          </button>
          <button className="cancel-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </>
  )
}
