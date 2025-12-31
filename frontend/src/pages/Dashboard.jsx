import { useQuery } from '@tanstack/react-query'
import { getStats, getTestRuns } from '../services/api'
import { Activity, CheckCircle, XCircle, Globe, TrendingUp, BarChart3, PieChart, Clock } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts'
import { useMemo } from 'react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => getStats().then(res => res.data),
    refetchInterval: 10000
  })

  const { data: recentRuns, isLoading: runsLoading } = useQuery({
    queryKey: ['recent-runs'],
    queryFn: () => getTestRuns({ limit: 100 }).then(res => res.data),
    refetchInterval: 10000
  })

  // Calculate pass rate
  const passRate = stats?.total_test_runs > 0
    ? Math.round((stats.recent_passes / (stats.recent_passes + stats.recent_fails)) * 100)
    : 0

  // Process data for charts
  const chartData = useMemo(() => {
    if (!recentRuns || recentRuns.length === 0) return null

    // Test trends over time (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split('T')[0]
    })

    const trendData = last7Days.map(date => {
      const dayRuns = recentRuns.filter(run => run.created_at.startsWith(date))
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        passed: dayRuns.filter(r => r.status === 'Pass').length,
        failed: dayRuns.filter(r => r.status === 'Fail').length,
        total: dayRuns.length
      }
    })

    // Test type distribution
    const testTypes = {}
    recentRuns.forEach(run => {
      testTypes[run.test_type] = (testTypes[run.test_type] || 0) + 1
    })

    const typeDistribution = Object.entries(testTypes).map(([name, value]) => ({
      name,
      value
    }))

    // Pass/Fail by test type
    const testTypeStats = {}
    recentRuns.forEach(run => {
      if (!testTypeStats[run.test_type]) {
        testTypeStats[run.test_type] = { passed: 0, failed: 0 }
      }
      if (run.status === 'Pass') {
        testTypeStats[run.test_type].passed++
      } else {
        testTypeStats[run.test_type].failed++
      }
    })

    const passFailByType = Object.entries(testTypeStats).map(([name, stats]) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      passed: stats.passed,
      failed: stats.failed,
      passRate: Math.round((stats.passed / (stats.passed + stats.failed)) * 100)
    }))

    // Performance trends (last 20 performance tests)
    const perfTests = recentRuns
      .filter(run => run.test_type === 'Performance')
      .slice(0, 20)
      .reverse()

    return {
      trendData,
      typeDistribution,
      passFailByType,
      perfTests
    }
  }, [recentRuns])

  if (statsLoading || runsLoading) return <div className="loading">Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Dashboard</h2>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          <Clock size={14} style={{ display: 'inline', marginRight: '5px' }} />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid" style={{ marginBottom: '25px' }}>
        <div className="stat-card">
          <div className="stat-label">
            <Globe size={16} style={{ display: 'inline', marginRight: '5px' }} />
            Total Websites
          </div>
          <div className="stat-value">{stats?.total_websites || 0}</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
            {stats?.active_websites || 0} active
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <Activity size={16} style={{ display: 'inline', marginRight: '5px' }} />
            Total Tests
          </div>
          <div className="stat-value">{stats?.total_test_runs || 0}</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
            All time
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <CheckCircle size={16} style={{ display: 'inline', marginRight: '5px' }} />
            Passed (7d)
          </div>
          <div className="stat-value" style={{ color: '#10b981' }}>
            {stats?.recent_passes || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
            Last 7 days
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <XCircle size={16} style={{ display: 'inline', marginRight: '5px' }} />
            Failed (7d)
          </div>
          <div className="stat-value" style={{ color: '#ef4444' }}>
            {stats?.recent_fails || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
            Last 7 days
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <TrendingUp size={16} style={{ display: 'inline', marginRight: '5px' }} />
            Pass Rate
          </div>
          <div className="stat-value" style={{
            color: passRate >= 90 ? '#10b981' : passRate >= 70 ? '#f59e0b' : '#ef4444'
          }}>
            {passRate}%
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
            Last 7 days
          </div>
        </div>
      </div>

      {chartData && (
        <>
          {/* Test Trends Chart */}
          <div className="card" style={{ marginBottom: '25px' }}>
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={18} />
              Test Activity Trends (Last 7 Days)
            </div>
            <div style={{ padding: '20px', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.trendData}>
                  <defs>
                    <linearGradient id="colorPassed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="passed"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorPassed)"
                    name="Passed"
                  />
                  <Area
                    type="monotone"
                    dataKey="failed"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorFailed)"
                    name="Failed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Two column charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '25px' }}>
            {/* Test Type Distribution */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChart size={18} />
                Test Distribution by Type
              </div>
              <div style={{ padding: '20px', height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={chartData.typeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.typeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pass/Fail by Test Type */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} />
                Pass/Fail Rate by Test Type
              </div>
              <div style={{ padding: '20px', height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.passFailByType}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="passed" fill="#10b981" name="Passed" />
                    <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Recent Test Runs */}
      <div className="card">
        <div className="card-header">Recent Test Runs (Last 10)</div>
        {!recentRuns || recentRuns.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <p>No test runs yet. Start testing from the Websites page.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Website</th>
                <th>Test Type</th>
                <th>Status</th>
                <th>Results</th>
                <th>Duration</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentRuns.slice(0, 10).map(run => (
                <tr key={run.id}>
                  <td>
                    <strong>{run.website_name}</strong>
                    <br />
                    <small style={{ color: '#6b7280' }}>{run.website_url}</small>
                  </td>
                  <td>
                    <span className="badge badge-info" style={{ fontSize: '11px' }}>
                      {run.test_type}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${run.status === 'Pass' ? 'success' : 'danger'}`}>
                      {run.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ color: '#10b981', fontWeight: '600' }}>{run.passed}</span>
                      <span style={{ color: '#6b7280' }}>/</span>
                      <span style={{ color: '#6b7280' }}>{run.total_tests}</span>
                      {run.failed > 0 && (
                        <span style={{ color: '#ef4444', fontSize: '12px' }}>
                          ({run.failed} ✗)
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      color: run.duration_ms > 30000 ? '#f59e0b' : '#6b7280',
                      fontSize: '13px'
                    }}>
                      {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : '-'}
                    </span>
                  </td>
                  <td>
                    <small style={{ color: '#6b7280' }}>
                      {new Date(run.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Dashboard
