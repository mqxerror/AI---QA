import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TestTypeIcon } from '@/components/badges'
import { cn } from '@/lib/utils'

/**
 * TestTypeFilter - Filter tabs for test types
 *
 * Features:
 * - Tabs for All, Smoke, Performance, Load, A11y, Security, SEO, Visual, Pixel
 * - Shows count for each test type
 * - Icons for each type
 * - Responsive layout
 *
 * @param {string} selectedType - Currently selected type ('all' or specific type)
 * @param {Function} onTypeChange - Callback when type changes
 * @param {Object} typeCounts - Object with counts for each type
 */
export function TestTypeFilter({
  selectedType = 'all',
  onTypeChange,
  typeCounts = {}
}) {
  const testTypes = [
    { value: 'all', label: 'All Tests', icon: null },
    { value: 'smoke', label: 'Smoke' },
    { value: 'performance', label: 'Performance' },
    { value: 'load', label: 'Load' },
    { value: 'accessibility', label: 'A11y' },
    { value: 'security', label: 'Security' },
    { value: 'seo', label: 'SEO' },
    { value: 'visual', label: 'Visual' },
    { value: 'pixel', label: 'Pixel' }
  ]

  const getCount = (type) => {
    if (type === 'all') {
      return Object.values(typeCounts).reduce((sum, count) => sum + count, 0)
    }
    return typeCounts[type] || 0
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
      <Tabs
        value={selectedType}
        onValueChange={onTypeChange}
        className="w-full"
      >
        <TabsList className="grid grid-cols-9 gap-2 w-full h-auto bg-gray-50 p-1">
          {testTypes.map((type) => {
            const count = getCount(type.value)
            return (
              <TabsTrigger
                key={type.value}
                value={type.value}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all',
                  'data-[state=active]:bg-white data-[state=active]:shadow-sm',
                  'data-[state=inactive]:hover:bg-gray-100',
                  count === 0 && 'opacity-40'
                )}
                disabled={count === 0}
              >
                {type.icon !== null && (
                  <TestTypeIcon type={type.value} size={18} />
                )}
                <span className="text-xs font-medium whitespace-nowrap">
                  {type.label}
                </span>
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                  selectedType === type.value
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-200 text-gray-600'
                )}>
                  {count}
                </span>
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>
    </div>
  )
}

export default TestTypeFilter
