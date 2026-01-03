import {
  Flame,
  Gauge,
  Users,
  Eye,
  Shield,
  Search,
  Image,
  Activity,
  FlaskConical
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * TestTypeIcon - Icon component for different test types
 *
 * Test types:
 * - Smoke: Flame
 * - Performance: Gauge
 * - Load: Users
 * - Accessibility: Eye
 * - Security: Shield
 * - SEO: Search
 * - Visual: Image
 * - Pixel: Activity
 * - Default: FlaskConical
 *
 * @param {string} type - Test type
 * @param {number} size - Icon size in pixels (default: 16)
 * @param {string} className - Additional CSS classes
 * @param {boolean} withLabel - Show label next to icon (default: false)
 */
export function TestTypeIcon({
  type = 'smoke',
  size = 16,
  className,
  withLabel = false
}) {
  const typeLower = type?.toLowerCase() || 'smoke'

  const typeConfig = {
    smoke: {
      icon: Flame,
      label: 'Smoke Test',
      color: 'text-orange-500'
    },
    performance: {
      icon: Gauge,
      label: 'Performance Test',
      color: 'text-blue-500'
    },
    load: {
      icon: Users,
      label: 'Load Test',
      color: 'text-purple-500'
    },
    accessibility: {
      icon: Eye,
      label: 'Accessibility Test',
      color: 'text-green-500'
    },
    a11y: {
      icon: Eye,
      label: 'Accessibility Test',
      color: 'text-green-500'
    },
    security: {
      icon: Shield,
      label: 'Security Test',
      color: 'text-red-500'
    },
    seo: {
      icon: Search,
      label: 'SEO Test',
      color: 'text-yellow-500'
    },
    visual: {
      icon: Image,
      label: 'Visual Regression',
      color: 'text-pink-500'
    },
    pixel: {
      icon: Activity,
      label: 'Pixel Audit',
      color: 'text-indigo-500'
    }
  }

  const config = typeConfig[typeLower] || {
    icon: FlaskConical,
    label: type || 'Test',
    color: 'text-gray-500'
  }

  const Icon = config.icon

  if (withLabel) {
    return (
      <div className={cn('inline-flex items-center gap-2', className)}>
        <Icon size={size} className={config.color} />
        <span className="text-sm font-medium">{config.label}</span>
      </div>
    )
  }

  return (
    <Icon
      size={size}
      className={cn(config.color, className)}
      title={config.label}
    />
  )
}

export default TestTypeIcon
