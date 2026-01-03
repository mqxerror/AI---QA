import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * ChartContainer - Wrapper component for charts with consistent styling
 *
 * Features:
 * - Consistent card-based layout
 * - Optional title and description
 * - Responsive sizing
 * - Loading state
 *
 * @param {string} title - Chart title
 * @param {string} description - Chart description
 * @param {ReactNode} children - Chart content (Recharts component)
 * @param {boolean} loading - Loading state (default: false)
 * @param {string} className - Additional CSS classes
 */
export function ChartContainer({
  title,
  description,
  children,
  loading = false,
  className
}) {
  return (
    <Card className={cn('w-full', className)}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle className="text-lg font-semibold">{title}</CardTitle>}
          {description && (
            <CardDescription className="text-sm text-gray-600">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className={cn('relative', loading && 'opacity-50 pointer-events-none')}>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading chart...</div>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

export default ChartContainer
