import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getTestRuns, generateReport } from '../services/api'
import { ChevronDown, ChevronRight, RefreshCw, Activity } from 'lucide-react'
import {
  AnimatedCounter,
  TextGenerateEffect,
  ScrollReveal,
  FadeText,
  FlipWords
} from '../components/ui'
import { useTestResultUpdates } from '../hooks/useRealtimeUpdates'
import TestRunModal from '../components/TestRunModal'

// Reports are on MinIO - open directly (no proxy needed)
function getReportUrl(reportUrl) {
  // Just return the original MinIO URL
  return reportUrl;
}

function TestRuns() {
  const [expandedWebsites, setExpandedWebsites] = useState(new Set())
  const [filter, setFilter] = useState('all') // all, Smoke, Performance, Load Test, Accessibility, Pixel Audit
  const [selectedTestRunId, setSelectedTestRunId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalInitialData, setModalInitialData] = useState(null)
  const queryClient = useQueryClient()

  const toggleWebsite = (websiteName) => {
    setExpandedWebsites(prev => {
      const next = new Set(prev)
      if (next.has(websiteName)) {
        next.delete(websiteName)
      } else {
        next.add(websiteName)
      }
      return next
    })
  }

  const handleOpenTestModal = (run) => {
    setSelectedTestRunId(run.id)
    setModalInitialData(run)
    setIsModalOpen(true)
  }

  const handleCloseTestModal = () => {
    setIsModalOpen(false)
    setSelectedTestRunId(null)
    setModalInitialData(null)
  }

  // Real-time updates when new test results arrive
  useTestResultUpdates(() => {
    queryClient.invalidateQueries(['test-runs'])
  }, [])

  const { data: runs, isLoading, error, refetch } = useQuery({
    queryKey: ['test-runs'],
    queryFn: () => getTestRuns({ limit: 100 }).then(res => res.data),
    refetchInterval: 5000 // Faster polling
  })

  if (isLoading) return <div className="loading">Loading...</div>
  if (error) return <div className="error">Error loading test runs: {error.message}</div>

  // Filter runs by test type
  const filteredRuns = filter === 'all'
    ? runs
    : runs?.filter(run => run.test_type === filter)

  // Group runs by website
  const groupedByWebsite = filteredRuns?.reduce((acc, run) => {
    const key = run.website_name
    if (!acc[key]) {
      acc[key] = {
        website_name: run.website_name,
        website_url: run.website_url,
        runs: []
      }
    }
    acc[key].runs.push(run)
    return acc
  }, {})

  const websiteGroups = Object.values(groupedByWebsite || {}).sort((a, b) =>
    a.website_name.localeCompare(b.website_name)
  )

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', position: 'relative', zIndex: 10 }}>
        <div>
          <TextGenerateEffect words="Test Runs" className="dashboard-title" />
          <FadeText direction="right">
            <div style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
              Comprehensive test history • <FlipWords words={["View Results", "Track Progress", "Analyze Performance"]} className="inline-flip" />
            </div>
          </FadeText>
        </div>
        <button
          onClick={() => refetch()}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <ScrollReveal delay={0.1} direction="up">
        <div className="btn-group mb-3" role="group">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
          >
            All
            <span className="badge bg-primary-lt ms-2">
              <AnimatedCounter value={runs?.length || 0} />
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('Smoke')}
            className={`btn btn-sm ${filter === 'Smoke' ? 'btn-primary' : 'btn-outline-primary'}`}
          >
            Smoke
            <span className="badge bg-primary-lt ms-2">
              <AnimatedCounter value={runs?.filter(r => r.test_type === 'Smoke').length || 0} />
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('Performance')}
            className={`btn btn-sm ${filter === 'Performance' ? 'btn-primary' : 'btn-outline-primary'}`}
          >
            Performance
            <span className="badge bg-primary-lt ms-2">
              <AnimatedCounter value={runs?.filter(r => r.test_type === 'Performance').length || 0} />
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('Load Test')}
            className={`btn btn-sm ${filter === 'Load Test' ? 'btn-primary' : 'btn-outline-primary'}`}
          >
            Load
            <span className="badge bg-primary-lt ms-2">
              <AnimatedCounter value={runs?.filter(r => r.test_type === 'Load Test').length || 0} />
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('Accessibility')}
            className={`btn btn-sm ${filter === 'Accessibility' ? 'btn-primary' : 'btn-outline-primary'}`}
          >
            A11y
            <span className="badge bg-primary-lt ms-2">
              <AnimatedCounter value={runs?.filter(r => r.test_type === 'Accessibility').length || 0} />
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('Security Scan')}
            className={`btn btn-sm ${filter === 'Security Scan' ? 'btn-primary' : 'btn-outline-primary'}`}
          >
            Security
            <span className="badge bg-primary-lt ms-2">
              <AnimatedCounter value={runs?.filter(r => r.test_type === 'Security Scan').length || 0} />
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('SEO Audit')}
            className={`btn btn-sm ${filter === 'SEO Audit' ? 'btn-primary' : 'btn-outline-primary'}`}
          >
            SEO
            <span className="badge bg-primary-lt ms-2">
              <AnimatedCounter value={runs?.filter(r => r.test_type === 'SEO Audit').length || 0} />
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('Visual Regression')}
            className={`btn btn-sm ${filter === 'Visual Regression' ? 'btn-primary' : 'btn-outline-primary'}`}
          >
            Visual
            <span className="badge bg-primary-lt ms-2">
              <AnimatedCounter value={runs?.filter(r => r.test_type === 'Visual Regression').length || 0} />
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('Pixel Audit')}
            className={`btn btn-sm ${filter === 'Pixel Audit' ? 'btn-primary' : 'btn-outline-primary'}`}
          >
            Pixel
            <span className="badge bg-primary-lt ms-2">
              <AnimatedCounter value={runs?.filter(r => r.test_type === 'Pixel Audit').length || 0} />
            </span>
          </button>
        </div>
      </ScrollReveal>

      {filteredRuns?.length === 0 ? (
        <ScrollReveal delay={0.2} direction="up">
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">
                <Activity size={64} color="#10b981" />
              </div>
              <FadeText direction="up">
                <p>{filter === 'all' ? 'No test runs yet. Run a test from the Websites page.' : `No ${filter} tests found.`}</p>
              </FadeText>
            </div>
          </div>
        </ScrollReveal>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {websiteGroups.map((group, idx) => {
            const isExpanded = expandedWebsites.has(group.website_name)
            const passedTests = group.runs.filter(r => r.status === 'Pass').length
            const failedTests = group.runs.filter(r => r.status === 'Fail').length

            return (
              <ScrollReveal key={group.website_name} delay={0.1 * (idx + 1)} direction="up">
                <div className="card">
                  {/* Website Header */}
                <div
                  onClick={() => toggleWebsite(group.website_name)}
                  style={{
                    padding: '20px',
                    cursor: 'pointer',
                    borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: isExpanded ? 'linear-gradient(to bottom, #f9fafb, white)' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    {isExpanded ? (
                      <ChevronDown size={20} style={{ color: '#3b82f6' }} />
                    ) : (
                      <ChevronRight size={20} style={{ color: '#6b7280' }} />
                    )}
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0' }}>
                        {group.website_name}
                      </h3>
                      <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                        {group.website_url}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span className="badge badge-info">
                        {group.runs.length} {group.runs.length === 1 ? 'test' : 'tests'}
                      </span>
                      {passedTests > 0 && (
                        <span className="badge badge-success">{passedTests} passed</span>
                      )}
                      {failedTests > 0 && (
                        <span className="badge badge-danger">{failedTests} failed</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Test Runs Table */}
                {isExpanded && (
                  <div className="table-responsive">
                    <table className="table table-vcenter card-table table-hover">
                      <thead>
                        <tr>
                          <th className="w-1">
                            <ChevronDown size={16} className="text-primary" />
                          </th>
                          <th>Test Type</th>
                          <th>Status</th>
                          <th>Results</th>
                          <th>Duration</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.runs.map(run => (
                          <tr
                            key={run.id}
                            onClick={() => handleOpenTestModal(run)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td>
                              <ChevronRight size={16} className="text-muted" />
                            </td>
                            <td>
                              <span className="badge bg-info">{run.test_type}</span>
                            </td>
                            <td>
                              <span className={`badge bg-${run.status === 'Pass' ? 'success' : 'danger'}`}>
                                {run.status}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <span className="text-muted">{run.passed}/{run.total_tests}</span>
                                {run.failed > 0 && (
                                  <span className="badge bg-danger-lt">
                                    {run.failed} failed
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="text-muted">
                              {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(2)}s` : '-'}
                            </td>
                            <td className="text-muted">
                              {new Date(run.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      )}

      <TestRunModal
        isOpen={isModalOpen}
        onClose={handleCloseTestModal}
        testRunId={selectedTestRunId}
        initialData={modalInitialData}
      />
    </div>
  )
}

export default TestRuns
