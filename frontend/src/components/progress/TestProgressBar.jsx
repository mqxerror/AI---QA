import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

/**
 * TestProgressBar - Horizontal progress bar showing pass/fail ratio
 *
 * Features:
 * - Animated width transition
 * - Displays "passed/total" text
 * - Optional percentage display
 * - Color-coded (green for high pass rate, red for low)
 *
 * @param {number} passed - Number of passed tests
 * @param {number} failed - Number of failed tests
 * @param {number} total - Total number of tests
 * @param {boolean} showPercentage - Show percentage (default: true)
 * @param {boolean} showCount - Show count text (default: true)
 * @param {string} size - Size: 'sm', 'md', 'lg' (default: 'md')
 * @param {string} className - Additional CSS classes
 */
export function TestProgressBar({
  passed = 0,
  failed = 0,
  total = 0,
  showPercentage = true,
  showCount = true,
  size = 'md',
  className
}) {
  const actualTotal = total || (passed + failed)
  const percentage = actualTotal > 0 ? (passed / actualTotal) * 100 : 0

  // Color based on pass rate
  const getColor = () => {
    if (percentage >= 90) return 'bg-green-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <div className={cn('w-full space-y-1', className)}>
      {(showCount || showPercentage) && (
        <div className={cn('flex justify-between items-center', textSizeClasses[size])}>
          {showCount && (
            <span className="font-medium text-gray-700">
              {passed} / {actualTotal}
            </span>
          )}
          {showPercentage && (
            <span className="font-semibold text-gray-900">
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div className={cn('relative w-full bg-gray-200 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out rounded-full',
            getColor()
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default TestProgressBar
