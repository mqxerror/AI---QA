import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { StatusBadge, TestTypeIcon } from '@/components/badges'
import { TestProgressBar, DurationBar } from '@/components/progress'
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TestRunDetails } from './TestRunDetails'

/**
 * TestRunCard - Individual test run card with expand/collapse
 *
 * Features:
 * - Shows summary info (website, type, status, duration, test counts)
 * - Expandable to show detailed results
 * - Progress bar for test pass/fail ratio
 * - Click to view modal with full details
 *
 * @param {Object} run - Test run object
 * @param {Function} onViewDetails - Callback to open modal
 * @param {boolean} defaultExpanded - Whether card starts expanded
 */
export function TestRunCard({
  run,
  onViewDetails,
  defaultExpanded = false
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const passedTests = run.passed_count || 0
  const totalTests = run.total_count || 0
  const failedTests = totalTests - passedTests

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-lg',
      expanded && 'shadow-lg'
    )}>
      {/* Card Header - Always Visible */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left: Website + Type */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <TestTypeIcon type={run.test_type} size={20} withLabel={false} />
            <div className="flex flex-col min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">
                {run.website_name || 'Unknown Website'}
              </h4>
              <p className="text-sm text-gray-500">
                {run.test_type || 'Unknown'} Test
              </p>
            </div>
          </div>

          {/* Middle: Status */}
          <StatusBadge status={run.status} size="md" />

          {/* Right: Tests + Duration */}
          <div className="flex items-center gap-6">
            {/* Test Count */}
            <div className="text-center min-w-[80px]">
              <div className="text-sm font-medium text-gray-700">
                {passedTests}/{totalTests}
              </div>
              <div className="text-xs text-gray-500">Tests</div>
            </div>

            {/* Duration */}
            <div className="text-center min-w-[80px]">
              <div className="text-sm font-medium text-gray-700">
                {run.duration_seconds?.toFixed(2) || '0.00'}s
              </div>
              <div className="text-xs text-gray-500">Duration</div>
            </div>

            {/* Expand button */}
            <button
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(!expanded)
              }}
            >
              {expanded ? (
                <ChevronUp size={20} className="text-gray-600" />
              ) : (
                <ChevronDown size={20} className="text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <TestProgressBar
            passed={passedTests}
            failed={failedTests}
            total={totalTests}
            size="sm"
            showPercentage={true}
          />
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <span>
            {new Date(run.created_at).toLocaleString()}
          </span>
          {run.triggered_by && (
            <span>by {run.triggered_by}</span>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <TestRunDetails run={run} />

          {/* View Full Details Button */}
          <button
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails?.(run)
            }}
          >
            <ExternalLink size={16} />
            View Full Details
          </button>
        </div>
      )}
    </Card>
  )
}

export default TestRunCard
