import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * DurationBar - Visual duration comparison bar
 *
 * Features:
 * - Shows duration relative to max duration
 * - Color-coded by duration (fast=green, medium=yellow, slow=red)
 * - Displays formatted duration text
 * - Optional icon
 *
 * @param {number} duration - Duration in milliseconds
 * @param {number} maxDuration - Maximum duration for scaling (default: auto-calculated)
 * @param {boolean} showIcon - Show clock icon (default: true)
 * @param {boolean} showText - Show duration text (default: true)
 * @param {string} size - Size: 'sm', 'md', 'lg' (default: 'md')
 * @param {string} className - Additional CSS classes
 */
export function DurationBar({
  duration = 0,
  maxDuration,
  showIcon = true,
  showText = true,
  size = 'md',
  className
}) {
  // Format duration for display
  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
    const minutes = Math.floor(ms / 60000)
    const seconds = ((ms % 60000) / 1000).toFixed(0)
    return `${minutes}m ${seconds}s`
  }

  // Calculate percentage for bar width
  const max = maxDuration || duration * 2 // Default to 2x current duration
  const percentage = Math.min((duration / max) * 100, 100)

  // Color based on duration
  const getColor = () => {
    if (duration < 1000) return 'bg-green-500'       // < 1s = fast
    if (duration < 3000) return 'bg-yellow-500'      // < 3s = medium
    if (duration < 10000) return 'bg-orange-500'     // < 10s = slow
    return 'bg-red-500'                               // >= 10s = very slow
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

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  }

  return (
    <div className={cn('w-full space-y-1', className)}>
      {(showIcon || showText) && (
        <div className={cn('flex items-center gap-1.5', textSizeClasses[size])}>
          {showIcon && <Clock size={iconSizes[size]} className="text-gray-500" />}
          {showText && (
            <span className="font-medium text-gray-700">
              {formatDuration(duration)}
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

export default DurationBar
