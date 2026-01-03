import { PassFailChart } from '@/components/charts'
import { DurationBar } from '@/components/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

/**
 * TestRunDetails - Expanded details shown inside TestRunCard
 *
 * Features:
 * - Mini chart of test results
 * - Key metrics specific to test type
 * - Duration breakdown
 * - Quick stats
 *
 * @param {Object} run - Test run object
 */
export function TestRunDetails({ run }) {
  // Get test-type-specific metrics
  const renderTypeSpecificMetrics = () => {
    const type = run.test_type?.toLowerCase()

    if (type === 'performance') {
      return (
        <div className="grid grid-cols-3 gap-3">
          <MetricCard
            label="Performance Score"
            value={run.lighthouse_score?.performance || 'N/A'}
            suffix="/100"
          />
          <MetricCard
            label="LCP"
            value={run.lcp ? `${run.lcp}ms` : 'N/A'}
          />
          <MetricCard
            label="CLS"
            value={run.cls !== undefined ? run.cls.toFixed(3) : 'N/A'}
          />
        </div>
      )
    }

    if (type === 'accessibility' || type === 'a11y') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="A11y Score"
            value={run.lighthouse_score?.accessibility || 'N/A'}
            suffix="/100"
          />
          <MetricCard
            label="Violations"
            value={run.violations_count || 0}
            variant={run.violations_count > 0 ? 'warning' : 'success'}
          />
        </div>
      )
    }

    if (type === 'seo') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="SEO Score"
            value={run.seo_score || run.lighthouse_score?.seo || 'N/A'}
            suffix="/100"
          />
          <MetricCard
            label="Issues"
            value={run.issues_count || 0}
            variant={run.issues_count > 0 ? 'warning' : 'success'}
          />
        </div>
      )
    }

    if (type === 'load') {
      return (
        <div className="grid grid-cols-3 gap-3">
          <MetricCard
            label="Requests"
            value={run.total_requests || 'N/A'}
          />
          <MetricCard
            label="Throughput"
            value={run.total_requests && run.duration_seconds
              ? `${(run.total_requests / run.duration_seconds).toFixed(1)} req/s`
              : 'N/A'}
          />
          <MetricCard
            label="Error Rate"
            value={run.failed_requests && run.total_requests
              ? `${((run.failed_requests / run.total_requests) * 100).toFixed(1)}%`
              : '0%'}
            variant={run.failed_requests > 0 ? 'warning' : 'success'}
          />
        </div>
      )
    }

    // Default for smoke/other types
    return null
  }

  return (
    <div className="space-y-4">
      {/* Mini Chart */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <PassFailChart
            passed={run.passed_count || 0}
            failed={(run.total_count || 0) - (run.passed_count || 0)}
            title="Test Results"
            loading={false}
          />
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Duration</h4>
          <DurationBar
            duration={(run.duration_seconds || 0) * 1000}
            maxDuration={10000} // 10 seconds max for visualization
            size="md"
          />

          {run.report_url && (
            <a
              href={run.report_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              View Lighthouse Report →
            </a>
          )}
        </div>
      </div>

      <Separator />

      {/* Type-specific metrics */}
      {renderTypeSpecificMetrics()}

      {/* Additional metadata */}
      <div className="flex flex-wrap gap-2">
        {run.browser && (
          <Badge variant="outline" className="text-xs">
            Browser: {run.browser}
          </Badge>
        )}
        {run.viewport && (
          <Badge variant="outline" className="text-xs">
            Viewport: {run.viewport}
          </Badge>
        )}
        {run.environment && (
          <Badge variant="outline" className="text-xs">
            Env: {run.environment}
          </Badge>
        )}
      </div>
    </div>
  )
}

// Helper component for metric cards
function MetricCard({ label, value, suffix = '', variant = 'default' }) {
  const variantStyles = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-orange-50 border-orange-200'
  }

  return (
    <div className={`p-3 rounded-lg border-2 ${variantStyles[variant]}`}>
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className="text-lg font-bold text-gray-900">
        {value}{suffix}
      </div>
    </div>
  )
}

export default TestRunDetails
