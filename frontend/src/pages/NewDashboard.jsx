import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getStats, getTestRuns } from '../services/api';
import { Activity, Globe, Percent, TestTube, Heart, Plus, Play, FileText, Zap, TrendingUp, Shield } from 'lucide-react';
import { IconWorld, IconPercentage, IconFlask, IconHeartbeat, IconTrendingUp } from '@tabler/icons-react';
import {
  AnimatedCounter,
  Marquee,
  ScrollReveal,
  FadeText,
  TextGenerateEffect,
  FlipWords
} from '../components/ui';
import './NewDashboard.css';

export default function NewDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => getStats().then(res => res.data),
    refetchInterval: 10000
  });

  const { data: recentRuns } = useQuery({
    queryKey: ['recent-test-runs'],
    queryFn: () => getTestRuns({ limit: 10 }).then(res => res.data),
    refetchInterval: 10000
  });

  // Calculate pass rate from stats
  const passRate = stats && (stats.tests_passed + stats.tests_failed) > 0
    ? Math.round((stats.tests_passed / (stats.tests_passed + stats.tests_failed)) * 100)
    : 0;

  return (
    <div className="new-dashboard">

      <div className="dashboard-header" style={{ position: 'relative', zIndex: 10 }}>
        <div>
          <TextGenerateEffect words="QA Testing Dashboard" className="dashboard-title" />
          <p>Automated website quality assurance and performance monitoring</p>
        </div>
        <div className="header-badge">
          <Shield size={16} />
          <FlipWords words={["System Active", "All Systems Go", "Running Smooth"]} className="status-flip" />
        </div>
      </div>

      {/* Live Activity Marquee */}
      {recentRuns && recentRuns.length > 0 && (
        <div className="marquee-container">
          <div className="marquee-label">
            <Activity size={14} />
            <span>Recent Activity</span>
          </div>
          <Marquee pauseOnHover className="marquee-content">
            {recentRuns.slice(0, 10).map((run) => (
              <div key={run.id} className="marquee-item">
                <span className={`status-dot ${run.status === 'Pass' ? 'success' : 'error'}`}></span>
                <span className="test-name">{run.test_type}</span>
                <span className="website-tag">{run.website_name}</span>
              </div>
            ))}
          </Marquee>
        </div>
      )}

      {stats && (
        <div className="row row-cards mb-4">
          <ScrollReveal delay={0.1} direction="up" className="col-sm-6 col-lg-3">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <div className="subheader">Total Websites</div>
                  <div className="ms-auto">
                    <span className="status-dot status-dot-animated bg-green"></span>
                  </div>
                </div>
                <div className="d-flex align-items-baseline">
                  <div className="h1 mb-0 me-2">
                    <AnimatedCounter value={stats.total_websites} />
                  </div>
                  <div className="me-auto">
                    <span className="text-green d-inline-flex align-items-center lh-1">
                      <IconTrendingUp size={16} className="me-1" />
                      Active
                    </span>
                  </div>
                </div>
              </div>
              <div className="card-body border-top p-2">
                <div className="d-flex align-items-center text-muted">
                  <IconWorld size={16} className="me-2" />
                  <small>Monitored sites</small>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2} direction="up" className="col-sm-6 col-lg-3">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <div className="subheader">Pass Rate (7d)</div>
                </div>
                <div className="d-flex align-items-baseline">
                  <div className="h1 mb-3 me-2">
                    <AnimatedCounter value={passRate} />%
                  </div>
                </div>
                <div className="progress progress-sm">
                  <div className="progress-bar bg-success" style={{ width: `${passRate}%` }}></div>
                </div>
              </div>
              <div className="card-body border-top p-2">
                <div className="d-flex align-items-center text-muted">
                  <IconPercentage size={16} className="me-2" />
                  <small>Success rate</small>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.3} direction="up" className="col-sm-6 col-lg-3">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <div className="subheader">Total Tests</div>
                </div>
                <div className="d-flex align-items-baseline">
                  <div className="h1 mb-0 me-2">
                    <AnimatedCounter value={stats.total_tests} />
                  </div>
                  <div className="me-auto">
                    <span className="badge bg-primary-lt">
                      {stats.tests_passed} passed
                    </span>
                  </div>
                </div>
              </div>
              <div className="card-body border-top p-2">
                <div className="d-flex align-items-center text-muted">
                  <IconFlask size={16} className="me-2" />
                  <small>Test executions</small>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.4} direction="up" className="col-sm-6 col-lg-3">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <div className="subheader">System Health</div>
                  <div className="ms-auto">
                    <span className={`status-dot ${stats.active_processes > 0 ? 'status-dot-animated bg-green' : 'bg-secondary'}`}></span>
                  </div>
                </div>
                <div className="d-flex align-items-baseline">
                  <div className="h1 mb-0 me-2">
                    {stats.active_processes > 0 ? 'Active' : 'Idle'}
                  </div>
                </div>
              </div>
              <div className="card-body border-top p-2">
                <div className="d-flex align-items-center text-muted">
                  <IconHeartbeat size={16} className="me-2" />
                  <small>{stats.active_processes} processes</small>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      )}

      <ScrollReveal delay={0.2} direction="up">
        <section className="section">
          <FadeText direction="right">
            <h2>Recent Test Runs</h2>
          </FadeText>
          <p className="section-subtitle">Latest 10 test executions across all websites</p>

        {!recentRuns || recentRuns.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Activity size={48} />
            </div>
            <p>No test runs yet</p>
            <p className="text-muted">Run your first test from the Websites page to see results here</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-vcenter card-table">
              <thead>
                <tr>
                  <th className="w-1">Status</th>
                  <th>Website</th>
                  <th>Test Type</th>
                  <th>Duration</th>
                  <th>Ran At</th>
                </tr>
              </thead>
              <tbody>
                {recentRuns.slice(0, 10).map(run => (
                  <tr key={run.id}>
                    <td>
                      <span className={`badge bg-${run.status === 'Pass' ? 'success' : 'danger'}`}>
                        {run.status === 'Pass' ? '✓' : '✗'}
                      </span>
                    </td>
                    <td className="fw-bold">{run.website_name}</td>
                    <td>
                      <span className="badge bg-info">{run.test_type}</span>
                    </td>
                    <td className="text-muted">
                      {run.duration_ms ? (run.duration_ms / 1000).toFixed(1) + 's' : '—'}
                    </td>
                    <td className="text-muted">
                      {new Date(run.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.3} direction="up">
        <section className="section">
          <FadeText direction="right">
            <h2>Quick Actions</h2>
          </FadeText>
          <p className="section-subtitle">Common tasks and navigation shortcuts</p>

        <div className="quick-actions-grid">
          <ScrollReveal delay={0.1} direction="left">
            <Link to="/websites" className="quick-action-card">
              <div className="quick-action-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                <Plus size={32} />
              </div>
              <h3>Add Website</h3>
              <p>Register a new website for testing</p>
            </Link>
          </ScrollReveal>

          <ScrollReveal delay={0.2} direction="up">
            <Link to="/websites" className="quick-action-card">
              <div className="quick-action-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                <Play size={32} />
              </div>
              <h3>Run Tests</h3>
              <p>Execute tests on your websites</p>
            </Link>
          </ScrollReveal>

          <ScrollReveal delay={0.3} direction="right">
            <Link to="/test-runs" className="quick-action-card">
              <div className="quick-action-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                <FileText size={32} />
              </div>
              <h3>View All Test Runs</h3>
              <p>Browse complete test history</p>
            </Link>
          </ScrollReveal>
        </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
