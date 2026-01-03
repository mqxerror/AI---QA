import { getTimelineData } from '@/utils/testDataTransformers'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TestTypeIcon } from '@/components/badges'

/**
 * TestRunTimeline - Horizontal scrollable timeline of test runs
 *
 * Features:
 * - Shows last 7 days
 * - Dots represent test runs (color-coded by status)
 * - Hover tooltip shows test details
 * - Click to filter by date
 *
 * @param {Array} runs - Array of test run objects
 * @param {number} days - Number of days to show (default: 7)
 * @param {Function} onDateClick - Callback when date is clicked
 * @param {string} selectedDate - Currently selected date
 */
export function TestRunTimeline({
  runs = [],
  days = 7,
  onDateClick,
  selectedDate
}) {
  const timeline = getTimelineData(runs, days)

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || 'pending'
    const colors = {
      pass: 'bg-green-500',
      success: 'bg-green-500',
      fail: 'bg-red-500',
      failed: 'bg-red-500',
      running: 'bg-purple-500',
      pending: 'bg-yellow-500',
      error: 'bg-orange-500'
    }
    return colors[statusLower] || 'bg-gray-400'
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Test Timeline</h3>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-gray-600">Pass</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-gray-600">Fail</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="text-gray-600">Running</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-8 min-w-max py-2">
          {timeline.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className={cn(
                'flex flex-col items-center gap-2 cursor-pointer transition-all',
                selectedDate === day.date && 'opacity-100',
                selectedDate && selectedDate !== day.date && 'opacity-50'
              )}
              onClick={() => onDateClick?.(day.date)}
            >
              <div className="text-xs font-semibold text-gray-700 uppercase">
                {day.dayName}
              </div>
              <div className="text-sm text-gray-500">
                {day.date}
              </div>

              <div className="flex flex-wrap gap-1.5 justify-center w-24 min-h-[60px] items-center">
                {day.runs.length === 0 ? (
                  <div className="w-2 h-2 rounded-full bg-gray-200" />
                ) : (
                  <TooltipProvider>
                    {day.runs.map((run, runIndex) => (
                      <Tooltip key={runIndex}>
                        <TooltipTrigger>
                          <div
                            className={cn(
                              'w-3 h-3 rounded-full transition-all hover:scale-125',
                              getStatusColor(run.status)
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <div className="flex items-center gap-2">
                              <TestTypeIcon type={run.test_type} size={14} />
                              <span className="font-semibold">{run.test_type}</span>
                            </div>
                            <div className="text-gray-600">{run.website_name}</div>
                            <div className="text-gray-500">
                              {run.status} • {run.duration_seconds?.toFixed(2)}s
                            </div>
                            <div className="text-gray-400 text-[10px]">
                              {new Date(run.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                )}
              </div>

              <div className="text-xs text-gray-500">
                {day.runs.length} {day.runs.length === 1 ? 'test' : 'tests'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TestRunTimeline
