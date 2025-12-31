import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getStats, getTestRuns } from '../services/api';
import { Activity, Globe, Percent, TestTube, Heart, Plus, Play, FileText, Zap, TrendingUp, Shield } from 'lucide-react';
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
        <div className="stats-overview">
          <ScrollReveal delay={0.1} direction="up">
            <div className="stat-box">
              <div className="stat-icon" style={{ background: '#dbeafe' }}>
                <Globe size={24} color="#2563eb" />
              </div>
              <div>
                <div className="stat-label">Total Websites</div>
                <div className="stat-value">
                  <AnimatedCounter value={stats.total_websites} />
                </div>
                <div className="stat-trend positive">
                  <TrendingUp size={14} />
                  <span>Active</span>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2} direction="up">
            <div className="stat-box">
              <div className="stat-icon" style={{ background: '#dcfce7' }}>
                <Percent size={24} color="#16a34a" />
              </div>
              <div>
                <div className="stat-label">Pass Rate (7d)</div>
                <div className="stat-value">
                  <AnimatedCounter value={passRate} />%
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.3} direction="up">
            <div className="stat-box">
              <div className="stat-icon" style={{ background: '#e0e7ff' }}>
                <TestTube size={24} color="#4f46e5" />
              </div>
              <div>
                <div className="stat-label">Total Tests</div>
                <div className="stat-value">
                  <AnimatedCounter value={stats.total_tests} />
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.4} direction="up">
            <div className="stat-box">
              <div className="stat-icon" style={{ background: '#fce7f3' }}>
                <Heart size={24} color="#ec4899" />
              </div>
              <div>
                <div className="stat-label">System Health</div>
                <div className="stat-value">
                  {stats.active_processes > 0 ? 'Active' : 'Idle'}
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
          <div className="compact-table-container">
            <table className="compact-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>Status</th>
                  <th>Website</th>
                  <th>Test Type</th>
                  <th>Duration</th>
                  <th>Ran At</th>
                </tr>
              </thead>
              <tbody>
                {recentRuns.slice(0, 10).map(run => (
                  <tr key={run.id}>
                    <td className="status-cell">
                      <span className={`status-icon status-${run.status === 'Pass' ? 'success' : 'error'}`}>
                        {run.status === 'Pass' ? '✓' : '✗'}
                      </span>
                    </td>
                    <td className="website-name">{run.website_name}</td>
                    <td className="resource-text">{run.test_type}</td>
                    <td className="duration-cell">{run.duration_ms ? (run.duration_ms / 1000).toFixed(1) + 's' : '—'}</td>
                    <td className="time-cell">{new Date(run.created_at).toLocaleString()}</td>
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
