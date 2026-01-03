import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { ChartContainer } from './ChartContainer'

/**
 * DurationTrendsChart - Line chart showing duration trends over time
 *
 * Features:
 * - Multiple lines (one per test type or website)
 * - Shows average duration trends
 * - Responsive axes
 * - Interactive tooltip
 *
 * @param {Array} testRuns - Array of test run objects
 * @param {string} groupBy - Group by 'type' or 'date' (default: 'date')
 * @param {string} title - Chart title
 * @param {boolean} loading - Loading state
 */
export function DurationTrendsChart({
  testRuns = [],
  groupBy = 'date',
  title = 'Duration Trends',
  loading = false
}) {
  // Process data for chart
  const processData = () => {
    if (!testRuns || testRuns.length === 0) return []

    if (groupBy === 'date') {
      // Group by date
      const grouped = {}

      testRuns.forEach(run => {
        const date = new Date(run.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })

        if (!grouped[date]) {
          grouped[date] = {
            date,
            totalDuration: 0,
            count: 0
          }
        }

        const duration = run.duration_seconds || 0
        grouped[date].totalDuration += duration
        grouped[date].count += 1
      })

      return Object.values(grouped).map(item => ({
        date: item.date,
        avgDuration: (item.totalDuration / item.count).toFixed(2)
      }))
    } else {
      // Group by test type
      const grouped = {}

      testRuns.forEach(run => {
        const type = run.test_type || 'Unknown'

        if (!grouped[type]) {
          grouped[type] = {
            type,
            totalDuration: 0,
            count: 0
          }
        }

        const duration = run.duration_seconds || 0
        grouped[type].totalDuration += duration
        grouped[type].count += 1
      })

      return Object.values(grouped).map(item => ({
        type: item.type,
        avgDuration: (item.totalDuration / item.count).toFixed(2)
      }))
    }
  }

  const chartData = processData()
  const xAxisKey = groupBy === 'date' ? 'date' : 'type'

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-blue-600">
            Avg: {payload[0].value}s
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <ChartContainer
      title={title}
      description={groupBy === 'date' ? 'Average duration by date' : 'Average duration by type'}
      loading={loading}
    >
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No duration data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={xAxisKey}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={{ stroke: '#d1d5db' }}
            />
            <YAxis
              label={{ value: 'Duration (seconds)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={{ stroke: '#d1d5db' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="avgDuration"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Avg Duration (s)"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  )
}

export default DurationTrendsChart
