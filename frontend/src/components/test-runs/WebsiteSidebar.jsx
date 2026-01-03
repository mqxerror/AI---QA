import { groupByWebsite, calculateTestStats } from '@/utils/testDataTransformers'
import { cn } from '@/lib/utils'
import { TestProgressBar } from '@/components/progress'
import { Globe } from 'lucide-react'

/**
 * WebsiteSidebar - Sidebar showing websites with test counts and mini charts
 *
 * Features:
 * - Clickable website list
 * - Test counts per website
 * - Mini bar charts showing pass/fail ratio
 * - "All Websites" option
 * - Selected state highlighting
 *
 * @param {Array} runs - Array of test run objects
 * @param {string} selectedWebsite - Currently selected website (null = All)
 * @param {Function} onSelectWebsite - Callback when website is selected
 */
export function WebsiteSidebar({
  runs = [],
  selectedWebsite,
  onSelectWebsite
}) {
  const websiteGroups = groupByWebsite(runs)
  const totalStats = calculateTestStats(runs)

  const websites = Object.entries(websiteGroups).map(([name, websiteRuns]) => ({
    name,
    runs: websiteRuns,
    stats: calculateTestStats(websiteRuns)
  }))

  // Sort by total count descending
  websites.sort((a, b) => b.stats.total - a.stats.total)

  return (
    <div className="w-64 bg-white border-2 border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
        <Globe size={18} className="text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Websites
        </h3>
      </div>

      <div className="space-y-2">
        {/* All Websites option */}
        <div
          className={cn(
            'p-3 rounded-lg cursor-pointer transition-all',
            !selectedWebsite
              ? 'bg-blue-50 border-2 border-blue-500'
              : 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
          )}
          onClick={() => onSelectWebsite?.(null)}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={cn(
              'font-semibold text-sm',
              !selectedWebsite ? 'text-blue-900' : 'text-gray-700'
            )}>
              All Websites
            </span>
            <span className={cn(
              'text-xs font-bold px-2 py-0.5 rounded-full',
              !selectedWebsite
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-200 text-gray-600'
            )}>
              {totalStats.total}
            </span>
          </div>
          <TestProgressBar
            passed={totalStats.passed}
            failed={totalStats.failed}
            total={totalStats.total}
            size="sm"
            showPercentage={false}
          />
        </div>

        {/* Individual websites */}
        {websites.map((website, index) => (
          <div
            key={index}
            className={cn(
              'p-3 rounded-lg cursor-pointer transition-all',
              selectedWebsite === website.name
                ? 'bg-blue-50 border-2 border-blue-500'
                : 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
            )}
            onClick={() => onSelectWebsite?.(website.name)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={cn(
                'font-medium text-sm truncate flex-1',
                selectedWebsite === website.name ? 'text-blue-900' : 'text-gray-700'
              )} title={website.name}>
                {website.name}
              </span>
              <span className={cn(
                'text-xs font-bold px-2 py-0.5 rounded-full ml-2',
                selectedWebsite === website.name
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-200 text-gray-600'
              )}>
                {website.stats.total}
              </span>
            </div>
            <TestProgressBar
              passed={website.stats.passed}
              failed={website.stats.failed}
              total={website.stats.total}
              size="sm"
              showPercentage={false}
            />
          </div>
        ))}

        {websites.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No websites found
          </div>
        )}
      </div>
    </div>
  )
}

export default WebsiteSidebar
