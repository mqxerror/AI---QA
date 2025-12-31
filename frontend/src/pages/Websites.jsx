import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWebsites, createWebsite, deleteWebsite, runSmokeTest, runPerformanceTest, runPixelAudit, runLoadTest, runAccessibilityTest, runSecurityScan, runSEOAudit, runVisualRegression } from '../services/api'
import { Play, Trash2, Plus, Globe } from 'lucide-react'
import {
  AnimatedCounter,
  TextGenerateEffect,
  ScrollReveal,
  FadeText,
  FlipWords
} from '../components/ui'
import TestModal from '../components/TestModal'
import './Websites.css'

function Websites() {
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', url: '', test_frequency: 'Manual' })
  const [runningTests, setRunningTests] = useState(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedWebsiteId, setSelectedWebsiteId] = useState(null)

  const { data: websites, isLoading } = useQuery({
    queryKey: ['websites'],
    queryFn: () => getWebsites().then(res => res.data),
    refetchInterval: 10000
  })

  const createMutation = useMutation({
    mutationFn: createWebsite,
    onSuccess: () => {
      queryClient.invalidateQueries(['websites'])
      setShowAddForm(false)
      setFormData({ name: '', url: '', test_frequency: 'Manual' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWebsite,
    onSuccess: () => queryClient.invalidateQueries(['websites'])
  })

  // Helper to extract error message from axios error
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
    } catch (error) {
      alert('Test failed: ' + getErrorMessage(error))
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
      alert('Test failed: ' + getErrorMessage(error))
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
      alert('Test failed: ' + getErrorMessage(error))
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
      await runLoadTest(websiteId, 10, 30) // 10 VUs, 30 seconds
      queryClient.invalidateQueries(['websites'])
      queryClient.invalidateQueries(['test-runs'])
      queryClient.invalidateQueries(['stats'])
    } catch (error) {
      alert('Test failed: ' + getErrorMessage(error))
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
      alert('Test failed: ' + getErrorMessage(error))
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
      alert('Test failed: ' + getErrorMessage(error))
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
      alert('Test failed: ' + getErrorMessage(error))
    } finally {
      setRunningTests(prev => {
        const next = new Set(prev)
        next.delete(`seo-${websiteId}`)
        return next
      })
    }
  }

  const handleRunVisualRegression = async (websiteId) => {
    // Ask if user wants to create baseline
    const createBaseline = confirm('Create new baseline images? (Click Cancel to compare against existing baseline)')

    setRunningTests(prev => new Set(prev).add(`visual-${websiteId}`))
    try {
      await runVisualRegression(websiteId, createBaseline)
      queryClient.invalidateQueries(['websites'])
      queryClient.invalidateQueries(['test-runs'])
      queryClient.invalidateQueries(['stats'])
    } catch (error) {
      alert('Test failed: ' + getErrorMessage(error))
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

  if (isLoading) return <div className="loading">Loading...</div>

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', position: 'relative', zIndex: 10 }}>
        <div>
          <TextGenerateEffect words="Websites" className="dashboard-title" />
          <FadeText direction="right">
            <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
              Manage and monitor your websites • <FlipWords words={["Run Tests", "Track Performance", "Ensure Quality"]} className="inline-flip" />
            </p>
          </FadeText>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={16} style={{ display: 'inline', marginRight: '5px' }} />
          Add Website
        </button>
      </div>

      {showAddForm && (
        <ScrollReveal delay={0.1} direction="up">
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">Add New Website</div>
            <div className="form-group">
              <label>Website Name</label>
              <input
                type="text"
                placeholder="Google"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>URL</label>
              <input
                type="url"
                placeholder="https://google.com"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Test Frequency</label>
              <select
                value={formData.test_frequency}
                onChange={(e) => setFormData({ ...formData, test_frequency: e.target.value })}
              >
                <option>Manual</option>
                <option>Daily</option>
                <option>Weekly</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-primary"
                onClick={() => createMutation.mutate(formData)}
                disabled={!formData.name || !formData.url}
              >
                Add Website
              </button>
              <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </ScrollReveal>
      )}

      <ScrollReveal delay={0.2} direction="up">
        <div className="card">
          {websites?.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Globe size={64} color="#10b981" />
              </div>
              <FadeText direction="up">
                <p>No websites yet. Add your first website to start testing.</p>
              </FadeText>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Website</th>
                  <th>Status</th>
                  <th>Last Result</th>
                  <th>Last Tested</th>
                  <th>Total Tests</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {websites?.map((website, idx) => (
                  <tr key={website.id}>
                    <td>
                      <strong>{website.name}</strong>
                      <br />
                      <small style={{ color: '#6b7280' }}>{website.url}</small>
                    </td>
                    <td>
                      <span className={`badge badge-${website.status === 'Active' ? 'success' : 'warning'}`}>
                        {website.status}
                      </span>
                    </td>
                    <td>
                      {website.last_result ? (
                        <span className={`badge badge-${website.last_result === 'Pass' ? 'success' : 'danger'}`}>
                          {website.last_result}
                        </span>
                      ) : (
                        <span style={{ color: '#6b7280' }}>Not tested</span>
                      )}
                    </td>
                    <td>
                      {website.last_tested_at ? (
                        <small style={{ color: '#6b7280' }}>
                          {new Date(website.last_tested_at).toLocaleString()}
                        </small>
                      ) : (
                        <small style={{ color: '#6b7280' }}>Never</small>
                      )}
                    </td>
                    <td><AnimatedCounter value={website.total_tests || 0} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => openModal(website)}
                        >
                          <Play size={14} style={{ marginRight: '5px' }} />
                          Run Test
                        </button>

                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => {
                            if (confirm(`⚠️ Delete "${website.name}"?\n\nThis will permanently remove the website and all its test history.\n\nThis action cannot be undone.`)) {
                              deleteMutation.mutate(website.id)
                            }
                          }}
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

      <TestModal
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
