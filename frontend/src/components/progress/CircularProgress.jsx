import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * CircularProgress - Circular progress indicator for running tests
 *
 * Features:
 * - Spinning animation
 * - Optional percentage display
 * - Multiple sizes
 * - Color variants
 *
 * @param {number} percentage - Progress percentage (0-100)
 * @param {string} size - Size: 'sm', 'md', 'lg', 'xl' (default: 'md')
 * @param {string} variant - Color variant: 'default', 'primary', 'success' (default: 'default')
 * @param {boolean} showPercentage - Show percentage in center (default: false)
 * @param {string} label - Optional label below spinner
 * @param {string} className - Additional CSS classes
 */
export function CircularProgress({
  percentage,
  size = 'md',
  variant = 'default',
  showPercentage = false,
  label,
  className
}) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40'
  }

  const iconSizes = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 80
  }

  const variantColors = {
    default: 'text-gray-600',
    primary: 'text-blue-600',
    success: 'text-green-600'
  }

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className={cn('relative flex items-center justify-center', sizeClasses[size])}>
        <Loader2
          size={iconSizes[size]}
          className={cn('animate-spin', variantColors[variant])}
        />
        {showPercentage && percentage !== undefined && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-900">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
      {label && (
        <span className="text-sm font-medium text-gray-700">{label}</span>
      )}
    </div>
  )
}

export default CircularProgress
