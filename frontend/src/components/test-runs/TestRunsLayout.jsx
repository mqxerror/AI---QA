import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { TestRunTimeline } from './TestRunTimeline'
import { WebsiteSidebar } from './WebsiteSidebar'
import { TestTypeFilter } from './TestTypeFilter'
import { TestRunCard } from './TestRunCard'
import { PassFailChart, DurationTrendsChart, TestFrequencyChart } from '@/components/charts'
import { CircularProgress } from '@/components/progress'
import { RefreshCw } from 'lucide-react'
import TestRunModal from '../TestRunModal'

/**
 * TestRunsLayout - Main Test Runs page layout
 *
 * Features:
 * - Timeline view of recent test runs
 * - Charts (pass/fail, duration trends, frequency)
 * - Sidebar filtering by website
 * - Tabs filtering by test type
 * - List of test run cards
 * - Modal for detailed view
 *
 * This is the complete redesigned Test Runs page
 */
export function TestRunsLayout() {
  // State
  const [selectedWebsite, setSelectedWebsite] = useState(null) // null = All
  const [selectedType, setSelectedType] = useState('all')
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedRun, setSelectedRun] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Fetch test runs
  const { data: testRuns = [], isLoading, refetch } = useQuery({
    queryKey: ['test-runs'],
    queryFn: async () => {
      const response = await axios.get('/api/test-runs')
      return response.data
    },
    refetchInterval: 5000 // Poll every 5 seconds
  })

  // Filter test runs
  const filteredRuns = useMemo(() => {
    let filtered = [...testRuns]

    // Filter by website
    if (selectedWebsite) {
      filtered = filtered.filter(run => run.website_name === selectedWebsite)
    }

    // Filter by test type
    if (selectedType !== 'all') {
      filtered = filtered.filter(run =>
        run.test_type?.toLowerCase() === selectedType.toLowerCase()
      )
    }

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(run => {
        const runDate = new Date(run.created_at).toLocaleDateString()
        return runDate === selectedDate
      })
    }

    // Sort by created_at descending
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    return filtered
  }, [testRuns, selectedWebsite, selectedType, selectedDate])

  // Calculate type counts for filter tabs
  const typeCounts = useMemo(() => {
    const counts = {}
    testRuns.forEach(run => {
      const type = run.test_type?.toLowerCase() || 'unknown'
      counts[type] = (counts[type] || 0) + 1
    })
    return counts
  }, [testRuns])

  // Calculate stats for charts
  const chartStats = useMemo(() => {
    const passed = filteredRuns.filter(r => r.status?.toLowerCase() === 'pass').length
    const failed = filteredRuns.filter(r => r.status?.toLowerCase() === 'fail').length
    const running = filteredRuns.filter(r => r.status?.toLowerCase() === 'running').length

    return { passed, failed, running }
  }, [filteredRuns])

  // Handlers
  const handleViewDetails = (run) => {
    setSelectedRun(run)
    setModalOpen(true)
  }

  const handleRefresh = () => {
    refetch()
  }

  const handleDateClick = (date) => {
    setSelectedDate(selectedDate === date ? null : date)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Test Runs</h1>
          <p className="text-gray-600 mt-1">
            {filteredRuns.length} {filteredRuns.length === 1 ? 'result' : 'results'}
            {selectedWebsite && ` for ${selectedWebsite}`}
            {selectedType !== 'all' && ` • ${selectedType} tests`}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Timeline */}
      <TestRunTimeline
        runs={testRuns}
        days={7}
        onDateClick={handleDateClick}
        selectedDate={selectedDate}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <PassFailChart
          passed={chartStats.passed}
          failed={chartStats.failed}
          running={chartStats.running}
          title="Test Results"
          loading={isLoading}
        />
        <DurationTrendsChart
          testRuns={filteredRuns}
          groupBy="date"
          title="Duration Trends"
          loading={isLoading}
        />
        <TestFrequencyChart
          testRuns={testRuns}
          days={7}
          title="Test Frequency"
          loading={isLoading}
        />
      </div>

      {/* Test Type Filter */}
      <TestTypeFilter
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        typeCounts={typeCounts}
      />

      {/* Main Content: Sidebar + Test Run Cards */}
      <div className="flex gap-6 mt-6">
        {/* Sidebar */}
        <WebsiteSidebar
          runs={testRuns}
          selectedWebsite={selectedWebsite}
          onSelectWebsite={setSelectedWebsite}
        />

        {/* Test Run Cards */}
        <div className="flex-1 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <CircularProgress
                size="lg"
                variant="primary"
                label="Loading test runs..."
              />
            </div>
          ) : filteredRuns.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border-2 border-gray-200">
              <p className="text-gray-500 text-lg mb-2">No test runs found</p>
              <p className="text-gray-400 text-sm">
                Try adjusting your filters or run a new test
              </p>
            </div>
          ) : (
            filteredRuns.map((run) => (
              <TestRunCard
                key={run.id}
                run={run}
                onViewDetails={handleViewDetails}
              />
            ))
          )}
        </div>
      </div>

      {/* Modal for detailed view */}
      {selectedRun && (
        <TestRunModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setSelectedRun(null)
          }}
          runId={selectedRun.id}
        />
      )}
    </div>
  )
}

export default TestRunsLayout
