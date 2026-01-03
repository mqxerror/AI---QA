import { CheckCircle, XCircle, Loader2, Clock, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * StatusBadge - Enhanced status badge with icons and animations
 *
 * Features:
 * - Color-coded by status (pass=green, fail=red, running=purple, pending=yellow)
 * - Lucide icons (CheckCircle, XCircle, Loader2, Clock, AlertCircle)
 * - Animated pulse for "running" status
 * - Three sizes: sm, md, lg
 * - Optional icon-only or label-only display
 *
 * @param {string} status - Test status: 'pass', 'fail', 'running', 'pending', 'error'
 * @param {string} size - Size: 'sm', 'md', 'lg' (default: 'md')
 * @param {boolean} withIcon - Show icon (default: true)
 * @param {boolean} withLabel - Show label (default: true)
 * @param {boolean} animated - Enable pulse animation for running status (default: true)
 * @param {string} className - Additional CSS classes
 */
export function StatusBadge({
  status = 'pending',
  size = 'md',
  withIcon = true,
  withLabel = true,
  animated = true,
  className
}) {
  const statusLower = status?.toLowerCase() || 'pending'

  // Status config: icon, label, variant, color
  const statusConfig = {
    pass: {
      icon: CheckCircle,
      label: 'Pass',
      variant: 'default',
      className: 'bg-green-500 hover:bg-green-600 text-white'
    },
    success: {
      icon: CheckCircle,
      label: 'Success',
      variant: 'default',
      className: 'bg-green-500 hover:bg-green-600 text-white'
    },
    fail: {
      icon: XCircle,
      label: 'Fail',
      variant: 'destructive',
      className: 'bg-red-500 hover:bg-red-600 text-white'
    },
    failed: {
      icon: XCircle,
      label: 'Failed',
      variant: 'destructive',
      className: 'bg-red-500 hover:bg-red-600 text-white'
    },
    running: {
      icon: Loader2,
      label: 'Running',
      variant: 'secondary',
      className: 'bg-purple-500 hover:bg-purple-600 text-white'
    },
    pending: {
      icon: Clock,
      label: 'Pending',
      variant: 'outline',
      className: 'bg-yellow-500 hover:bg-yellow-600 text-white'
    },
    error: {
      icon: AlertCircle,
      label: 'Error',
      variant: 'destructive',
      className: 'bg-orange-500 hover:bg-orange-600 text-white'
    }
  }

  const config = statusConfig[statusLower] || statusConfig.pending
  const Icon = config.icon

  // Size variants
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2'
  }

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  }

  return (
    <Badge
      variant={config.variant}
      className={cn(
        config.className,
        sizeClasses[size],
        'inline-flex items-center font-semibold',
        statusLower === 'running' && animated && 'animate-pulse',
        className
      )}
    >
      {withIcon && (
        <Icon
          size={iconSizes[size]}
          className={cn(
            statusLower === 'running' && !animated && 'animate-spin'
          )}
        />
      )}
      {withLabel && config.label}
    </Badge>
  )
}

export default StatusBadge
