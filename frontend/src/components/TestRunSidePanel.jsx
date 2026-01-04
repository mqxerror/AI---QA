import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X, RefreshCw, ExternalLink, FileDown, Shield, Lock, Globe, Image,
  Zap, Activity, BarChart3, Users, AlertTriangle, AlertCircle,
  HelpCircle, Lightbulb, Server, Clock, Wifi, Bug, PieChart, Code,
  TrendingUp, CheckCircle2, XCircle, Target, Gauge, Eye, Hash,
  Ticket, EyeOff, GitCompare, Copy, Check, Sparkles, ArrowUpRight,
  ChevronRight, FileText, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet } from './ui/Sheet';
import {
  getTestRun, generateReport, runSmokeTest, runPerformanceTest,
  runPixelAudit, runLoadTest, runAccessibilityTest, runSecurityScan,
  runSEOAudit, runVisualRegression
} from '../services/api';
import VisualRegressionGallery from './visualizations/VisualRegressionGallery';

// Circular Progress component
function CircularProgress({ value, size = 120, color = 'auto' }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const getColor = () => {
    if (color === 'purple') return '#7c3aed';
    if (color !== 'auto') return color;
    if (value >= 90) return '#10b981';
    if (value >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={getColor()} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)', textAlign: 'center'
      }}>
        <div style={{ fontSize: size * 0.28, fontWeight: 700, color: getColor() }}>{value}</div>
        <div style={{ fontSize: size * 0.12, color: '#6b7280' }}>Score</div>
      </div>
    </div>
  );
}

// Failure Analysis
function analyzeTestFailure(runDetails) {
  if (!runDetails) return null;

  const status = runDetails.status?.toLowerCase();
  const totalTests = runDetails.total_tests || 0;
  const passed = runDetails.passed || 0;
  const failed = runDetails.failed || 0;
  const testType = runDetails.test_type || 'Test';
  const errorMessage = runDetails.error_message || runDetails.error || '';
  const duration = runDetails.duration_ms || 0;

  if (status === 'pass' && failed === 0) return null;

  const analysis = {
    hasIssue: false,
    severity: 'info',
    icon: HelpCircle,
    title: '',
    explanation: '',
    possibleCauses: [],
    suggestions: [],
    technicalDetails: []
  };

  if (status === 'fail' && totalTests === 0 && passed === 0 && failed === 0) {
    analysis.hasIssue = true;
    analysis.severity = 'critical';
    analysis.icon = AlertCircle;
    analysis.title = 'Test Execution Failed';
    analysis.explanation = `The ${testType} couldn't complete its execution. No test results were recorded.`;

    if (testType === 'Load Test') {
      analysis.possibleCauses = [
        'Target server is unreachable or not responding',
        'Network connectivity issues',
        'Invalid URL or domain configuration',
        'Target server returned an error before load test could start'
      ];
      analysis.suggestions = [
        'Verify the website URL is correct and accessible',
        'Check if the target server is running and healthy',
        'Ensure network connectivity from the test environment'
      ];
    } else if (testType === 'Performance') {
      analysis.possibleCauses = [
        'Page failed to load within timeout period',
        'Lighthouse audit crashed during execution',
        'Browser instance failed to start'
      ];
      analysis.suggestions = [
        'Verify the page loads correctly in a browser',
        'Check if the URL requires authentication',
        'Increase the test timeout if the page is slow'
      ];
    } else {
      analysis.possibleCauses = [
        'Connection to target failed',
        'Test runner crashed unexpectedly',
        'Configuration error in test setup'
      ];
      analysis.suggestions = [
        'Check the target URL is accessible',
        'Review test configuration',
        'Check server logs for detailed error messages'
      ];
    }

    if (errorMessage) analysis.technicalDetails.push(`Error: ${errorMessage}`);
    if (duration > 0) analysis.technicalDetails.push(`Ran for ${(duration / 1000).toFixed(1)}s before failing`);

    return analysis;
  }

  if (failed > 0) {
    analysis.hasIssue = true;
    analysis.severity = failed > (totalTests / 2) ? 'error' : 'warning';
    analysis.icon = AlertTriangle;
    analysis.title = `${failed} Test${failed > 1 ? 's' : ''} Failed`;
    const failRate = totalTests > 0 ? ((failed / totalTests) * 100).toFixed(0) : 0;
    analysis.explanation = `${failRate}% of tests did not pass. Review the detailed results below.`;
    return analysis;
  }

  return null;
}

