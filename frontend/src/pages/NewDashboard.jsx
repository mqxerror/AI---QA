import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStats, getTestRuns, getWebsites } from '../services/api';
import {
  Activity, Globe, Plus, Play, FileText, TrendingUp, TrendingDown,
  Shield, Clock, CheckCircle, XCircle, Briefcase, Code2, RefreshCw,
  BarChart3, Zap
} from 'lucide-react';
import {
  TextShimmer,
  FadeText,
  ScrollReveal
} from '../components/ui';
import './NewDashboard.css';

export default function NewDashboard() {
  const [viewMode, setViewMode] = useState('executive');

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => getStats().then(res => res.data),
    refetchInterval: 10000
  });

  const { data: recentRuns = [], refetch: refetchRuns } = useQuery({
    queryKey: ['dashboard-recent-runs'],
    queryFn: () => getTestRuns({ limit: 100 }).then(res => res.data),
    refetchInterval: 10000
  });

  const { data: websites = [] } = useQuery({
    queryKey: ['websites'],
    queryFn: () => getWebsites().then(res => res.data),
    refetchInterval: 30000
  });

  // Calculate comprehensive stats
  const dashboardStats = useMemo(() => {
    const total = recentRuns.length;
    const passed = recentRuns.filter(r => r.status === 'Pass').length;
    const failed = recentRuns.filter(r => r.status === 'Fail').length;

    // Calculate trends (last 24h vs previous 24h)
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now - 48 * 60 * 60 * 1000);

    const last24h = recentRuns.filter(r => new Date(r.created_at) > oneDayAgo);
    const prev24h = recentRuns.filter(r => new Date(r.created_at) > twoDaysAgo && new Date(r.created_at) <= oneDayAgo);

    const last24hPassRate = last24h.length > 0
      ? (last24h.filter(r => r.status === 'Pass').length / last24h.length) * 100
      : 0;
    const prev24hPassRate = prev24h.length > 0
      ? (prev24h.filter(r => r.status === 'Pass').length / prev24h.length) * 100
      : 0;

    const trend = last24hPassRate - prev24hPassRate;

    // Test type breakdown
    const byType = {};
    recentRuns.forEach(r => {
      const type = r.test_type || 'Unknown';
      if (!byType[type]) byType[type] = { total: 0, passed: 0, failed: 0 };
      byType[type].total++;
      if (r.status === 'Pass') byType[type].passed++;
      if (r.status === 'Fail') byType[type].failed++;
    });

    // Calculate average duration
    const runsWithDuration = recentRuns.filter(r => r.duration_ms > 0);
    const avgDuration = runsWithDuration.length > 0
      ? runsWithDuration.reduce((sum, r) => sum + r.duration_ms, 0) / runsWithDuration.length
      : 0;

    return {
      total,
      passed,
      failed,
      trend,
      last24h: last24h.length,
      byType,
      avgDuration,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0
    };
  }, [recentRuns]);

  const formatDuration = (ms) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  };

  const handleRefresh = () => {
    refetchStats();
    refetchRuns();
  };

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="page-header">
        <FadeText direction="down">
          <div>
            <TextShimmer className="title-shimmer">
              <h1>Dashboard</h1>
            </TextShimmer>
            <p>QA Testing overview and performance monitoring</p>
          </div>
        </FadeText>
        <div className="header-actions">
          {/* View Mode Toggle */}
          <div className="view-mode-toggle">
            <button
              onClick={() => setViewMode('executive')}
              className={`view-mode-btn ${viewMode === 'executive' ? 'active' : ''}`}
            >
              <Briefcase size={16} />
              Executive
            </button>
            <button
              onClick={() => setViewMode('technical')}
              className={`view-mode-btn ${viewMode === 'technical' ? 'active' : ''}`}
            >
              <Code2 size={16} />
              Technical
            </button>
          </div>
          <button onClick={handleRefresh} className="refresh-btn">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Executive View - High-level KPIs */}
      {viewMode === 'executive' && (
        <div className="executive-view">
          <ScrollReveal delay={0.1} direction="up">
            <div className="kpi-grid">
              <div className="kpi-card primary">
                <div className="kpi-icon"><Globe size={24} /></div>
                <div className="kpi-content">
                  <div className="kpi-value">{stats?.total_websites || websites.length || 0}</div>
                  <div className="kpi-label">Total Websites</div>
                  <div className="kpi-meta">{stats?.active_websites || websites.filter(w => w.status === 'Active').length || 0} active</div>
                </div>
              </div>
              <div className="kpi-card success">
                <div className="kpi-icon success"><TrendingUp size={24} /></div>
                <div className="kpi-content">
                  <div className="kpi-value">{dashboardStats.passRate}%</div>
                  <div className="kpi-label">Pass Rate</div>
                  <div className="kpi-trend">
                    {dashboardStats.trend > 0 ? (
                      <span className="trend-up"><TrendingUp size={14} /> +{dashboardStats.trend.toFixed(1)}%</span>
                    ) : dashboardStats.trend < 0 ? (
                      <span className="trend-down"><TrendingDown size={14} /> {dashboardStats.trend.toFixed(1)}%</span>
                    ) : (
                      <span className="trend-neutral">No change</span>
                    )}
                  </div>
                </div>
                <div className="kpi-progress">
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${dashboardStats.passRate}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="kpi-card danger">
                <div className="kpi-icon danger"><XCircle size={24} /></div>
                <div className="kpi-content">
                  <div className="kpi-value">{dashboardStats.failed}</div>
                  <div className="kpi-label">Failed Tests</div>
                  <div className="kpi-meta">{dashboardStats.total > 0 ? ((dashboardStats.failed / dashboardStats.total) * 100).toFixed(1) : 0}% failure rate</div>
                </div>
              </div>
              <div className="kpi-card info">
                <div className="kpi-icon info"><Clock size={24} /></div>
                <div className="kpi-content">
                  <div className="kpi-value">{formatDuration(dashboardStats.avgDuration)}</div>
                  <div className="kpi-label">Avg Duration</div>
                  <div className="kpi-meta">Per test run</div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Test Type Breakdown */}
          <ScrollReveal delay={0.2} direction="up">
            <div className="type-breakdown">
              <h3>Test Coverage by Type</h3>
              <div className="type-cards">
                {Object.entries(dashboardStats.byType).map(([type, data]) => (
                  <Link key={type} to="/test-runs" className="type-card">
                    <div className="type-name">{type}</div>
                    <div className="type-stats">
                      <span className="type-total">{data.total} runs</span>
                      <span className="type-pass-rate">
                        {data.total > 0 ? ((data.passed / data.total) * 100).toFixed(0) : 0}% pass
                      </span>
                    </div>
                    <div className="type-bar">
                      <div
                        className="type-bar-fill"
                        style={{ width: `${data.total > 0 ? (data.passed / data.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      )}

      {/* Technical View - Detailed Stats */}
      {viewMode === 'technical' && (
        <div className="technical-view">
          <ScrollReveal delay={0.1} direction="up">
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-value">{stats?.total_websites || 0}</div>
                <div className="stat-label">Websites</div>
              </div>
              <div className="stat-card stat-success">
                <div className="stat-value">{dashboardStats.passed}</div>
                <div className="stat-label">Passed</div>
                <div className="stat-progress"><div className="progress-bar" style={{ width: `${dashboardStats.passRate}%` }}></div></div>
                <div className="stat-meta">{dashboardStats.passRate}% pass rate</div>
              </div>
              <div className="stat-card stat-failure">
                <div className="stat-value">{dashboardStats.failed}</div>
                <div className="stat-label">Failed</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{dashboardStats.total}</div>
                <div className="stat-label">Total Runs</div>
                <div className="stat-meta">{dashboardStats.last24h} in last 24h</div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      )}

      {/* Quick Actions */}
      <ScrollReveal delay={0.3} direction="up">
        <div className="quick-actions-section">
          <h3>Quick Actions</h3>
          <div className="quick-actions-grid">
            <Link to="/websites" className="quick-action-card">
              <div className="quick-action-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
                <Plus size={28} />
              </div>
              <div className="quick-action-content">
                <h4>Add Website</h4>
                <p>Register a new website for testing</p>
              </div>
            </Link>
            <Link to="/websites" className="quick-action-card">
              <div className="quick-action-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                <Play size={28} />
              </div>
              <div className="quick-action-content">
                <h4>Run Tests</h4>
                <p>Execute tests on your websites</p>
              </div>
            </Link>
            <Link to="/test-runs" className="quick-action-card">
              <div className="quick-action-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
                <BarChart3 size={28} />
              </div>
              <div className="quick-action-content">
                <h4>View Results</h4>
                <p>Browse test history and analytics</p>
              </div>
            </Link>
            <Link to="/status" className="quick-action-card">
              <div className="quick-action-icon" style={{ background: '#f3e8ff', color: '#8b5cf6' }}>
                <Zap size={28} />
              </div>
              <div className="quick-action-content">
                <h4>System Status</h4>
                <p>Check service health</p>
              </div>
            </Link>
          </div>
        </div>
      </ScrollReveal>

      {/* Recent Test Runs */}
      <ScrollReveal delay={0.4} direction="up">
        <div className="recent-runs-section">
          <div className="section-header">
            <h3>Recent Test Runs</h3>
            <Link to="/test-runs" className="view-all-link">View All →</Link>
          </div>
          {recentRuns.length === 0 ? (
            <div className="empty-state">
              <Activity size={48} />
              <p>No test runs yet</p>
              <p className="text-muted">Run your first test from the Websites page</p>
            </div>
          ) : (
            <div className="runs-table-container">
              <table className="runs-table compact">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Website</th>
                    <th>Test Type</th>
                    <th>Results</th>
                    <th>Duration</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRuns.slice(0, 10).map(run => (
                    <tr key={run.id}>
                      <td className="status-cell">
                        <span className={`status-icon ${run.status === 'Pass' ? 'status-success' : 'status-error'}`}>
                          {run.status === 'Pass' ? '✓' : '✗'}
                        </span>
                      </td>
                      <td><span className="website-name">{run.website_name}</span></td>
                      <td><span className="test-type-badge">{run.test_type}</span></td>
                      <td>
                        <span className="results-text">
                          <span className="passed-count">{run.passed}</span>
                          <span className="separator">/</span>
                          <span className="total-count">{run.total_tests}</span>
                        </span>
                      </td>
                      <td className="duration-cell">
                        {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : '—'}
                      </td>
                      <td className="time-cell">
                        {new Date(run.created_at).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </ScrollReveal>
    </div>
  );
}
