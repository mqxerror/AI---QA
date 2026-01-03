import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { ChartContainer } from './ChartContainer'

/**
 * PassFailChart - Donut chart showing pass/fail test ratio
 *
 * Features:
 * - Donut chart with pass/fail segments
 * - Center displays pass percentage
 * - Color-coded (green=pass, red=fail, purple=running, gray=other)
 * - Legend shows counts
 * - Responsive sizing
 *
 * @param {number} passed - Number of passed tests
 * @param {number} failed - Number of failed tests
 * @param {number} running - Number of running tests (optional)
 * @param {string} dateRange - Date range label (optional)
 * @param {string} title - Chart title
 * @param {boolean} loading - Loading state
 */
export function PassFailChart({
  passed = 0,
  failed = 0,
  running = 0,
  dateRange,
  title = 'Test Results',
  loading = false
}) {
  const total = passed + failed + running
  const passPercentage = total > 0 ? ((passed / total) * 100).toFixed(1) : 0

  // Prepare data for chart
  const data = [
    { name: 'Passed', value: passed, color: '#10b981' },   // green-500
    { name: 'Failed', value: failed, color: '#ef4444' },   // red-500
  ]

  if (running > 0) {
    data.push({ name: 'Running', value: running, color: '#8b5cf6' }) // purple-500
  }

  // Filter out zero values
  const chartData = data.filter(item => item.value > 0)

  // Custom label to show percentage in center
  const renderCenterLabel = () => (
    <g>
      <text
        x="50%"
        y="45%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-4xl font-bold fill-gray-900"
      >
        {passPercentage}%
      </text>
      <text
        x="50%"
        y="58%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-sm fill-gray-600"
      >
        Pass Rate
      </text>
    </g>
  )

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2">
          <p className="text-sm font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">{data.value} tests</p>
          <p className="text-xs text-gray-500">
            {total > 0 ? ((data.value / total) * 100).toFixed(1) : 0}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <ChartContainer
      title={title}
      description={dateRange}
      loading={loading}
    >
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No test data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry) => `${value}: ${entry.payload.value}`}
            />
            {renderCenterLabel()}
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  )
}

export default PassFailChart