// Panel Header
function PanelHeader({ runDetails, onClose, onRefresh, onRetest, isLoading, isRetesting }) {
  const statusColor = runDetails?.status?.toLowerCase() === 'pass' ? '#10b981' : '#ef4444';

  return (
    <div style={{
      padding: '16px 24px',
      borderBottom: '2px solid #e5e7eb',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{
              width: '32px', height: '32px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: statusColor + '20', color: statusColor
            }}>
              {runDetails?.status?.toLowerCase() === 'pass' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
              {runDetails?.test_type || 'Test Run'}
            </h2>
            <span style={{
              padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
              backgroundColor: statusColor + '20', color: statusColor
            }}>
              {runDetails?.status || 'Unknown'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
            <span style={{ fontWeight: 500 }}>{runDetails?.website_name}</span>
            <span>Run #{runDetails?.id}</span>
            <span>{runDetails?.created_at ? new Date(runDetails.created_at).toLocaleString() : ''}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Retest Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Retest clicked, testType:', runDetails?.test_type);
              onRetest();
            }}
            disabled={isRetesting || isLoading}
            title="Run this test again"
            className="retest-btn"
            style={{
              padding: '6px 12px',
              border: 'none',
              background: isRetesting ? '#d1fae5' : '#ecfdf5',
              color: '#059669',
              cursor: isRetesting ? 'wait' : 'pointer',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={14} style={{ animation: isRetesting ? 'spin 1s linear infinite' : 'none', pointerEvents: 'none' }} />
            <span style={{ pointerEvents: 'none' }}>{isRetesting ? 'Running...' : 'Retest'}</span>
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px', border: 'none', background: 'transparent',
              cursor: 'pointer', borderRadius: '8px'
            }}
          >
            <X size={20} color="#6b7280" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Executive Summary View
function ExecutiveSummaryView({ runDetails, setActiveTab }) {
  const passRate = runDetails.total_tests > 0
    ? Math.round((runDetails.passed / runDetails.total_tests) * 100)
    : 0;
  const testType = runDetails.test_type?.toLowerCase();

  // Get key metrics based on test type
  const getKeyMetrics = () => {
    if (testType === 'performance' && runDetails.performance_metrics) {
      const perf = runDetails.performance_metrics;
      return [
        { label: 'Performance', value: perf.performance_score || 0, color: '#f59e0b', icon: Gauge },
        { label: 'Accessibility', value: perf.accessibility_score || 0, color: '#3b82f6', icon: Users },
        { label: 'Best Practices', value: perf.best_practices_score || 0, color: '#10b981', icon: Target },
        { label: 'SEO', value: perf.seo_score || 0, color: '#8b5cf6', icon: TrendingUp }
      ];
    }
    if (testType === 'load test' && runDetails.load_results) {
      const load = runDetails.load_results;
      return [
        { label: 'Virtual Users', value: load.virtual_users || 0, color: '#3b82f6', icon: Users },
        { label: 'Requests/sec', value: load.throughput_rps?.toFixed(1) || 0, color: '#10b981', icon: Activity },
        { label: 'Error Rate', value: `${load.error_rate?.toFixed(1) || 0}%`, color: '#ef4444', icon: AlertTriangle },
        { label: 'Total Requests', value: load.requests_total || 0, color: '#8b5cf6', icon: Server }
      ];
    }
    if (testType === 'security scan' && runDetails.security_results) {
      const sec = runDetails.security_results;
      const sslValid = sec.ssl_valid === 1 || sec.ssl_valid === true;
      return [
        { label: 'Security Score', value: sec.overall_score || 0, color: '#8b5cf6', icon: Shield },
        { label: 'SSL Status', value: sslValid ? 'Valid' : 'Invalid', color: sslValid ? '#10b981' : '#ef4444', icon: Lock },
        { label: 'Days Left', value: sec.ssl_days_remaining || 'N/A', color: '#3b82f6', icon: Clock },
        { label: 'Issues', value: (() => {
          try {
            const v = typeof sec.violations === 'string' ? JSON.parse(sec.violations) : sec.violations || [];
            return v.length;
          } catch { return 0; }
        })(), color: '#f59e0b', icon: AlertCircle }
      ];
    }
    if (testType === 'seo audit' && runDetails.seo_results) {
      const seo = runDetails.seo_results;
      return [
        { label: 'SEO Score', value: seo.overall_score || 0, color: '#3b82f6', icon: Globe },
        { label: 'Title', value: (() => {
          try {
            const m = typeof seo.meta_tags === 'string' ? JSON.parse(seo.meta_tags) : seo.meta_tags || {};
            return m.has_title ? 'Found' : 'Missing';
          } catch { return 'N/A'; }
        })(), color: '#10b981', icon: FileText },
        { label: 'Description', value: (() => {
          try {
            const m = typeof seo.meta_tags === 'string' ? JSON.parse(seo.meta_tags) : seo.meta_tags || {};
            return m.has_description ? 'Found' : 'Missing';
          } catch { return 'N/A'; }
        })(), color: '#8b5cf6', icon: Target },
        { label: 'Images', value: (() => {
          try {
            const img = typeof seo.images === 'string' ? JSON.parse(seo.images) : seo.images || {};
            return `${img.images_with_alt || 0}/${img.total_images || 0}`;
          } catch { return 'N/A'; }
        })(), color: '#f59e0b', icon: Image }
      ];
    }
    if (testType === 'accessibility' && runDetails.accessibility_results) {
      const violations = runDetails.accessibility_results || [];
      return [
        { label: 'Critical', value: violations.filter(v => v.impact === 'critical').length, color: '#dc2626', icon: XCircle },
        { label: 'Serious', value: violations.filter(v => v.impact === 'serious').length, color: '#ea580c', icon: AlertTriangle },
        { label: 'Moderate', value: violations.filter(v => v.impact === 'moderate').length, color: '#d97706', icon: AlertCircle },
        { label: 'Minor', value: violations.filter(v => v.impact === 'minor').length, color: '#3b82f6', icon: HelpCircle }
      ];
    }
    // Default metrics
    return [
      { label: 'Total', value: runDetails.total_tests || 0, color: '#6b7280', icon: Target },
      { label: 'Passed', value: runDetails.passed || 0, color: '#10b981', icon: CheckCircle2 },
      { label: 'Failed', value: runDetails.failed || 0, color: '#ef4444', icon: XCircle },
      { label: 'Duration', value: runDetails.duration_ms ? `${(runDetails.duration_ms / 1000).toFixed(1)}s` : '—', color: '#3b82f6', icon: Clock }
    ];
  };

  // Get quick insights
  const getInsights = () => {
    const insights = [];
    if (runDetails.status?.toLowerCase() === 'pass') {
      insights.push('All tests completed successfully with no critical issues.');
    } else if (runDetails.failed > 0) {
      insights.push(`${runDetails.failed} test(s) failed - review Technical Details for specifics.`);
    }
    if (testType === 'performance' && runDetails.performance_metrics) {
      const perf = runDetails.performance_metrics;
      if (perf.performance_score >= 90) insights.push('Excellent performance score - page loads quickly.');
      else if (perf.performance_score < 50) insights.push('Performance needs improvement - consider optimizing assets.');
    }
    if (testType === 'security scan' && runDetails.security_results) {
      const sec = runDetails.security_results;
      const sslValid = sec.ssl_valid === 1 || sec.ssl_valid === true;
      if (sslValid) insights.push('SSL certificate is valid and properly configured.');
      else insights.push('SSL certificate issues detected - immediate attention required.');
    }
    if (testType === 'accessibility' && runDetails.accessibility_results) {
      const violations = runDetails.accessibility_results || [];
      if (violations.length === 0) insights.push('No accessibility violations detected - great job!');
      else {
        const critical = violations.filter(v => v.impact === 'critical').length;
        if (critical > 0) insights.push(`${critical} critical accessibility issue(s) blocking users.`);
      }
    }
    if (insights.length === 0) {
      insights.push('Switch to Technical Details for comprehensive test data.');
    }
    return insights;
  };

  const metrics = getKeyMetrics();
  const insights = getInsights();

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Health Score Card */}
      <div style={{
        padding: '24px',
        background: runDetails.status?.toLowerCase() === 'pass'
          ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
          : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
        borderRadius: '16px',
        border: `2px solid ${runDetails.status?.toLowerCase() === 'pass' ? '#a7f3d0' : '#fecaca'}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              {runDetails.status?.toLowerCase() === 'pass' ? (
                <CheckCircle2 size={32} color="#059669" />
              ) : (
                <XCircle size={32} color="#dc2626" />
              )}
              <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>
                {runDetails.status?.toLowerCase() === 'pass' ? 'All Tests Passed' : 'Tests Failed'}
              </h3>
            </div>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              {runDetails.test_type} completed on {runDetails.website_name}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '48px', fontWeight: 800, color: runDetails.status?.toLowerCase() === 'pass' ? '#059669' : '#dc2626' }}>
              {passRate}%
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Pass Rate</div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {metrics.map((m, idx) => {
          const IconComponent = m.icon;
          return (
            <div key={idx} style={{
              padding: '16px', background: '#fff', borderRadius: '12px',
              border: '1px solid #e5e7eb', textAlign: 'center'
            }}>
              <IconComponent size={20} color={m.color} style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '24px', fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{m.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Insights */}
      <div style={{
        padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb'
      }}>
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lightbulb size={16} color="#f59e0b" />
          Quick Insights
        </h4>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#4b5563', lineHeight: 1.8 }}>
          {insights.map((insight, idx) => <li key={idx}>{insight}</li>)}
        </ul>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('technical')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 20px', background: '#111827', color: '#fff',
            border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
          }}
        >
          <Code size={16} />
          View Technical Report
        </button>
        {runDetails.report_url && (
          <a
            href={runDetails.report_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 20px', background: '#fff', color: '#374151',
              border: '1px solid #d1d5db', borderRadius: '10px', fontSize: '14px',
              fontWeight: 600, cursor: 'pointer', textDecoration: 'none'
            }}
          >
            <ExternalLink size={16} />
            Open HTML Report
          </a>
        )}
      </div>
    </div>
  );
}

// Failure Analysis Section
function FailureAnalysisSection({ runDetails, refetch }) {
  const analysis = analyzeTestFailure(runDetails);
  if (!analysis || !analysis.hasIssue) return null;

  const severityStyles = {
    critical: { bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', border: '#fca5a5', iconBg: '#dc2626', text: '#991b1b' },
    error: { bg: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)', border: '#f87171', iconBg: '#ef4444', text: '#b91c1c' },
    warning: { bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '#fcd34d', iconBg: '#f59e0b', text: '#92400e' },
    info: { bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '#93c5fd', iconBg: '#3b82f6', text: '#1e40af' }
  };
  const style = severityStyles[analysis.severity] || severityStyles.info;
  const IconComponent = analysis.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: style.bg, border: `2px solid ${style.border}`,
        borderRadius: '16px', padding: '24px', marginBottom: '24px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          background: style.iconBg, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0
        }}>
          <IconComponent size={24} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: style.text }}>
            {analysis.title}
          </h3>
          <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#4b5563', lineHeight: 1.5 }}>
            {analysis.explanation}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {analysis.possibleCauses.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Bug size={16} color="#6b7280" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151', textTransform: 'uppercase' }}>Possible Causes</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', listStyle: 'disc' }}>
              {analysis.possibleCauses.slice(0, 4).map((cause, idx) => (
                <li key={idx} style={{ fontSize: '13px', color: '#4b5563', marginBottom: '6px' }}>{cause}</li>
              ))}
            </ul>
          </div>
        )}
        {analysis.suggestions.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Lightbulb size={16} color="#059669" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151', textTransform: 'uppercase' }}>How to Fix</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', listStyle: 'disc' }}>
              {analysis.suggestions.slice(0, 4).map((sug, idx) => (
                <li key={idx} style={{ fontSize: '13px', color: '#4b5563', marginBottom: '6px' }}>{sug}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {analysis.technicalDetails.length > 0 && (
        <div style={{
          marginTop: '16px', padding: '12px 16px', background: 'rgba(0,0,0,0.05)',
          borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px', color: '#6b7280'
        }}>
          {analysis.technicalDetails.map((detail, idx) => <div key={idx}>{detail}</div>)}
        </div>
      )}

      <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
        <button
          onClick={refetch}
          style={{
            padding: '8px 16px', background: 'white', border: '1px solid #d1d5db',
            borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: '#374151',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <RefreshCw size={14} /> Refresh Status
        </button>
        {runDetails.website_url && (
          <a
            href={runDetails.website_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 16px', background: 'white', border: '1px solid #d1d5db',
              borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: '#374151',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              textDecoration: 'none'
            }}
          >
            <ExternalLink size={14} /> Open Target URL
          </a>
        )}
      </div>
    </motion.div>
  );
}

// Performance Section (Technical View)
function PerformanceSection({ metrics }) {
  if (!metrics) return null;

  const scores = [
    { label: 'Performance', value: metrics.performance_score, icon: '⚡' },
    { label: 'Accessibility', value: metrics.accessibility_score, icon: '♿' },
    { label: 'Best Practices', value: metrics.best_practices_score, icon: '✅' },
    { label: 'SEO', value: metrics.seo_score, icon: '🔍' }
  ];

  const lcpValue = metrics.lcp ? metrics.lcp / 1000 : metrics.lcp_ms ? metrics.lcp_ms / 1000 : null;
  const clsValue = metrics.cls;
  const fcpValue = metrics.fcp ? metrics.fcp / 1000 : metrics.fcp_ms ? metrics.fcp_ms / 1000 : null;

  const vitals = [
    { title: 'LCP', subtitle: 'Largest Contentful Paint', value: lcpValue ? `${lcpValue.toFixed(2)}s` : 'N/A', status: lcpValue ? (lcpValue < 2.5 ? 'good' : lcpValue < 4 ? 'needs-improvement' : 'poor') : 'unknown', target: '< 2.5s' },
    { title: 'CLS', subtitle: 'Cumulative Layout Shift', value: clsValue !== undefined ? clsValue.toFixed(3) : 'N/A', status: clsValue !== undefined ? (clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor') : 'unknown', target: '< 0.1' },
    { title: 'FCP', subtitle: 'First Contentful Paint', value: fcpValue ? `${fcpValue.toFixed(2)}s` : 'N/A', status: fcpValue ? (fcpValue < 1.8 ? 'good' : fcpValue < 3 ? 'needs-improvement' : 'poor') : 'unknown', target: '< 1.8s' }
  ];

  const statusColors = { good: { bg: '#dcfce7', text: '#166534' }, 'needs-improvement': { bg: '#fef3c7', text: '#92400e' }, poor: { bg: '#fee2e2', text: '#991b1b' }, unknown: { bg: '#f3f4f6', text: '#6b7280' } };

  return (
    <div style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Zap size={20} color="#eab308" /> Performance Metrics
      </h3>

      {/* Lighthouse Scores */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px',
        padding: '24px', background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)',
        borderRadius: '16px', border: '2px solid #fcd34d', marginBottom: '24px'
      }}>
        {scores.map((s, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress value={s.value || 0} size={100} color="auto" />
            <p style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
              {s.icon} {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Core Web Vitals */}
      <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Zap size={16} color="#eab308" /> Core Web Vitals
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {vitals.map((v, i) => (
          <div key={i} style={{
            padding: '20px', borderRadius: '12px', border: '2px solid #e5e7eb',
            background: statusColors[v.status].bg
          }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: statusColors[v.status].text, marginBottom: '4px' }}>
              {v.value}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>{v.title}</div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>{v.subtitle}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>Target: {v.target}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Security Section
function SecuritySection({ results }) {
  if (!results) return null;

  const headersObj = typeof results.security_headers === 'string' ? JSON.parse(results.security_headers) : results.security_headers || {};
  const headers = Object.entries(headersObj).map(([header, data]) => ({ header, present: data.present, secure: data.secure, value: data.value }));
  const violations = typeof results.violations === 'string' ? JSON.parse(results.violations) : results.violations || [];
  const score = results.overall_score || results.security_score || 0;
  const sslValid = results.ssl_valid === 1 || results.ssl_valid === true;

  return (
    <div style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Lock size={20} color="#7c3aed" /> Security Analysis
      </h3>

      {/* Score Card */}
      <div style={{
        padding: '28px', marginBottom: '24px',
        background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
        borderRadius: '16px', border: '2px solid #c4b5fd',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 700, color: '#1f2937' }}>Security Score</h4>
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6b7280' }}>
            SSL certificate, security headers, and best practices
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
            background: score >= 80 ? '#dcfce7' : score >= 60 ? '#fef3c7' : '#fee2e2',
            color: score >= 80 ? '#166534' : score >= 60 ? '#92400e' : '#991b1b'
          }}>
            {score >= 80 ? '✓ Secure' : score >= 60 ? '⚠ Moderate' : '✗ Vulnerable'}
          </div>
        </div>
        <CircularProgress value={score} size={130} color="purple" />
      </div>

      {/* SSL Certificate */}
      <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Lock size={16} color="#059669" /> SSL Certificate
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <div style={{
          padding: '16px', borderRadius: '12px',
          border: `2px solid ${sslValid ? '#86efac' : '#fca5a5'}`,
          background: sslValid ? '#f0fdf4' : '#fef2f2'
        }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: 500, textTransform: 'uppercase' }}>Status</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: sslValid ? '#059669' : '#dc2626' }}>
            {sslValid ? '✓ Valid' : '✗ Invalid'}
          </div>
        </div>
        <div style={{ padding: '16px', borderRadius: '12px', border: '2px solid #e5e7eb', background: 'white' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: 500, textTransform: 'uppercase' }}>Days Remaining</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>{results.ssl_days_remaining || 'N/A'}</div>
        </div>
        <div style={{ padding: '16px', borderRadius: '12px', border: '2px solid #e5e7eb', background: 'white' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: 500, textTransform: 'uppercase' }}>Issuer</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {results.ssl_issuer || 'N/A'}
          </div>
        </div>
      </div>

      {/* Security Headers */}
      {headers.length > 0 && (
        <>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} color="#7c3aed" /> Security Headers
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '24px' }}>
            {headers.map((h, i) => (
              <div key={i} style={{
                padding: '12px 14px', borderRadius: '8px', background: 'white',
                border: `1px solid ${h.present ? (h.secure ? '#86efac' : '#fcd34d') : '#fca5a5'}`,
                borderLeft: `4px solid ${h.present ? (h.secure ? '#22c55e' : '#f59e0b') : '#ef4444'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{h.header}</span>
                  <span style={{
                    fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px',
                    background: h.present ? (h.secure ? '#dcfce7' : '#fef3c7') : '#fee2e2',
                    color: h.present ? (h.secure ? '#166534' : '#92400e') : '#991b1b'
                  }}>
                    {h.present ? (h.secure ? '✓ Secure' : '⚠ Weak') : '✗ Missing'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Violations */}
      {violations.length > 0 && (
        <>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} color="#dc2626" /> Security Issues
            <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 600, padding: '2px 10px', borderRadius: '12px', background: '#fee2e2', color: '#dc2626' }}>
              {violations.length} found
            </span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {violations.map((v, i) => {
              const sevStyles = { high: { bg: '#fff7ed', border: '#ea580c', badge: '#ea580c', badgeBg: '#ffedd5' }, medium: { bg: '#fffbeb', border: '#d97706', badge: '#d97706', badgeBg: '#fef3c7' }, low: { bg: '#eff6ff', border: '#2563eb', badge: '#2563eb', badgeBg: '#dbeafe' } };
              const st = sevStyles[v.severity?.toLowerCase()] || sevStyles.medium;
              return (
                <div key={i} style={{
                  padding: '16px 18px', borderRadius: '12px', background: st.bg,
                  borderLeft: `4px solid ${st.border}`, border: `1px solid ${st.border}20`
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ padding: '4px 10px', borderRadius: '6px', background: st.badgeBg, color: st.badge, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>
                      {v.severity}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h5 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 600, color: '#111827' }}>{v.issue}</h5>
                      <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#4b5563' }}>{v.description}</p>
                      {v.recommendation && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', background: 'rgba(255,255,255,0.7)', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
                          <Lightbulb size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Recommendation</span>
                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#374151' }}>{v.recommendation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// Load Test Section
function LoadTestSection({ results }) {
  if (!results) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Activity size={48} color="#6b7280" style={{ marginBottom: '12px', opacity: 0.5 }} />
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>No Load Test Data</h3>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>Load test results are not available for this run.</p>
      </div>
    );
  }

  const hasData = results.requests_total > 0 || results.latency_p50 != null;

  return (
    <div style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Activity size={20} color="#3b82f6" /> Load Test Results
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Virtual Users', value: results.virtual_users || 0, color: '#3b82f6' },
          { label: 'Duration', value: `${results.duration_seconds || 0}s`, color: '#6b7280' },
          { label: 'Total Requests', value: results.requests_total || 0, color: '#10b981' },
          { label: 'Failed', value: results.requests_failed || 0, color: '#ef4444' }
        ].map((m, i) => (
          <div key={i} style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>{m.label}</div>
          </div>
        ))}
      </div>

      <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Latency Percentiles</h4>
      {hasData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: 'P50', value: results.latency_p50 },
            { label: 'P90', value: results.latency_p90 },
            { label: 'P95', value: results.latency_p95 },
            { label: 'P99', value: results.latency_p99 }
          ].map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '40px', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>{p.label}</span>
              <div style={{ flex: 1, height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min((p.value || 0) / 10, 100)}%`, backgroundColor: '#3b82f6', borderRadius: '4px' }} />
              </div>
              <span style={{ width: '60px', fontSize: '13px', fontWeight: 600, color: '#374151', textAlign: 'right' }}>{p.value?.toFixed(0) || 0}ms</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d' }}>
          <p style={{ fontSize: '13px', color: '#92400e', margin: 0 }}>Latency data was not captured during this test run.</p>
        </div>
      )}

      {(results.throughput_rps != null || results.error_rate != null) && (
        <div style={{ marginTop: '20px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Throughput</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div style={{ padding: '16px', backgroundColor: '#ecfdf5', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>{results.throughput_rps?.toFixed(1) || 0}</div>
              <div style={{ fontSize: '12px', color: '#065f46' }}>Requests/sec</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: results.error_rate > 5 ? '#fef2f2' : '#f0f9ff', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: results.error_rate > 5 ? '#ef4444' : '#3b82f6' }}>{results.error_rate?.toFixed(1) || 0}%</div>
              <div style={{ fontSize: '12px', color: results.error_rate > 5 ? '#991b1b' : '#1e40af' }}>Error Rate</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// SEO Section
function SEOSection({ results }) {
  if (!results) return null;

  const meta = typeof results.meta_tags === 'string' ? JSON.parse(results.meta_tags) : results.meta_tags || {};
  const headings = typeof results.headings === 'string' ? JSON.parse(results.headings) : results.headings || {};
  const images = typeof results.images === 'string' ? JSON.parse(results.images) : results.images || {};

  return (
    <div style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Globe size={20} color="#2563eb" /> SEO Analysis
      </h3>

      {/* Score */}
      <div style={{
        marginBottom: '24px', padding: '24px',
        background: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)',
        borderRadius: '16px', border: '2px solid #bfdbfe',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Overall SEO Score</h4>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>Meta tags, content structure, and technical SEO</p>
          <span style={{
            display: 'inline-block', padding: '4px 12px', borderRadius: '12px',
            fontSize: '12px', fontWeight: 600,
            background: results.overall_score >= 80 ? '#dcfce7' : results.overall_score >= 60 ? '#fef3c7' : '#fee2e2',
            color: results.overall_score >= 80 ? '#166534' : results.overall_score >= 60 ? '#92400e' : '#991b1b'
          }}>
            {results.overall_score >= 80 ? '✓ Excellent' : results.overall_score >= 60 ? '⚠ Good' : '✗ Needs Work'}
          </span>
        </div>
        <CircularProgress value={results.overall_score || 0} size={140} color="auto" />
      </div>

      {/* Meta Tags */}
      <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>📄 Meta Tags</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div style={{ padding: '14px', backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Title
            <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: meta.has_title ? '#dcfce7' : '#fee2e2', color: meta.has_title ? '#166534' : '#991b1b' }}>
              {meta.has_title ? '✓ Found' : '✗ Missing'}
            </span>
          </div>
          <div style={{ fontWeight: 500, color: '#111827', fontSize: '14px' }}>{meta.title || 'Not set'}</div>
          {meta.title_length && <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>{meta.title_length} characters</div>}
        </div>
        <div style={{ padding: '14px', backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Description
            <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: meta.has_description ? '#dcfce7' : '#fee2e2', color: meta.has_description ? '#166534' : '#991b1b' }}>
              {meta.has_description ? '✓ Found' : '✗ Missing'}
            </span>
          </div>
          <div style={{ fontWeight: 500, color: '#111827', fontSize: '13px' }}>{(meta.description || 'Not set').substring(0, 80)}...</div>
        </div>
      </div>

      {/* Headings & Images */}
      <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>📊 Content Structure</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <div style={{ padding: '16px', backgroundColor: headings.h1_count === 1 ? '#ecfdf5' : '#fef2f2', borderRadius: '10px', textAlign: 'center', border: `1px solid ${headings.h1_count === 1 ? '#86efac' : '#fca5a5'}` }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: headings.h1_count === 1 ? '#059669' : '#dc2626' }}>{headings.h1_count || 0}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>H1 Tags</div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '10px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#8b5cf6' }}>{headings.h2_count || 0}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>H2 Tags</div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#ecfdf5', borderRadius: '10px', textAlign: 'center', border: '1px solid #86efac' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#059669' }}>{images.images_with_alt || 0}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>With Alt</div>
        </div>
        <div style={{ padding: '16px', backgroundColor: images.images_without_alt > 0 ? '#fef2f2' : '#f9fafb', borderRadius: '10px', textAlign: 'center', border: `1px solid ${images.images_without_alt > 0 ? '#fca5a5' : '#e5e7eb'}` }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: images.images_without_alt > 0 ? '#dc2626' : '#6b7280' }}>{images.images_without_alt || 0}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Missing Alt</div>
        </div>
      </div>
    </div>
  );
}

// Accessibility Section
function AccessibilitySection({ results }) {
  if (!results || results.length === 0) {
    return (
      <div style={{ padding: '40px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderRadius: '16px', border: '2px solid #86efac', textAlign: 'center', margin: '24px' }}>
        <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', background: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={32} color="white" />
        </div>
        <h4 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: '#166534' }}>No Accessibility Issues Found!</h4>
        <p style={{ margin: 0, fontSize: '14px', color: '#15803d' }}>Great job! This page passed all accessibility checks.</p>
      </div>
    );
  }

  const counts = {
    critical: results.filter(v => v.impact === 'critical').length,
    serious: results.filter(v => v.impact === 'serious').length,
    moderate: results.filter(v => v.impact === 'moderate').length,
    minor: results.filter(v => v.impact === 'minor').length
  };

  const impactColors = {
    critical: { bg: '#fef2f2', border: '#dc2626', badge: '#dc2626', badgeBg: '#fee2e2' },
    serious: { bg: '#fff7ed', border: '#ea580c', badge: '#ea580c', badgeBg: '#ffedd5' },
    moderate: { bg: '#fffbeb', border: '#d97706', badge: '#d97706', badgeBg: '#fef3c7' },
    minor: { bg: '#eff6ff', border: '#2563eb', badge: '#2563eb', badgeBg: '#dbeafe' }
  };

  return (
    <div style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Shield size={20} color="#059669" /> Accessibility Analysis
      </h3>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {Object.entries(counts).map(([sev, count]) => {
          const config = { critical: { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', desc: 'Blocks users' }, serious: { color: '#ea580c', bg: '#fff7ed', border: '#fdba74', desc: 'Major barriers' }, moderate: { color: '#d97706', bg: '#fffbeb', border: '#fcd34d', desc: 'Some difficulty' }, minor: { color: '#2563eb', bg: '#eff6ff', border: '#93c5fd', desc: 'Minor issues' } };
          const c = config[sev];
          return (
            <div key={sev} style={{ padding: '16px', borderRadius: '12px', background: c.bg, border: `2px solid ${c.border}`, textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: c.color }}>{count}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: c.color, marginBottom: '2px', textTransform: 'capitalize' }}>{sev}</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>{c.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Violations List */}
      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#374151' }}>
        <AlertTriangle size={18} color="#dc2626" />
        Detected Violations
        <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 600, padding: '2px 10px', borderRadius: '12px', background: '#fee2e2', color: '#dc2626' }}>
          {results.length} issues
        </span>
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {results.map((v, i) => {
          const colors = impactColors[v.impact] || impactColors.moderate;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              style={{ padding: '16px 18px', borderRadius: '12px', background: colors.bg, borderLeft: `4px solid ${colors.border}`, border: `1px solid ${colors.border}20` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ padding: '4px 10px', borderRadius: '6px', background: colors.badgeBg, color: colors.badge, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>
                  {v.impact}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#111827' }}>{v.help}</h5>
                    {v.nodes_affected && (
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(0,0,0,0.05)', color: '#6b7280' }}>
                        {v.nodes_affected} element{v.nodes_affected > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#4b5563', lineHeight: 1.5 }}>{v.description}</p>
                  {v.help_url && (
                    <a href={v.help_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#2563eb', textDecoration: 'none' }}>
                      <ExternalLink size={12} /> Learn more
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Pixel Audit Section
function PixelAuditSection({ results }) {
  if (!results || results.length === 0) {
    return (
      <div style={{ padding: '40px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius: '16px', border: '2px dashed #cbd5e1', textAlign: 'center', margin: '24px' }}>
        <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Activity size={28} color="#64748b" />
        </div>
        <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600, color: '#334155' }}>No Pixel Data Available</h4>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>No pixels were configured to check or the page failed to load.</p>
      </div>
    );
  }

  const detected = results.filter(p => p.found === 1 || p.found === true);
  const missing = results.filter(p => p.found === 0 || p.found === false);

  return (
    <div style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Activity size={20} color="#8b5cf6" /> Pixel Detection Results
      </h3>

      {/* Summary */}
      <div style={{ marginBottom: '24px', padding: '24px', background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', borderRadius: '16px', border: '2px solid #c4b5fd' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#22c55e' }}>{detected.length}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#166534' }}>Detected</div>
          </div>
          <div style={{ borderLeft: '1px solid #c4b5fd', borderRight: '1px solid #c4b5fd' }}>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#dc2626' }}>{missing.length}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#991b1b' }}>Missing</div>
          </div>
          <div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#7c3aed' }}>{results.length}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>Total Checked</div>
          </div>
        </div>
      </div>

      {/* Active Pixels */}
      {detected.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#166534' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
            Active Pixels
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {detected.map((pixel, i) => (
              <div key={i} style={{ padding: '18px', borderRadius: '12px', background: '#f0fdf4', border: '2px solid #86efac' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'white', border: '2px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#059669' }}>
                      {pixel.pixel_vendor?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h5 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#166534' }}>{pixel.pixel_vendor}</h5>
                      {pixel.pixel_id && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>ID: <code style={{ background: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>{pixel.pixel_id}</code></div>}
                    </div>
                  </div>
                  <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, background: '#22c55e', color: 'white', textTransform: 'uppercase' }}>Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Pixels */}
      {missing.length > 0 && (
        <div>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#991b1b' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626' }} />
            Missing Pixels
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {missing.map((pixel, i) => (
              <div key={i} style={{ padding: '18px', borderRadius: '12px', background: '#fef2f2', border: '2px solid #fca5a5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'white', border: '2px solid #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#dc2626' }}>
                    {pixel.pixel_vendor?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#991b1b' }}>{pixel.pixel_vendor}</h5>
                    {pixel.pixel_id && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Expected ID: <code style={{ background: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>{pixel.pixel_id}</code></div>}
                  </div>
                </div>
                <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, background: '#dc2626', color: 'white', textTransform: 'uppercase' }}>Not Found</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Smoke Test Section
function SmokeTestSection({ results, runDetails }) {
  return (
    <div style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Zap size={20} color="#f59e0b" /> Smoke Test Results
      </h3>

      {results && results.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {results.map((r, i) => (
            <div key={i} style={{
              padding: '16px', borderRadius: '12px',
              background: r.status === 'Pass' ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${r.status === 'Pass' ? '#86efac' : '#fca5a5'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{r.test_name}</div>
                  {r.category && <div style={{ fontSize: '12px', color: '#6b7280' }}>{r.category}</div>}
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                  background: r.status === 'Pass' ? '#22c55e' : '#ef4444', color: 'white'
                }}>
                  {r.status}
                </span>
              </div>
              {r.error_message && (
                <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '6px', fontSize: '12px', color: '#6b7280', fontFamily: 'monospace' }}>
                  {r.error_message}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
          <FileText size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p>No detailed smoke test results available.</p>
        </div>
      )}
    </div>
  );
}

// Main Panel Component
export default function TestRunSidePanel({ isOpen, onClose, testRunId, initialData, onTestStarted }) {
  const [generatingReport, setGeneratingReport] = useState(false);
  const [activeTab, setActiveTab] = useState('executive');
  const [isRetesting, setIsRetesting] = useState(false);

  const { data: runDetails, isLoading, refetch } = useQuery({
    queryKey: ['testRun', testRunId],
    queryFn: () => getTestRun(testRunId),
    enabled: !!testRunId && isOpen,
    initialData: initialData ? { data: initialData } : undefined,
    select: (res) => res.data
  });

  const handleRetest = async () => {
    if (!runDetails || isRetesting) return;

    const websiteId = runDetails.website_id;
    const testType = runDetails.test_type?.toLowerCase();

    setIsRetesting(true);
    try {
      let response;

      // Call the appropriate test API based on test type
      switch (testType) {
        case 'smoke':
          response = await runSmokeTest(websiteId);
          break;
        case 'performance':
          response = await runPerformanceTest(websiteId);
          break;
        case 'pixel audit':
          response = await runPixelAudit(websiteId);
          break;
        case 'load test':
          response = await runLoadTest(websiteId);
          break;
        case 'accessibility':
          response = await runAccessibilityTest(websiteId);
          break;
        case 'security scan':
          response = await runSecurityScan(websiteId);
          break;
        case 'seo audit':
          response = await runSEOAudit(websiteId);
          break;
        case 'visual regression':
          response = await runVisualRegression(websiteId);
          break;
        default:
          console.error('Unknown test type:', testType);
          return;
      }

      // Notify parent component if callback provided
      if (onTestStarted && response?.data) {
        onTestStarted(response.data);
      }

      // Close the panel and let user see the new test in the list
      onClose();

    } catch (error) {
      console.error('Failed to start retest:', error);
    } finally {
      setIsRetesting(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!runDetails) return;
    setGeneratingReport(true);
    try {
      const response = await generateReport(testRunId);
      if (response.data?.pdfPath) {
        // Use relative URL - nginx will proxy to backend
        window.open(response.data.pdfPath, '_blank');
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setGeneratingReport(false);
    }
  };

  const testType = runDetails?.test_type?.toLowerCase();

  return (
    <Sheet open={isOpen} onClose={onClose}>
      {runDetails && (
        <>
          <PanelHeader runDetails={runDetails} onClose={onClose} onRefresh={refetch} onRetest={handleRetest} isLoading={isLoading} isRetesting={isRetesting} />

          {/* Stats Strip - Adaptive based on test type */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '12px 24px', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
            {testType === 'load test' && runDetails.load_results ? (
              // Load Test specific stats
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>{runDetails.load_results.virtual_users || 0}</span>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>VUs</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>{runDetails.load_results.requests_total || 0}</span>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Requests</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>{runDetails.load_results.throughput_rps?.toFixed(1) || 0}</span>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Req/s</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: runDetails.load_results.error_rate > 0 ? '#ef4444' : '#10b981' }}>
                    {runDetails.load_results.error_rate?.toFixed(1) || 0}%
                  </span>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Errors</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="#6b7280" />
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>{runDetails.load_results.duration_seconds || 30}s</span>
                </div>
              </>
            ) : (
              // Default stats for other test types
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>{runDetails.total_tests || 0}</span>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Total</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>{runDetails.passed || 0}</span>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Passed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444' }}>{runDetails.failed || 0}</span>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Failed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="#6b7280" />
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>{runDetails.duration_ms ? `${(runDetails.duration_ms / 1000).toFixed(2)}s` : '—'}</span>
                </div>
              </>
            )}
          </div>

          {/* Tab Toggle */}
          <div style={{ display: 'flex', gap: '8px', padding: '16px 24px', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
            <button
              onClick={() => setActiveTab('executive')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', border: 'none', borderRadius: '10px',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                background: activeTab === 'executive' ? '#111827' : '#f3f4f6',
                color: activeTab === 'executive' ? '#fff' : '#6b7280'
              }}
            >
              <PieChart size={16} />
              Executive Summary
            </button>
            <button
              onClick={() => setActiveTab('technical')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', border: 'none', borderRadius: '10px',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                background: activeTab === 'technical' ? '#111827' : '#f3f4f6',
                color: activeTab === 'technical' ? '#fff' : '#6b7280'
              }}
            >
              <Code size={16} />
              Technical Details
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activeTab === 'executive' ? (
              <ExecutiveSummaryView runDetails={runDetails} setActiveTab={setActiveTab} />
            ) : (
              <>
                <FailureAnalysisSection runDetails={runDetails} refetch={refetch} />

                {testType === 'performance' && <PerformanceSection metrics={runDetails.performance_metrics || runDetails.metrics} />}
                {testType === 'security scan' && <SecuritySection results={runDetails.security_results} />}
                {testType === 'load test' && <LoadTestSection results={runDetails.load_results} />}
                {testType === 'seo audit' && <SEOSection results={runDetails.seo_results} />}
                {testType === 'accessibility' && <AccessibilitySection results={runDetails.accessibility_results} />}
                {testType === 'pixel audit' && <PixelAuditSection results={runDetails.pixel_results} />}
                {testType === 'smoke' && <SmokeTestSection results={runDetails.results} runDetails={runDetails} />}
                {testType === 'visual regression' && runDetails.visual_results && (
                  <div style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Image size={20} color="#8b5cf6" /> Visual Regression
                    </h3>
                    <VisualRegressionGallery
                      visualData={runDetails.visual_results}
                      comparisons={runDetails.visual_results.comparisons}
                    />
                  </div>
                )}

                {/* Fallback for unknown types */}
                {!['performance', 'security scan', 'load test', 'seo audit', 'accessibility', 'pixel audit', 'visual regression', 'smoke'].includes(testType) && (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                    <FileText size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <p>No detailed view available for this test type.</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 24px', borderTop: '2px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>
              Run ID: <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{testRunId}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={handleDownloadReport}
                disabled={generatingReport}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 16px', backgroundColor: '#e5e7eb', color: '#374151',
                  border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                  cursor: generatingReport ? 'not-allowed' : 'pointer', opacity: generatingReport ? 0.6 : 1
                }}
              >
                <FileDown size={16} />
                {generatingReport ? 'Generating...' : 'Download PDF'}
              </button>
              <button
                onClick={onClose}
                style={{ padding: '10px 16px', backgroundColor: '#4b5563', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {isLoading && !runDetails && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw size={32} color="#6b7280" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}
    </Sheet>
  );
}
