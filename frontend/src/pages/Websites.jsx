import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWebsites, createWebsite, deleteWebsite, runSmokeTest, runPerformanceTest, runPixelAudit, runLoadTest, runAccessibilityTest, runSecurityScan, runSEOAudit, runVisualRegression } from '../services/api'
import { Play, Trash2, Plus, Globe, Briefcase, Code2, RefreshCw, TrendingUp, CheckCircle, XCircle, Clock, Activity, X, Link2, Calendar, Zap } from 'lucide-react'
import {
  TextShimmer,
  FadeText,
  ScrollReveal
} from '../components/ui'
import { useToast } from '../contexts/ToastContext'
import TestDrawer from '../components/TestDrawer'
import './Websites.css'

function Websites() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [viewMode, setViewMode] = useState('executive')
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', url: '', protocol: 'https://', test_frequency: 'Manual' })
  const [runningTests, setRunningTests] = useState(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedWebsiteId, setSelectedWebsiteId] = useState(null)

  const { data: websites = [], isLoading, refetch } = useQuery({
    queryKey: ['websites'],
    queryFn: () => getWebsites().then(res => res.data),
    refetchInterval: 10000
  })

  // Calculate stats
  const stats = useMemo(() => {
    const total = websites.length
    const active = websites.filter(w => w.status === 'Active').length
    const totalTests = websites.reduce((sum, w) => sum + (w.total_tests || 0), 0)
    const passed = websites.filter(w => w.last_result === 'Pass').length
    const failed = websites.filter(w => w.last_result === 'Fail').length
    const untested = websites.filter(w => !w.last_result).length
    const passRate = (passed + failed) > 0 ? Math.round((passed / (passed + failed)) * 100) : 0

    return { total, active, totalTests, passed, failed, untested, passRate }
  }, [websites])

  const createMutation = useMutation({
    mutationFn: (data) => {
      // Combine protocol and URL
      const fullUrl = data.protocol + data.url.replace(/^(https?:\/\/)/i, '');
      return createWebsite({ ...data, url: fullUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['websites'])
      setShowAddForm(false)
      setFormData({ name: '', url: '', protocol: 'https://', test_frequency: 'Manual' })
      toast.success('Website added successfully!')
    },
    onError: (error) => {
      toast.error('Failed to add website: ' + getErrorMessage(error))
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWebsite,
    onSuccess: () => {
      queryClient.invalidateQueries(['websites'])
      toast.success('Website deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete website: ' + getErrorMessage(error))
    }
  })

  const getErrorMessage = (error) => {
    return error.response?.data?.error || error.response?.data?.message || error.message || 'An unexpected error occurred';
  }

  const handleRunSmokeTest = async (websiteId) => {
    setRunningTests(prev => new Set(prev).add(`smoke-${websiteId}`))
    try {
      await runSmokeTest(websiteId)
      queryClient.invalidateQueries(['websites'])
      queryClient.invalidateQueries(['test-runs'])
      queryClient.invalidateQueries(['stats'])
      toast.success('Smoke test completed successfully!')
    } catch (error) {
      toast.error('Test failed: ' + getErrorMessage(error))
    } finally {
      setRunningTests(prev => {
        const next = new Set(prev)
        next.delete(`smoke-${websiteId}`)
        return next
      })
    }
  }

  const handleRunPerformanceTest = async (websiteId) => {
    setRunningTests(prev => new Set(prev).add(`perf-${websiteId}`))
    try {
      await runPerformanceTest(websiteId)
      queryClient.invalidateQueries(['websites'])
      queryClient.invalidateQueries(['test-runs'])
      queryClient.invalidateQueries(['stats'])
    } catch (error) {
      toast.error('Test failed: ' + getErrorMessage(error))
    } finally {
      setRunningTests(prev => {
        const next = new Set(prev)
        next.delete(`perf-${websiteId}`)
        return next
      })
    }
  }

  const handleRunPixelAudit = async (websiteId) => {
    setRunningTests(prev => new Set(prev).add(`pixel-${websiteId}`))
    try {
      await runPixelAudit(websiteId)
      queryClient.invalidateQueries(['websites'])
      queryClient.invalidateQueries(['test-runs'])
      queryClient.invalidateQueries(['stats'])
    } catch (error) {
      toast.error('Test failed: ' + getErrorMessage(error))
    } finally {
      setRunningTests(prev => {
        const next = new Set(prev)
        next.delete(`pixel-${websiteId}`)
        return next
      })
    }
  }

  const handleRunLoadTest = async (websiteId) => {
    setRunningTests(prev => new Set(prev).add(`load-${websiteId}`))
    try {
      await runLoadTest(websiteId, 10, 30)
      queryClient.invalidateQueries(['websites'])
      queryClient.invalidateQueries(['test-runs'])
      queryClient.invalidateQueries(['stats'])
    } catch (error) {
      toast.error('Test failed: ' + getErrorMessage(error))
    } finally {
      setRunningTests(prev => {
        const next = new Set(prev)
        next.delete(`load-${websiteId}`)
        return next
      })
    }
  }

  const handleRunAccessibilityTest = async (websiteId) => {
    setRunningTests(prev => new Set(prev).add(`a11y-${websiteId}`))
    try {
      await runAccessibilityTest(websiteId)
      queryClient.invalidateQueries(['websites'])
      queryClient.invalidateQueries(['test-runs'])
      queryClient.invalidateQueries(['stats'])
    } catch (error) {
      toast.error('Test failed: ' + getErrorMessage(error))
    } finally {
      setRunningTests(prev => {
        const next = new Set(prev)
        next.delete(`a11y-${websiteId}`)
        return next
      })
    }
  }

  const handleRunSecurityScan = async (websiteId) => {
    setRunningTests(prev => new Set(prev).add(`security-${websiteId}`))
    try {
      await runSecurityScan(websiteId)
      queryClient.invalidateQueries(['websites'])
      queryClient.invalidateQueries(['test-runs'])
      queryClient.invalidateQueries(['stats'])
    } catch (error) {
      toast.error('Test failed: ' + getErrorMessage(error))
    } finally {
      setRunningTests(prev => {
        const next = new Set(prev)
        next.delete(`security-${websiteId}`)
        return next
      })
    }
  }

  const handleRunSEOAudit = async (websiteId) => {
    setRunningTests(prev => new Set(prev).add(`seo-${websiteId}`))
    try {
      await runSEOAudit(websiteId)
      queryClient.invalidateQueries(['websites'])
      queryClient.invalidateQueries(['test-runs'])
      queryClient.invalidateQueries(['stats'])
    } catch (error) {
      toast.error('Test failed: ' + getErrorMessage(error))
    } finally {
      setRunningTests(prev => {
        const next = new Set(prev)
        next.delete(`seo-${websiteId}`)
        return next
      })
    }
  }

  const handleRunVisualRegression = async (websiteId) => {
    const createBaseline = confirm('Create new baseline images? (Click Cancel to compare against existing baseline)')
    setRunningTests(prev => new Set(prev).add(`visual-${websiteId}`))
    try {
      await runVisualRegression(websiteId, createBaseline)
      queryClient.invalidateQueries(['websites'])
      queryClient.invalidateQueries(['test-runs'])
      queryClient.invalidateQueries(['stats'])
    } catch (error) {
      toast.error('Test failed: ' + getErrorMessage(error))
    } finally {
      setRunningTests(prev => {
        const next = new Set(prev)
        next.delete(`visual-${websiteId}`)
        return next
      })
    }
  }

  const handleRunTest = async (testType, websiteId) => {
    const testHandlers = {
      'smoke': handleRunSmokeTest,
      'accessibility': handleRunAccessibilityTest,
      'performance': handleRunPerformanceTest,
      'load': handleRunLoadTest,
      'security': handleRunSecurityScan,
      'seo': handleRunSEOAudit,
      'visual': handleRunVisualRegression,
      'pixel': handleRunPixelAudit
    }

    const handler = testHandlers[testType]
    if (handler) {
      await handler(websiteId)
    }
  }

  const openModal = (website) => {
    setSelectedWebsiteId(website.id)
    setModalOpen(true)
  }

  // Get preview initials
  const getInitials = (name) => {
    if (!name) return 'WS'
    return name.substring(0, 2).toUpperCase()
  }

  if (isLoading) return <div className="loading">Loading websites...</div>

  return (
    <div className="websites-page">
      {/* Header */}
      <div className="page-header">
        <FadeText direction="down">
          <div>
            <TextShimmer className="title-shimmer">
              <h1>Websites</h1>
            </TextShimmer>
            <p>Manage and test your websites</p>
          </div>
        </FadeText>
        <div className="header-actions">
          <div className="view-mode-toggle">
            <button
              onClick={() => setViewMode('executive')}
              className={`view-mode-btn ${viewMode === 'executive' ? 'active' : ''}`}
            >
              <Briefcase size={16} />
              Executive
            </button>
            <button
              onClick={() => setViewMode('technical')}
              className={`view-mode-btn ${viewMode === 'technical' ? 'active' : ''}`}
            >
              <Code2 size={16} />
              Technical
            </button>
          </div>
          <button onClick={() => refetch()} className="refresh-btn">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="add-btn" onClick={() => setShowAddForm(true)}>
            <Plus size={16} />
            Add Website
          </button>
        </div>
      </div>

      {/* Executive View - KPIs */}
      {viewMode === 'executive' && (
        <div className="executive-view">
          <ScrollReveal delay={0.1} direction="up">
            <div className="kpi-grid">
              <div className="kpi-card primary">
                <div className="kpi-icon"><Globe size={24} /></div>
                <div className="kpi-content">
                  <div className="kpi-value">{stats.total}</div>
                  <div className="kpi-label">Total Websites</div>
                  <div className="kpi-meta">{stats.active} active</div>
                </div>
              </div>
              <div className="kpi-card success">
                <div className="kpi-icon success"><TrendingUp size={24} /></div>
                <div className="kpi-content">
                  <div className="kpi-value">{stats.passRate}%</div>
                  <div className="kpi-label">Pass Rate</div>
                  <div className="kpi-meta">{stats.passed} passing</div>
                </div>
                <div className="kpi-progress">
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${stats.passRate}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="kpi-card danger">
                <div className="kpi-icon danger"><XCircle size={24} /></div>
                <div className="kpi-content">
                  <div className="kpi-value">{stats.failed}</div>
                  <div className="kpi-label">Failing</div>
                  <div className="kpi-meta">{stats.untested} untested</div>
                </div>
              </div>
              <div className="kpi-card info">
                <div className="kpi-icon info"><Activity size={24} /></div>
                <div className="kpi-content">
                  <div className="kpi-value">{stats.totalTests}</div>
                  <div className="kpi-label">Total Tests</div>
                  <div className="kpi-meta">All time</div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      )}

      {/* Technical View - Compact Stats */}
      {viewMode === 'technical' && (
        <div className="technical-view">
          <ScrollReveal delay={0.1} direction="up">
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Websites</div>
              </div>
              <div className="stat-card stat-success">
                <div className="stat-value">{stats.passed}</div>
                <div className="stat-label">Passing</div>
              </div>
              <div className="stat-card stat-failure">
                <div className="stat-value">{stats.failed}</div>
                <div className="stat-label">Failing</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.totalTests}</div>
                <div className="stat-label">Tests Run</div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      )}

      {/* Add Website Drawer */}
      {showAddForm && (
        <>
          <div className="drawer-backdrop" onClick={() => setShowAddForm(false)} />
          <div className="add-website-drawer">
            <div className="drawer-header">
              <div className="drawer-title">
                <div className="drawer-icon">
                  <Plus size={20} />
                </div>
                <div>
                  <h3>Add New Website</h3>
                  <p>Set up monitoring for a new website</p>
                </div>
              </div>
              <button className="drawer-close" onClick={() => setShowAddForm(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="drawer-body">
              {/* Live Preview Card */}
              <div className="preview-card">
                <div className="preview-avatar">
                  {getInitials(formData.name)}
                </div>
                <div className="preview-info">
                  <div className="preview-name">{formData.name || 'Website Name'}</div>
                  <div className="preview-url">
                    {formData.protocol}{formData.url || 'example.com'}
                  </div>
                </div>
                <div className="preview-status">
                  <span className="status-dot"></span>
                  Active
                </div>
              </div>

              {/* Form Fields */}
              <div className="drawer-form">
                <div className="form-field">
                  <label>
                    <Globe size={14} />
                    Website Name
                  </label>
                  <input
                    type="text"
                    placeholder="My Awesome Website"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <span className="field-hint">A friendly name to identify this website</span>
                </div>

                <div className="form-field">
                  <label>
                    <Link2 size={14} />
                    Website URL
                  </label>
                  <div className="url-field">
                    <select
                      className="protocol-dropdown"
                      value={formData.protocol}
                      onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                    >
                      <option value="https://">https://</option>
                      <option value="http://">http://</option>
                    </select>
                    <input
                      type="text"
                      placeholder="www.example.com"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value.replace(/^(https?:\/\/)/i, '') })}
                    />
                  </div>
                  <span className="field-hint">Enter the full URL without the protocol</span>
                </div>

                <div className="form-field">
                  <label>
                    <Calendar size={14} />
                    Test Schedule
                  </label>
                  <div className="schedule-options">
                    {['Manual', 'Daily', 'Weekly'].map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        className={`schedule-btn ${formData.test_frequency === freq ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, test_frequency: freq })}
                      >
                        {freq === 'Manual' && <Zap size={14} />}
                        {freq === 'Daily' && <Clock size={14} />}
                        {freq === 'Weekly' && <Calendar size={14} />}
                        {freq}
                      </button>
                    ))}
                  </div>
                  <span className="field-hint">How often should automated tests run?</span>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="drawer-tips">
                <div className="tip-title">Quick Tips</div>
                <ul>
                  <li>Use HTTPS for secure sites (recommended)</li>
                  <li>Include www if your site uses it</li>
                  <li>Daily tests help catch issues early</li>
                </ul>
              </div>
            </div>

            <div className="drawer-footer">
              <button className="btn-secondary" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => createMutation.mutate(formData)}
                disabled={!formData.name || !formData.url || createMutation.isLoading}
              >
                {createMutation.isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Add Website
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Websites Table */}
      <ScrollReveal delay={0.2} direction="up">
        <div className="websites-table-container">
          {websites.length === 0 ? (
            <div className="empty-state">
              <Globe size={48} />
              <p>No websites yet</p>
              <p className="text-muted">Add your first website to start testing</p>
              <button className="btn-add-first" onClick={() => setShowAddForm(true)}>
                <Plus size={16} /> Add Website
              </button>
            </div>
          ) : (
            <table className="websites-table">
              <thead>
                <tr>
                  <th>Website</th>
                  <th>Status</th>
                  <th>Last Result</th>
                  <th>Tests</th>
                  <th>Last Tested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {websites.map((website) => (
                  <tr key={website.id}>
                    <td>
                      <div className="website-info">
                        <span className="website-avatar">
                          {website.name.substring(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <div className="website-name">{website.name}</div>
                          <div className="website-url">{website.url}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${website.status === 'Active' ? 'active' : 'inactive'}`}>
                        {website.status}
                      </span>
                    </td>
                    <td>
                      {website.last_result ? (
                        <span className={`result-badge ${website.last_result === 'Pass' ? 'pass' : 'fail'}`}>
                          {website.last_result === 'Pass' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          {website.last_result}
                        </span>
                      ) : (
                        <span className="result-badge untested">Not tested</span>
                      )}
                    </td>
                    <td>
                      <span className="tests-count">{website.total_tests || 0}</span>
                    </td>
                    <td className="time-cell">
                      {website.last_tested_at ? (
                        new Date(website.last_tested_at).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })
                      ) : (
                        'Never'
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn primary"
                          onClick={() => openModal(website)}
                          title="Run Tests"
                        >
                          <Play size={14} />
                          Run
                        </button>
                        <button
                          className="action-btn danger"
                          onClick={() => {
                            if (confirm(`Delete "${website.name}"?\n\nThis will permanently remove the website and all its test history.`)) {
                              deleteMutation.mutate(website.id)
                            }
                          }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </ScrollReveal>

      <TestDrawer
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        websiteId={selectedWebsiteId}
        websiteName={websites?.find(w => w.id === selectedWebsiteId)?.name}
        websiteUrl={websites?.find(w => w.id === selectedWebsiteId)?.url}
        runningTests={runningTests}
        onRunTest={handleRunTest}
      />
    </div>
  )
}

export default Websites
