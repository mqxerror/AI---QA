import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { ChartContainer } from './ChartContainer'

/**
 * TestFrequencyChart - Bar chart showing test run frequency
 *
 * Features:
 * - Stacked bars (pass + fail)
 * - Daily test counts
 * - Hover shows breakdown
 * - Color-coded
 *
 * @param {Array} testRuns - Array of test run objects
 * @param {number} days - Number of days to show (default: 7)
 * @param {string} title - Chart title
 * @param {boolean} loading - Loading state
 */
export function TestFrequencyChart({
  testRuns = [],
  days = 7,
  title = 'Test Frequency',
  loading = false
}) {
  // Generate last N days
  const generateDaysData = () => {
    const data = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })

      const runsForDay = testRuns.filter(run => {
        const runDate = new Date(run.created_at)
        return (
          runDate.getDate() === date.getDate() &&
          runDate.getMonth() === date.getMonth() &&
          runDate.getFullYear() === date.getFullYear()
        )
      })

      const passed = runsForDay.filter(r => r.status?.toLowerCase() === 'pass').length
      const failed = runsForDay.filter(r => r.status?.toLowerCase() === 'fail').length
      const running = runsForDay.filter(r => r.status?.toLowerCase() === 'running').length

      data.push({
        date: dateString,
        passed,
        failed,
        running,
        total: passed + failed + running
      })
    }

    return data
  }

  const chartData = generateDaysData()

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, entry) => sum + entry.value, 0)
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2">
          <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
          <p className="text-xs text-gray-600 mb-1">Total: {total} tests</p>
          {payload.map((entry, index) => (
            <p
              key={index}
              className="text-xs"
              style={{ color: entry.color }}
            >
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <ChartContainer
      title={title}
      description={`Test runs over the last ${days} days`}
      loading={loading}
    >
      {chartData.length === 0 || chartData.every(d => d.total === 0) ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No test frequency data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={{ stroke: '#d1d5db' }}
            />
            <YAxis
              label={{ value: 'Test Count', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={{ stroke: '#d1d5db' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="passed"
              stackId="a"
              fill="#10b981"
              name="Passed"
            />
            <Bar
              dataKey="failed"
              stackId="a"
              fill="#ef4444"
              name="Failed"
            />
            <Bar
              dataKey="running"
              stackId="a"
              fill="#8b5cf6"
              name="Running"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  )
}

export default TestFrequencyChart
