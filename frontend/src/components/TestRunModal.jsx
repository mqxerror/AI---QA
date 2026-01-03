import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, RefreshCw, ExternalLink, FileDown, Shield, Lock, Globe, Image, Zap, Activity, BarChart3, Users, AlertTriangle, AlertCircle, HelpCircle, Lightbulb, Server, Clock, Wifi, Bug, PieChart, Code, TrendingUp, CheckCircle2, XCircle, Target, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTestRun, generateReport } from '../services/api';
import { useTestResultUpdates } from '../hooks/useRealtimeUpdates';
import VisualRegressionGallery from './visualizations/VisualRegressionGallery';
import CircularProgress from './reports/CircularProgress';
import { MetricCard, StatusBadge } from './reports/MetricCard';
import IssueCard from './reports/IssueCard';
import StatCard from './reports/StatCard';
import './TestRunModal.css';

// Reports are on MinIO - open directly (no proxy needed)
function getReportUrl(reportUrl) {
  return reportUrl;
}

// Intelligent failure analysis
function analyzeTestFailure(runDetails) {
  if (!runDetails) return null;

  const status = runDetails.status?.toLowerCase();
  const totalTests = runDetails.total_tests || 0;
  const passed = runDetails.passed || 0;
  const failed = runDetails.failed || 0;
  const testType = runDetails.test_type || 'Test';
  const errorMessage = runDetails.error_message || runDetails.error || '';
  const duration = runDetails.duration_ms || 0;

  // Only analyze if there's something unusual to explain
  if (status === 'pass' && failed === 0) return null;

  const analysis = {
    hasIssue: false,
    severity: 'info', // info, warning, error, critical
    icon: HelpCircle,
    title: '',
    explanation: '',
    possibleCauses: [],
    suggestions: [],
    technicalDetails: []
  };

  // Case 1: FAIL status but all zeros - test didn't run properly
  if (status === 'fail' && totalTests === 0 && passed === 0 && failed === 0) {
    analysis.hasIssue = true;
    analysis.severity = 'critical';
    analysis.icon = AlertCircle;
    analysis.title = 'Test Execution Failed';
    analysis.explanation = `The ${testType} couldn't complete its execution. No test results were recorded because the test runner encountered an issue before any tests could run.`;

    // Analyze based on test type
    if (testType === 'Load Test') {
      analysis.possibleCauses = [
        'Target server is unreachable or not responding',
        'Network connectivity issues between test runner and target',
        'Invalid URL or domain configuration',
        'Firewall or security rules blocking the connection',
        'Target server returned an error before load test could start'
      ];
      analysis.suggestions = [
        'Verify the website URL is correct and accessible',
        'Check if the target server is running and healthy',
        'Ensure network connectivity from the test environment',
        'Review firewall rules for the target server',
        'Try running a simple HTTP request to the URL first'
      ];
    } else if (testType === 'Performance') {
      analysis.possibleCauses = [
        'Page failed to load within timeout period',
        'Lighthouse audit crashed during execution',
        'Browser instance failed to start',
        'Invalid or unreachable URL'
      ];
      analysis.suggestions = [
        'Verify the page loads correctly in a browser',
        'Check if the URL requires authentication',
        'Increase the test timeout if the page is slow',
        'Review server logs for errors during the test'
      ];
    } else if (testType === 'Accessibility') {
      analysis.possibleCauses = [
        'Page content failed to render',
        'JavaScript errors prevented page load',
        'axe-core engine failed to initialize'
      ];
      analysis.suggestions = [
        'Check for JavaScript errors in the browser console',
        'Verify the page renders correctly',
        'Ensure the page is not blocked by authentication'
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

    if (errorMessage) {
      analysis.technicalDetails.push(`Error: ${errorMessage}`);
    }
    if (duration > 0) {
      analysis.technicalDetails.push(`Ran for ${(duration / 1000).toFixed(1)}s before failing`);
    }

    return analysis;
  }

  // Case 2: Some tests failed
  if (failed > 0) {
    analysis.hasIssue = true;
    analysis.severity = failed > (totalTests / 2) ? 'error' : 'warning';
    analysis.icon = AlertTriangle;
    analysis.title = `${failed} Test${failed > 1 ? 's' : ''} Failed`;
    const failRate = totalTests > 0 ? ((failed / totalTests) * 100).toFixed(0) : 0;
    analysis.explanation = `${failRate}% of tests did not pass. Review the detailed results below to understand what went wrong.`;

    if (testType === 'Load Test') {
      analysis.possibleCauses = [
        'Server couldn\'t handle the load - response time exceeded thresholds',
        'Some requests returned error status codes (4xx/5xx)',
        'Connection timeouts during high load periods'
      ];
    }

    return analysis;
  }

  // Case 3: FAIL status but passed > 0 (partial success marked as fail)
  if (status === 'fail' && passed > 0 && failed === 0) {
    analysis.hasIssue = true;
    analysis.severity = 'warning';
    analysis.icon = HelpCircle;
    analysis.title = 'Marked as Failed Despite Passing Tests';
    analysis.explanation = 'All individual tests passed, but the overall run was marked as failed. This might be due to threshold violations or post-test validation failures.';
    analysis.possibleCauses = [
      'Performance thresholds not met (e.g., response time too slow)',
      'Error rate exceeded acceptable limits',
      'Post-test assertions failed'
    ];
    return analysis;
  }

  return null;
}

// Get status explanation for the summary
function getStatusExplanation(status, testType) {
  const explanations = {
    'pass': {
      text: 'All tests completed successfully',
      color: 'green'
    },
    'fail': {
      text: 'One or more tests did not pass',
      color: 'red'
    },
    'running': {
      text: 'Test is currently in progress',
      color: 'blue'
    },
    'pending': {
      text: 'Test is queued and waiting to run',
      color: 'yellow'
    },
    'error': {
      text: 'Test encountered an unexpected error',
      color: 'red'
    }
  };
  return explanations[status?.toLowerCase()] || { text: 'Unknown status', color: 'gray' };
}

export default function TestRunModal({ isOpen, onClose, testRunId, initialData }) {
  const queryClient = useQueryClient();
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportAvailable, setReportAvailable] = useState(null); // null = checking, true = available, false = not available
  const [activeTab, setActiveTab] = useState('executive'); // 'executive' or 'technical'

  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened with testRunId:', testRunId);
      console.log('Initial data:', initialData);
      console.log('Initial data fields:', initialData ? Object.keys(initialData) : 'none');
    }
  }, [isOpen, testRunId, initialData]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const { data: runDetails, isLoading, refetch } = useQuery({
    queryKey: ['test-run-modal', testRunId],
    queryFn: () => getTestRun(testRunId).then(res => {
      console.log('API Response for test run:', res.data);
      console.log('Test run fields:', Object.keys(res.data));
      return res.data;
    }),
    enabled: !!testRunId && isOpen,
    refetchInterval: false, // WebSocket handles real-time updates
    initialData: initialData
  });

  // Debug runDetails
  useEffect(() => {
    if (runDetails) {
      console.log('runDetails loaded:', runDetails);
      console.log('runDetails.passed:', runDetails.passed);
      console.log('runDetails.failed:', runDetails.failed);
      console.log('runDetails.total_tests:', runDetails.total_tests);
    }
  }, [runDetails]);

  // Check if report URL is accessible
  useEffect(() => {
    const checkReportAvailability = async () => {
      if (!runDetails?.report_url) {
        setReportAvailable(false);
        return;
      }

      try {
        const response = await fetch(runDetails.report_url, { method: 'HEAD' });
        setReportAvailable(response.ok);
      } catch (error) {
        setReportAvailable(false);
      }
    };

    if (isOpen && runDetails) {
      checkReportAvailability();
    } else {
      setReportAvailable(null);
    }
  }, [isOpen, runDetails?.report_url]);

  // Real-time updates via WebSocket
  useTestResultUpdates((data) => {
    if (data.id === testRunId) {
      queryClient.setQueryData(['test-run-modal', testRunId], oldData => ({
        ...oldData,
        ...data
      }));
    }
  }, [testRunId]);

  const handleDownloadReport = async () => {
    if (!testRunId) return;

    setGeneratingReport(true);
    try {
      const response = await generateReport(testRunId);
      console.log('PDF Response:', response);
      console.log('Response headers:', response.headers);
      console.log('Response data type:', typeof response.data);
      console.log('Response data instanceof Blob:', response.data instanceof Blob);

      // Check if response is actually a blob and not an error JSON
      if (response.data instanceof Blob) {
        console.log('Blob type:', response.data.type);
        console.log('Blob size:', response.data.size);

        // Check if it's actually a PDF or an error message
        if (response.data.type === 'application/json') {
          // It's an error response disguised as a blob
          const text = await response.data.text();
          console.error('Error response as JSON:', text);
          const errorData = JSON.parse(text);
          throw new Error(errorData.error || errorData.message || 'Failed to generate report');
        }

        const blob = new Blob([response.data], { type: 'application/pdf' });

        const contentDisposition = response.headers['content-disposition'];
        let filename = `test-report-${testRunId}.pdf`;
        if (contentDisposition) {
          const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
          if (matches && matches[1]) {
            filename = matches[1];
          }
        }

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      } else {
        console.error('Response data is not a blob:', response.data);
        throw new Error('Invalid response format: Expected blob, got ' + typeof response.data);
      }
    } catch (error) {
      console.error('PDF Download Error Details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });

      let errorMessage = 'Unknown error';
      if (error.response?.data) {
        // If the error has a response with data, try to extract the message
        if (error.response.data instanceof Blob) {
          const text = await error.response.data.text();
          try {
            const json = JSON.parse(text);
            errorMessage = json.error || json.message || text;
          } catch {
            errorMessage = text;
          }
        } else {
          errorMessage = error.response.data.error || error.response.data.message || error.message;
        }
      } else {
        errorMessage = error.message;
      }

      alert('Failed to generate report: ' + errorMessage);
    } finally {
      setGeneratingReport(false);
    }
  };

  if (!testRunId) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="test-run-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="test-run-modal-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.3 }}
          >
            {/* Header */}
            <div className="test-run-modal-header">
              <div className="test-run-modal-title-wrapper">
                <div>
                  <h2 className="test-run-modal-title">
                    {runDetails?.test_type || initialData?.test_type || 'Test Run'} Details
                  </h2>
                  <div className="test-run-modal-meta">
                    <span className={`test-run-status-badge status-${runDetails?.status?.toLowerCase() || initialData?.status?.toLowerCase()}`}>
                      {runDetails?.status || initialData?.status || 'Unknown'}
                    </span>
                    <span className="test-run-website">{runDetails?.website_name || initialData?.website_name}</span>
                  </div>
                </div>
              </div>
              <div className="test-run-modal-actions">
                <button
                  className="test-run-refresh-btn"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  aria-label="Refresh"
                >
                  <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
                </button>
                <button className="test-run-modal-close" onClick={onClose} aria-label="Close">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="test-run-modal-body">
              {isLoading && !runDetails ? (
                <div className="test-run-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading test details...</p>
                </div>
              ) : runDetails ? (
                <>
                  {/* Summary Stats */}
                  <div className="test-run-summary-grid">
                    <div className="test-run-summary-stat">
                      <span className="summary-label">Total Tests</span>
                      <span className="summary-value">{runDetails.total_tests || 0}</span>
                    </div>
                    <div className="test-run-summary-stat success">
                      <span className="summary-label">Passed</span>
                      <span className="summary-value">{runDetails.passed || 0}</span>
                    </div>
                    <div className="test-run-summary-stat error">
                      <span className="summary-label">Failed</span>
                      <span className="summary-value">{runDetails.failed || 0}</span>
                    </div>
                    <div className="test-run-summary-stat">
                      <span className="summary-label">Duration</span>
                      <span className="summary-value">
                        {runDetails.duration_ms ? (runDetails.duration_ms / 1000).toFixed(2) + 's' : '—'}
                      </span>
                    </div>
                    <div className="test-run-summary-stat">
                      <span className="summary-label">Date</span>
                      <span className="summary-value" style={{ fontSize: '14px', lineHeight: '1.4' }}>
                        {new Date(runDetails.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* View Toggle Tabs */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '20px',
                    padding: '4px',
                    background: '#f3f4f6',
                    borderRadius: '12px',
                    width: 'fit-content'
                  }}>
                    <button
                      onClick={() => setActiveTab('executive')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        background: activeTab === 'executive' ? '#fff' : 'transparent',
                        color: activeTab === 'executive' ? '#111827' : '#6b7280',
                        boxShadow: activeTab === 'executive' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                      }}
                    >
                      <PieChart size={16} />
                      Executive Summary
                    </button>
                    <button
                      onClick={() => setActiveTab('technical')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        background: activeTab === 'technical' ? '#fff' : 'transparent',
                        color: activeTab === 'technical' ? '#111827' : '#6b7280',
                        boxShadow: activeTab === 'technical' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                      }}
                    >
                      <Code size={16} />
                      Technical Details
                    </button>
                  </div>

                  {/* Executive Summary View */}
                  {activeTab === 'executive' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Health Score Card */}
                      <div style={{
                        padding: '24px',
                        background: runDetails.status?.toLowerCase() === 'pass'
                          ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
                          : runDetails.status?.toLowerCase() === 'fail'
                          ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
                          : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                        borderRadius: '16px',
                        border: `2px solid ${runDetails.status?.toLowerCase() === 'pass' ? '#a7f3d0' : runDetails.status?.toLowerCase() === 'fail' ? '#fecaca' : '#fcd34d'}`
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                              {runDetails.status?.toLowerCase() === 'pass' ? (
                                <CheckCircle2 size={32} color="#059669" />
                              ) : runDetails.status?.toLowerCase() === 'fail' ? (
                                <XCircle size={32} color="#dc2626" />
                              ) : (
                                <AlertCircle size={32} color="#d97706" />
                              )}
                              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
                                {runDetails.status?.toLowerCase() === 'pass' ? 'All Tests Passed' :
                                 runDetails.status?.toLowerCase() === 'fail' ? 'Tests Failed' : 'Test In Progress'}
                              </h3>
                            </div>
                            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                              {runDetails.test_type} completed on {runDetails.website_name}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '48px', fontWeight: '800', color: runDetails.status?.toLowerCase() === 'pass' ? '#059669' : runDetails.status?.toLowerCase() === 'fail' ? '#dc2626' : '#d97706' }}>
                              {runDetails.total_tests > 0 ? Math.round((runDetails.passed / runDetails.total_tests) * 100) : 0}%
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Pass Rate</div>
                          </div>
                        </div>
                      </div>

                      {/* Key Metrics Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        {(() => {
                          // Extract key metrics based on test type
                          const testType = runDetails.test_type?.toLowerCase();
                          let metrics = [];

                          if (testType === 'performance' && runDetails.performance_metrics) {
                            const perf = runDetails.performance_metrics;
                            metrics = [
                              { label: 'Performance', value: perf.performance_score || 0, suffix: '', color: '#f59e0b', icon: Gauge },
                              { label: 'Accessibility', value: perf.accessibility_score || 0, suffix: '', color: '#3b82f6', icon: Users },
                              { label: 'Best Practices', value: perf.best_practices_score || 0, suffix: '', color: '#10b981', icon: Target },
                              { label: 'SEO', value: perf.seo_score || 0, suffix: '', color: '#8b5cf6', icon: TrendingUp }
                            ];
                          } else if (testType === 'load test' && runDetails.load_test_results) {
                            const load = runDetails.load_test_results;
                            metrics = [
                              { label: 'Avg Response', value: load.avg_response_time || 0, suffix: 'ms', color: '#3b82f6', icon: Clock },
                              { label: 'Requests/sec', value: load.requests_per_second || 0, suffix: '', color: '#10b981', icon: Activity },
                              { label: 'Error Rate', value: load.error_rate || 0, suffix: '%', color: '#ef4444', icon: AlertTriangle },
                              { label: 'Total Requests', value: load.total_requests || 0, suffix: '', color: '#8b5cf6', icon: Server }
                            ];
                          } else if (testType === 'security scan' && runDetails.security_results) {
                            const sec = runDetails.security_results;
                            metrics = [
                              { label: 'Security Score', value: sec.security_score || 0, suffix: '', color: '#8b5cf6', icon: Shield },
                              { label: 'SSL Valid', value: sec.ssl_valid ? 'Yes' : 'No', suffix: '', color: sec.ssl_valid ? '#10b981' : '#ef4444', icon: Lock },
                              { label: 'Headers', value: sec.security_headers?.filter(h => h.present).length || 0, suffix: `/${sec.security_headers?.length || 0}`, color: '#3b82f6', icon: Shield },
                              { label: 'Issues', value: sec.issues?.length || 0, suffix: '', color: '#f59e0b', icon: AlertCircle }
                            ];
                          } else if (testType === 'seo audit' && runDetails.seo_results) {
                            const seo = runDetails.seo_results;
                            metrics = [
                              { label: 'SEO Score', value: seo.overall_score || 0, suffix: '', color: '#3b82f6', icon: Globe },
                              { label: 'Issues', value: seo.issues?.length || 0, suffix: '', color: '#f59e0b', icon: AlertTriangle },
                              { label: 'Meta Tags', value: seo.meta_tags?.has_title && seo.meta_tags?.has_description ? 'Complete' : 'Incomplete', suffix: '', color: seo.meta_tags?.has_title ? '#10b981' : '#ef4444', icon: Target },
                              { label: 'Images', value: seo.images?.images_with_alt || 0, suffix: `/${seo.images?.total_images || 0}`, color: '#8b5cf6', icon: Image }
                            ];
                          } else if (testType === 'accessibility' && runDetails.accessibility_results) {
                            const violations = runDetails.accessibility_results || [];
                            const critical = violations.filter(v => v.impact === 'critical').length;
                            const serious = violations.filter(v => v.impact === 'serious').length;
                            metrics = [
                              { label: 'Critical', value: critical, suffix: '', color: '#dc2626', icon: XCircle },
                              { label: 'Serious', value: serious, suffix: '', color: '#ea580c', icon: AlertTriangle },
                              { label: 'Moderate', value: violations.filter(v => v.impact === 'moderate').length, suffix: '', color: '#d97706', icon: AlertCircle },
                              { label: 'Minor', value: violations.filter(v => v.impact === 'minor').length, suffix: '', color: '#3b82f6', icon: HelpCircle }
                            ];
                          } else {
                            metrics = [
                              { label: 'Total', value: runDetails.total_tests || 0, suffix: '', color: '#6b7280', icon: Target },
                              { label: 'Passed', value: runDetails.passed || 0, suffix: '', color: '#10b981', icon: CheckCircle2 },
                              { label: 'Failed', value: runDetails.failed || 0, suffix: '', color: '#ef4444', icon: XCircle },
                              { label: 'Duration', value: runDetails.duration_ms ? (runDetails.duration_ms / 1000).toFixed(1) : 0, suffix: 's', color: '#3b82f6', icon: Clock }
                            ];
                          }

                          return metrics.map((m, idx) => (
                            <div key={idx} style={{
                              padding: '16px',
                              background: '#fff',
                              borderRadius: '12px',
                              border: '1px solid #e5e7eb',
                              textAlign: 'center'
                            }}>
                              <m.icon size={20} color={m.color} style={{ marginBottom: '8px' }} />
                              <div style={{ fontSize: '24px', fontWeight: '700', color: m.color }}>
                                {m.value}{m.suffix}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>{m.label}</div>
                            </div>
                          ));
                        })()}
                      </div>

                      {/* Quick Insights */}
                      <div style={{
                        padding: '20px',
                        background: '#f9fafb',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Lightbulb size={16} color="#f59e0b" />
                          Quick Insights
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#4b5563', lineHeight: '1.8' }}>
                          {(() => {
                            const insights = [];
                            const testType = runDetails.test_type?.toLowerCase();

                            if (runDetails.status?.toLowerCase() === 'pass') {
                              insights.push('All tests completed successfully with no critical issues.');
                            } else if (runDetails.failed > 0) {
                              insights.push(`${runDetails.failed} test(s) failed - review the Technical Details tab for specifics.`);
                            }

                            if (testType === 'performance' && runDetails.performance_metrics) {
                              const perf = runDetails.performance_metrics;
                              if (perf.performance_score >= 90) insights.push('Excellent performance score - page loads quickly.');
                              else if (perf.performance_score < 50) insights.push('Performance needs improvement - consider optimizing assets.');
                              if (perf.lcp_ms > 2500) insights.push('Largest Contentful Paint is slow - optimize above-the-fold content.');
                            }

                            if (testType === 'security scan' && runDetails.security_results) {
                              const sec = runDetails.security_results;
                              if (sec.ssl_valid) insights.push('SSL certificate is valid and properly configured.');
                              else insights.push('SSL certificate issues detected - immediate attention required.');
                              if (sec.issues?.length > 0) insights.push(`${sec.issues.length} security issue(s) found - review and remediate.`);
                            }

                            if (testType === 'accessibility' && runDetails.accessibility_results) {
                              const violations = runDetails.accessibility_results || [];
                              if (violations.length === 0) insights.push('No accessibility violations detected - great job!');
                              else {
                                const critical = violations.filter(v => v.impact === 'critical').length;
                                if (critical > 0) insights.push(`${critical} critical accessibility issue(s) blocking users - prioritize fixes.`);
                              }
                            }

                            if (insights.length === 0) {
                              insights.push('Switch to Technical Details for comprehensive test data.');
                            }

                            return insights.map((insight, idx) => <li key={idx}>{insight}</li>);
                          })()}
                        </ul>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setActiveTab('technical')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 20px',
                            background: '#111827',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          <Code size={16} />
                          View Full Technical Report
                        </button>
                        {runDetails.report_url && reportAvailable && (
                          <a
                            href={getReportUrl(runDetails.report_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '12px 20px',
                              background: '#fff',
                              color: '#374151',
                              border: '1px solid #d1d5db',
                              borderRadius: '10px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              textDecoration: 'none'
                            }}
                          >
                            <ExternalLink size={16} />
                            Open HTML Report
                          </a>
                        )}
                        <button
                          onClick={handleDownloadReport}
                          disabled={generatingReport}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 20px',
                            background: '#fff',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: generatingReport ? 'not-allowed' : 'pointer',
                            opacity: generatingReport ? 0.6 : 1
                          }}
                        >
                          <FileDown size={16} />
                          {generatingReport ? 'Generating...' : 'Download PDF'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Technical Details View */}
                  {activeTab === 'technical' && (
                    <>
                  {/* Failure Analysis Section */}
                  {(() => {
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
                        className="failure-analysis-card"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          background: style.bg,
                          border: `2px solid ${style.border}`,
                          borderRadius: '16px',
                          padding: '24px',
                          marginTop: '20px',
                          marginBottom: '24px'
                        }}
                      >
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: style.iconBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
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

                        {/* What Happened Section */}
                        <div style={{ display: 'grid', gridTemplateColumns: analysis.suggestions.length > 0 ? '1fr 1fr' : '1fr', gap: '20px' }}>
                          {/* Possible Causes */}
                          {analysis.possibleCauses.length > 0 && (
                            <div style={{
                              background: 'rgba(255,255,255,0.7)',
                              borderRadius: '12px',
                              padding: '16px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <Bug size={16} color="#6b7280" />
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  Possible Causes
                                </span>
                              </div>
                              <ul style={{ margin: 0, paddingLeft: '18px', listStyle: 'disc' }}>
                                {analysis.possibleCauses.slice(0, 4).map((cause, idx) => (
                                  <li key={idx} style={{ fontSize: '13px', color: '#4b5563', marginBottom: '6px', lineHeight: 1.4 }}>
                                    {cause}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Suggestions */}
                          {analysis.suggestions.length > 0 && (
                            <div style={{
                              background: 'rgba(255,255,255,0.7)',
                              borderRadius: '12px',
                              padding: '16px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <Lightbulb size={16} color="#059669" />
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  How to Fix
                                </span>
                              </div>
                              <ul style={{ margin: 0, paddingLeft: '18px', listStyle: 'disc' }}>
                                {analysis.suggestions.slice(0, 4).map((suggestion, idx) => (
                                  <li key={idx} style={{ fontSize: '13px', color: '#4b5563', marginBottom: '6px', lineHeight: 1.4 }}>
                                    {suggestion}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Technical Details */}
                        {analysis.technicalDetails.length > 0 && (
                          <div style={{
                            marginTop: '16px',
                            padding: '12px 16px',
                            background: 'rgba(0,0,0,0.05)',
                            borderRadius: '8px',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            color: '#6b7280'
                          }}>
                            {analysis.technicalDetails.map((detail, idx) => (
                              <div key={idx}>{detail}</div>
                            ))}
                          </div>
                        )}

                        {/* Quick Actions */}
                        <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => refetch()}
                            style={{
                              padding: '8px 16px',
                              background: 'white',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: 500,
                              color: '#374151',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <RefreshCw size={14} />
                            Refresh Status
                          </button>
                          {runDetails.website_url && (
                            <a
                              href={runDetails.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '8px 16px',
                                background: 'white',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: '#374151',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                textDecoration: 'none'
                              }}
                            >
                              <ExternalLink size={14} />
                              Open Target URL
                            </a>
                          )}
                        </div>
                      </motion.div>
                    );
                  })()}

                  {/* SEO Audit Details */}
                  {runDetails.test_type === 'SEO Audit' && runDetails.seo_results && (
                    <div className="test-run-section">
                      <h3 className="test-run-section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Globe size={24} color="#2563eb" />
                        SEO Analysis
                      </h3>

                      {/* Overall Score with Circular Progress */}
                      <div style={{
                        marginBottom: '24px',
                        padding: '24px',
                        background: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 50%, #faf5ff 100%)',
                        borderRadius: '16px',
                        border: '2px solid #bfdbfe',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Overall SEO Score</h4>
                            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>Comprehensive analysis of meta tags, content structure, and technical SEO</p>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: runDetails.seo_results.overall_score >= 80 ? '#dcfce7' : runDetails.seo_results.overall_score >= 60 ? '#fef3c7' : '#fee2e2',
                              color: runDetails.seo_results.overall_score >= 80 ? '#166534' : runDetails.seo_results.overall_score >= 60 ? '#92400e' : '#991b1b'
                            }}>
                              {runDetails.seo_results.overall_score >= 80 ? '✓ Excellent' : runDetails.seo_results.overall_score >= 60 ? '⚠ Good' : '✗ Needs Work'}
                            </span>
                          </div>
                          <CircularProgress value={runDetails.seo_results.overall_score} size={140} color="auto" />
                        </div>
                      </div>

                      {/* Meta Tags */}
                      {runDetails.seo_results.meta_tags && (
                        <div style={{ marginBottom: '20px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📄 Meta Tags
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                            {(() => {
                              const meta = typeof runDetails.seo_results.meta_tags === 'string'
                                ? JSON.parse(runDetails.seo_results.meta_tags)
                                : runDetails.seo_results.meta_tags;
                              return (
                                <>
                                  <div style={{
                                    padding: '14px',
                                    backgroundColor: '#fff',
                                    borderRadius: '10px',
                                    border: '1px solid #e5e7eb'
                                  }}>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      Title
                                      <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        fontWeight: '600',
                                        background: meta.has_title ? '#dcfce7' : '#fee2e2',
                                        color: meta.has_title ? '#166534' : '#991b1b'
                                      }}>
                                        {meta.has_title ? '✓ Found' : '✗ Missing'}
                                      </span>
                                    </div>
                                    <div style={{ fontWeight: '500', color: '#111827', fontSize: '14px' }}>{meta.title || 'Not set'}</div>
                                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>{meta.title_length} characters</div>
                                  </div>
                                  <div style={{
                                    padding: '14px',
                                    backgroundColor: '#fff',
                                    borderRadius: '10px',
                                    border: '1px solid #e5e7eb'
                                  }}>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      Description
                                      <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        fontWeight: '600',
                                        background: meta.has_description ? '#dcfce7' : '#fee2e2',
                                        color: meta.has_description ? '#166534' : '#991b1b'
                                      }}>
                                        {meta.has_description ? '✓ Found' : '✗ Missing'}
                                      </span>
                                    </div>
                                    <div style={{ fontWeight: '500', color: '#111827', fontSize: '13px' }}>{meta.description || 'Not set'}</div>
                                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>{meta.description_length} characters</div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Headings Structure */}
                      {runDetails.seo_results.headings && (
                        <div style={{ marginBottom: '20px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BarChart3 size={18} color="#2563eb" />
                            Heading Structure
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            {(() => {
                              const headings = typeof runDetails.seo_results.headings === 'string'
                                ? JSON.parse(runDetails.seo_results.headings)
                                : runDetails.seo_results.headings;
                              const headingConfig = [
                                { key: 'h1_count', label: 'H1 Tags', desc: 'Main headings', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
                                { key: 'h2_count', label: 'H2 Tags', desc: 'Subheadings', color: '#8b5cf6', bg: '#f5f3ff', border: '#c4b5fd' },
                                { key: 'h3_count', label: 'H3 Tags', desc: 'Section headings', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' }
                              ];
                              return headingConfig.map((h, idx) => (
                                <div key={idx} style={{
                                  padding: '14px',
                                  borderRadius: '10px',
                                  background: h.bg,
                                  border: `1px solid ${h.border}`
                                }}>
                                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{h.label}</div>
                                  <div style={{ fontSize: '24px', fontWeight: '700', color: h.color }}>{headings[h.key] ?? 0}</div>
                                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>{h.desc}</div>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Images Analysis */}
                      {runDetails.seo_results.images && (
                        <div style={{ marginBottom: '20px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Image size={18} color="#8b5cf6" />
                            Images Analysis
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            {(() => {
                              const images = typeof runDetails.seo_results.images === 'string'
                                ? JSON.parse(runDetails.seo_results.images)
                                : runDetails.seo_results.images;
                              const imageStats = [
                                { label: 'Total Images', value: images.total_images, desc: 'Found on page', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
                                { label: 'With Alt Text', value: images.images_with_alt, desc: `${images.alt_text_percentage}% optimized`, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
                                { label: 'Missing Alt', value: images.images_without_alt, desc: 'Needs attention', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' }
                              ];
                              return imageStats.map((stat, idx) => (
                                <div key={idx} style={{
                                  padding: '14px',
                                  borderRadius: '10px',
                                  background: stat.bg,
                                  border: `1px solid ${stat.border}`
                                }}>
                                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{stat.label}</div>
                                  <div style={{ fontSize: '24px', fontWeight: '700', color: stat.color }}>{stat.value ?? 0}</div>
                                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>{stat.desc}</div>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Issues */}
                      {runDetails.seo_results.issues && (
                        <div style={{ marginBottom: '20px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={18} color="#ea580c" />
                            Issues & Recommendations
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {(() => {
                              const issues = typeof runDetails.seo_results.issues === 'string'
                                ? JSON.parse(runDetails.seo_results.issues)
                                : runDetails.seo_results.issues;
                              const severityConfig = {
                                high: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '🔴' },
                                medium: { color: '#d97706', bg: '#fffbeb', border: '#fcd34d', icon: '🟠' },
                                low: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: '🔵' },
                                info: { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', icon: 'ℹ️' }
                              };
                              return issues.map((issue, idx) => {
                                const sev = severityConfig[issue.severity?.toLowerCase()] || severityConfig.info;
                                return (
                                  <div key={idx} style={{
                                    padding: '14px',
                                    borderRadius: '10px',
                                    background: sev.bg,
                                    border: `1px solid ${sev.border}`
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                      <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        fontSize: '10px',
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        background: sev.border,
                                        color: sev.color
                                      }}>
                                        {sev.icon} {issue.severity}
                                      </span>
                                      <span style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>{issue.issue}</span>
                                    </div>
                                    {issue.description && (
                                      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>{issue.description}</p>
                                    )}
                                    {issue.recommendation && (
                                      <div style={{
                                        padding: '10px',
                                        borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.7)',
                                        fontSize: '12px',
                                        color: '#374151'
                                      }}>
                                        <strong>💡 Recommendation:</strong> {issue.recommendation}
                                      </div>
                                    )}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Accessibility Details */}
                  {runDetails.test_type === 'Accessibility' && (
                    <div className="test-run-section">
                      <h3 className="test-run-section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Shield size={24} color="#059669" />
                        Accessibility Analysis
                      </h3>

                      {runDetails.accessibility_results && runDetails.accessibility_results.length > 0 ? (
                        <>
                          {/* Summary by Severity */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '12px',
                            marginBottom: '24px'
                          }}>
                            {(() => {
                              const violations = runDetails.accessibility_results;
                              const counts = {
                                critical: violations.filter(v => v.impact === 'critical').length,
                                serious: violations.filter(v => v.impact === 'serious').length,
                                moderate: violations.filter(v => v.impact === 'moderate').length,
                                minor: violations.filter(v => v.impact === 'minor').length
                              };
                              const severityConfig = [
                                { key: 'critical', label: 'Critical', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', desc: 'Blocks users' },
                                { key: 'serious', label: 'Serious', color: '#ea580c', bg: '#fff7ed', border: '#fdba74', desc: 'Major barriers' },
                                { key: 'moderate', label: 'Moderate', color: '#d97706', bg: '#fffbeb', border: '#fcd34d', desc: 'Some difficulty' },
                                { key: 'minor', label: 'Minor', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd', desc: 'Minor issues' }
                              ];
                              return severityConfig.map((sev, idx) => (
                                <div key={idx} style={{
                                  padding: '16px',
                                  borderRadius: '12px',
                                  background: sev.bg,
                                  border: `2px solid ${sev.border}`,
                                  textAlign: 'center'
                                }}>
                                  <div style={{ fontSize: '28px', fontWeight: 700, color: sev.color }}>{counts[sev.key]}</div>
                                  <div style={{ fontSize: '13px', fontWeight: 600, color: sev.color, marginBottom: '2px' }}>{sev.label}</div>
                                  <div style={{ fontSize: '11px', color: '#6b7280' }}>{sev.desc}</div>
                                </div>
                              ));
                            })()}
                          </div>

                          {/* Violations List */}
                          <div style={{ marginBottom: '24px' }}>
                            <h4 style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#374151'
                            }}>
                              <AlertTriangle size={18} color="#dc2626" />
                              Detected Violations
                              <span style={{
                                marginLeft: '8px',
                                fontSize: '12px',
                                fontWeight: 600,
                                padding: '2px 10px',
                                borderRadius: '12px',
                                background: '#fee2e2',
                                color: '#dc2626'
                              }}>
                                {runDetails.accessibility_results.length} issues
                              </span>
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {runDetails.accessibility_results.map((violation, idx) => {
                                const impactColors = {
                                  critical: { bg: '#fef2f2', border: '#dc2626', badge: '#dc2626', badgeBg: '#fee2e2' },
                                  serious: { bg: '#fff7ed', border: '#ea580c', badge: '#ea580c', badgeBg: '#ffedd5' },
                                  moderate: { bg: '#fffbeb', border: '#d97706', badge: '#d97706', badgeBg: '#fef3c7' },
                                  minor: { bg: '#eff6ff', border: '#2563eb', badge: '#2563eb', badgeBg: '#dbeafe' }
                                };
                                const colors = impactColors[violation.impact] || impactColors.moderate;
                                return (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    style={{
                                      padding: '16px 18px',
                                      borderRadius: '12px',
                                      background: colors.bg,
                                      borderLeft: `4px solid ${colors.border}`,
                                      border: `1px solid ${colors.border}20`
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                      <div style={{
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        background: colors.badgeBg,
                                        color: colors.badge,
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        flexShrink: 0
                                      }}>
                                        {violation.impact}
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                          <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                                            {violation.help}
                                          </h5>
                                          {violation.nodes_affected && (
                                            <span style={{
                                              fontSize: '11px',
                                              padding: '2px 8px',
                                              borderRadius: '10px',
                                              background: 'rgba(0,0,0,0.05)',
                                              color: '#6b7280'
                                            }}>
                                              {violation.nodes_affected} element{violation.nodes_affected > 1 ? 's' : ''}
                                            </span>
                                          )}
                                        </div>
                                        <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#4b5563', lineHeight: 1.5 }}>
                                          {violation.description}
                                        </p>
                                        {violation.help_url && (
                                          <a
                                            href={violation.help_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              fontSize: '12px',
                                              color: '#2563eb',
                                              textDecoration: 'none'
                                            }}
                                          >
                                            <ExternalLink size={12} />
                                            Learn more
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{
                          padding: '40px',
                          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                          borderRadius: '16px',
                          border: '2px solid #86efac',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            width: '64px',
                            height: '64px',
                            margin: '0 auto 16px',
                            background: '#22c55e',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Shield size={32} color="white" />
                          </div>
                          <h4 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: '#166534' }}>
                            No Accessibility Issues Found!
                          </h4>
                          <p style={{ margin: 0, fontSize: '14px', color: '#15803d', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                            Great job! This page passed all accessibility checks. Your content is accessible to users with disabilities.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pixel Audit Details */}
                  {runDetails.test_type === 'Pixel Audit' && (
                    <div className="test-run-section">
                      <h3 className="test-run-section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Activity size={24} color="#8b5cf6" />
                        Pixel Detection Results
                      </h3>

                      {runDetails.pixel_results && runDetails.pixel_results.length > 0 ? (
                        <>
                          {/* Summary Card */}
                          <div style={{
                            marginBottom: '24px',
                            padding: '24px',
                            background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #ede9fe 100%)',
                            borderRadius: '16px',
                            border: '2px solid #c4b5fd'
                          }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', textAlign: 'center' }}>
                              <div>
                                <div style={{ fontSize: '36px', fontWeight: 700, color: '#22c55e' }}>
                                  {runDetails.pixel_results.filter(p => p.found === 1).length}
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#166534' }}>Detected</div>
                              </div>
                              <div style={{ borderLeft: '1px solid #c4b5fd', borderRight: '1px solid #c4b5fd' }}>
                                <div style={{ fontSize: '36px', fontWeight: 700, color: '#dc2626' }}>
                                  {runDetails.pixel_results.filter(p => p.found === 0).length}
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#991b1b' }}>Missing</div>
                              </div>
                              <div>
                                <div style={{ fontSize: '36px', fontWeight: 700, color: '#7c3aed' }}>
                                  {runDetails.pixel_results.length}
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>Total Checked</div>
                              </div>
                            </div>
                          </div>

                          {/* Detected Pixels */}
                          {runDetails.pixel_results.filter(p => p.found === 1).length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                              <h4 style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#166534'
                              }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                                Active Pixels
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {runDetails.pixel_results.filter(p => p.found === 1).map((pixel, idx) => {
                                  const events = typeof pixel.events_detected === 'string'
                                    ? JSON.parse(pixel.events_detected)
                                    : pixel.events_detected;
                                  return (
                                    <motion.div
                                      key={idx}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.05 }}
                                      style={{
                                        padding: '18px',
                                        borderRadius: '12px',
                                        background: '#f0fdf4',
                                        border: '2px solid #86efac'
                                      }}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                          <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: 'white',
                                            border: '2px solid #86efac',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '18px',
                                            fontWeight: 700,
                                            color: '#059669'
                                          }}>
                                            {pixel.pixel_vendor?.charAt(0) || 'P'}
                                          </div>
                                          <div>
                                            <h5 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#166534' }}>
                                              {pixel.pixel_vendor}
                                            </h5>
                                            {pixel.pixel_id && (
                                              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                                ID: <code style={{ background: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>{pixel.pixel_id}</code>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span style={{
                                          padding: '6px 14px',
                                          borderRadius: '20px',
                                          fontSize: '12px',
                                          fontWeight: 700,
                                          background: '#22c55e',
                                          color: 'white',
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.5px'
                                        }}>
                                          Active
                                        </span>
                                      </div>
                                      {events && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                          <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#059669' }}>{events.network_calls || 0}</div>
                                            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Network Calls</div>
                                          </div>
                                          <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>{events.events || 0}</div>
                                            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Events Fired</div>
                                          </div>
                                          <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: events.script_url ? '#059669' : '#9ca3af' }}>
                                              {events.script_url ? '✓ Loaded' : '— None'}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Script Status</div>
                                          </div>
                                        </div>
                                      )}
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Missing Pixels */}
                          {runDetails.pixel_results.filter(p => p.found === 0).length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                              <h4 style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#991b1b'
                              }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626' }} />
                                Missing Pixels
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {runDetails.pixel_results.filter(p => p.found === 0).map((pixel, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    style={{
                                      padding: '18px',
                                      borderRadius: '12px',
                                      background: '#fef2f2',
                                      border: '2px solid #fca5a5',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: 'white',
                                        border: '2px solid #fca5a5',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '18px',
                                        fontWeight: 700,
                                        color: '#dc2626'
                                      }}>
                                        {pixel.pixel_vendor?.charAt(0) || '?'}
                                      </div>
                                      <div>
                                        <h5 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#991b1b' }}>
                                          {pixel.pixel_vendor}
                                        </h5>
                                        {pixel.pixel_id && (
                                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                            Expected ID: <code style={{ background: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>{pixel.pixel_id}</code>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <span style={{
                                      padding: '6px 14px',
                                      borderRadius: '20px',
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      background: '#dc2626',
                                      color: 'white',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px'
                                    }}>
                                      Not Found
                                    </span>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{
                          padding: '40px',
                          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                          borderRadius: '16px',
                          border: '2px dashed #cbd5e1',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            width: '64px',
                            height: '64px',
                            margin: '0 auto 16px',
                            background: '#e2e8f0',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Activity size={28} color="#64748b" />
                          </div>
                          <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600, color: '#334155' }}>
                            No Pixel Data Available
                          </h4>
                          <p style={{ margin: 0, fontSize: '14px', color: '#64748b', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                            The pixel audit didn't return any results. This could mean no pixels were configured to check or the page failed to load.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Security Scan Details */}
                  {runDetails.test_type === 'Security Scan' && runDetails.security_results && (
                    <div className="test-run-section">
                      <h3 className="test-run-section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Lock size={24} color="#7c3aed" />
                        Security Analysis
                      </h3>

                      {/* Overall Score Card */}
                      <div style={{
                        marginBottom: '24px',
                        padding: '28px',
                        background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #faf5ff 100%)',
                        borderRadius: '16px',
                        border: '2px solid #c4b5fd',
                        boxShadow: '0 4px 20px rgba(124, 58, 237, 0.1)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 700, color: '#1f2937' }}>
                              Security Score
                            </h4>
                            <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6b7280' }}>
                              Comprehensive analysis of SSL certificate, security headers, and best practices
                            </p>
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 14px',
                              borderRadius: '20px',
                              fontSize: '13px',
                              fontWeight: 600,
                              background: runDetails.security_results.overall_score >= 80 ? '#dcfce7' : runDetails.security_results.overall_score >= 60 ? '#fef3c7' : '#fee2e2',
                              color: runDetails.security_results.overall_score >= 80 ? '#166534' : runDetails.security_results.overall_score >= 60 ? '#92400e' : '#991b1b',
                              border: `1px solid ${runDetails.security_results.overall_score >= 80 ? '#86efac' : runDetails.security_results.overall_score >= 60 ? '#fcd34d' : '#fca5a5'}`
                            }}>
                              {runDetails.security_results.overall_score >= 80 ? '✓ Secure' : runDetails.security_results.overall_score >= 60 ? '⚠ Moderate' : '✗ Vulnerable'}
                            </div>
                          </div>
                          <CircularProgress value={runDetails.security_results.overall_score || 0} size={130} color="purple" />
                        </div>
                      </div>

                      {/* SSL Certificate Section */}
                      <div style={{ marginBottom: '24px' }}>
                        <h4 style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#374151'
                        }}>
                          <Lock size={18} color="#059669" />
                          SSL Certificate
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                          <div style={{
                            padding: '16px',
                            borderRadius: '12px',
                            border: `2px solid ${runDetails.security_results.ssl_valid ? '#86efac' : '#fca5a5'}`,
                            background: runDetails.security_results.ssl_valid ? '#f0fdf4' : '#fef2f2'
                          }}>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: runDetails.security_results.ssl_valid ? '#059669' : '#dc2626' }}>
                              {runDetails.security_results.ssl_valid ? '✓ Valid' : '✗ Invalid'}
                            </div>
                          </div>
                          <div style={{ padding: '16px', borderRadius: '12px', border: '2px solid #e5e7eb', background: 'white' }}>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Days Remaining</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>
                              {runDetails.security_results.ssl_days_remaining || 'N/A'}
                            </div>
                          </div>
                          <div style={{ padding: '16px', borderRadius: '12px', border: '2px solid #e5e7eb', background: 'white' }}>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Issuer</div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {runDetails.security_results.ssl_issuer || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Security Headers Section */}
                      {runDetails.security_results.security_headers && (
                        <div style={{ marginBottom: '24px' }}>
                          <h4 style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#374151'
                          }}>
                            <Shield size={18} color="#7c3aed" />
                            Security Headers
                          </h4>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '10px',
                            background: '#f9fafb',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb'
                          }}>
                            {(() => {
                              const headers = typeof runDetails.security_results.security_headers === 'string'
                                ? JSON.parse(runDetails.security_results.security_headers)
                                : runDetails.security_results.security_headers;
                              return Object.entries(headers).map(([name, data]) => {
                                const isPresent = data.present;
                                const isSecure = data.secure;
                                return (
                                  <div key={name} style={{
                                    padding: '12px 14px',
                                    borderRadius: '8px',
                                    background: 'white',
                                    border: `1px solid ${isPresent ? (isSecure ? '#86efac' : '#fcd34d') : '#fca5a5'}`,
                                    borderLeft: `4px solid ${isPresent ? (isSecure ? '#22c55e' : '#f59e0b') : '#ef4444'}`
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{name}</span>
                                      <span style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        background: isPresent ? (isSecure ? '#dcfce7' : '#fef3c7') : '#fee2e2',
                                        color: isPresent ? (isSecure ? '#166534' : '#92400e') : '#991b1b',
                                        whiteSpace: 'nowrap'
                                      }}>
                                        {isPresent ? (isSecure ? '✓ Secure' : '⚠ Weak') : '✗ Missing'}
                                      </span>
                                    </div>
                                    {data.value && (
                                      <div style={{
                                        marginTop: '6px',
                                        fontSize: '11px',
                                        color: '#6b7280',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        fontFamily: 'monospace',
                                        background: '#f3f4f6',
                                        padding: '4px 8px',
                                        borderRadius: '4px'
                                      }}>
                                        {data.value}
                                      </div>
                                    )}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Security Issues Section */}
                      {runDetails.security_results.violations && (
                        <div style={{ marginBottom: '24px' }}>
                          <h4 style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#374151'
                          }}>
                            <AlertTriangle size={18} color="#dc2626" />
                            Security Issues
                            <span style={{
                              marginLeft: '8px',
                              fontSize: '12px',
                              fontWeight: 600,
                              padding: '2px 10px',
                              borderRadius: '12px',
                              background: '#fee2e2',
                              color: '#dc2626'
                            }}>
                              {(() => {
                                const v = typeof runDetails.security_results.violations === 'string'
                                  ? JSON.parse(runDetails.security_results.violations)
                                  : runDetails.security_results.violations;
                                return v.length;
                              })()} found
                            </span>
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {(() => {
                              const violations = typeof runDetails.security_results.violations === 'string'
                                ? JSON.parse(runDetails.security_results.violations)
                                : runDetails.security_results.violations;

                              const severityStyles = {
                                critical: { bg: '#fef2f2', border: '#dc2626', badge: '#dc2626', badgeBg: '#fee2e2' },
                                high: { bg: '#fff7ed', border: '#ea580c', badge: '#ea580c', badgeBg: '#ffedd5' },
                                medium: { bg: '#fffbeb', border: '#d97706', badge: '#d97706', badgeBg: '#fef3c7' },
                                low: { bg: '#eff6ff', border: '#2563eb', badge: '#2563eb', badgeBg: '#dbeafe' },
                                info: { bg: '#f0fdf4', border: '#16a34a', badge: '#16a34a', badgeBg: '#dcfce7' }
                              };

                              return violations.map((violation, idx) => {
                                const style = severityStyles[violation.severity?.toLowerCase()] || severityStyles.medium;
                                return (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    style={{
                                      padding: '16px 18px',
                                      borderRadius: '12px',
                                      background: style.bg,
                                      borderLeft: `4px solid ${style.border}`,
                                      border: `1px solid ${style.border}20`
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                      <div style={{
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        background: style.badgeBg,
                                        color: style.badge,
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        flexShrink: 0
                                      }}>
                                        {violation.severity}
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <h5 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                                          {violation.issue}
                                        </h5>
                                        <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#4b5563', lineHeight: 1.5 }}>
                                          {violation.description}
                                        </p>
                                        {violation.recommendation && (
                                          <div style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '8px',
                                            padding: '10px 12px',
                                            background: 'rgba(255,255,255,0.7)',
                                            borderRadius: '8px',
                                            border: '1px dashed #d1d5db'
                                          }}>
                                            <Lightbulb size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                                            <div>
                                              <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Recommendation
                                              </span>
                                              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#374151' }}>
                                                {violation.recommendation}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Performance Details */}
                  {runDetails.test_type === 'Performance' && runDetails.metrics && (
                    <div className="test-run-section">
                      <h3 className="test-run-section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Zap size={24} color="#eab308" />
                        Performance Metrics
                      </h3>

                      {/* Lighthouse Scores */}
                      <div style={{ marginBottom: '32px' }}>
                        <h4 style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          margin: '0 0 20px', fontSize: '16px', fontWeight: 600, color: '#374151'
                        }}>
                          <Activity size={18} color="#3b82f6" />
                          Lighthouse Scores
                        </h4>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '20px',
                          padding: '24px',
                          background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 50%, #fef3c7 100%)',
                          borderRadius: '16px',
                          border: '2px solid #fcd34d'
                        }}>
                          {[
                            { label: 'Performance', value: runDetails.metrics.performance_score, icon: '⚡' },
                            { label: 'Accessibility', value: runDetails.metrics.accessibility_score, icon: '♿' },
                            { label: 'Best Practices', value: runDetails.metrics.best_practices_score, icon: '✅' },
                            { label: 'SEO', value: runDetails.metrics.seo_score, icon: '🔍' }
                          ].map((metric, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <CircularProgress value={metric.value || 0} size={100} color="auto" />
                              <p style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                                {metric.icon} {metric.label}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Core Web Vitals */}
                      <div style={{ marginBottom: '24px' }}>
                        <h4 style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#374151'
                        }}>
                          <Zap size={18} color="#eab308" />
                          Core Web Vitals
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                          {(() => {
                            const lcpValue = runDetails.metrics.lcp ? runDetails.metrics.lcp / 1000 : null;
                            const clsValue = runDetails.metrics.cls;
                            const fcpValue = runDetails.metrics.fcp ? runDetails.metrics.fcp / 1000 : null;

                            const vitals = [
                              {
                                title: 'LCP',
                                subtitle: 'Largest Contentful Paint',
                                value: lcpValue ? `${lcpValue.toFixed(2)}s` : 'N/A',
                                status: lcpValue ? (lcpValue < 2.5 ? 'good' : lcpValue < 4 ? 'needs-improvement' : 'poor') : 'unknown',
                                target: '< 2.5s'
                              },
                              {
                                title: 'CLS',
                                subtitle: 'Cumulative Layout Shift',
                                value: clsValue !== undefined ? clsValue.toFixed(3) : 'N/A',
                                status: clsValue !== undefined ? (clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor') : 'unknown',
                                target: '< 0.1'
                              },
                              {
                                title: 'FCP',
                                subtitle: 'First Contentful Paint',
                                value: fcpValue ? `${fcpValue.toFixed(2)}s` : 'N/A',
                                status: fcpValue ? (fcpValue < 1.8 ? 'good' : fcpValue < 3 ? 'needs-improvement' : 'poor') : 'unknown',
                                target: '< 1.8s'
                              }
                            ];

                            const statusColors = {
                              good: { bg: '#f0fdf4', border: '#86efac', text: '#166534', badge: '#dcfce7' },
                              'needs-improvement': { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', badge: '#fef3c7' },
                              poor: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', badge: '#fee2e2' },
                              unknown: { bg: '#f9fafb', border: '#e5e7eb', text: '#6b7280', badge: '#f3f4f6' }
                            };

                            return vitals.map((vital, idx) => {
                              const colors = statusColors[vital.status];
                              return (
                                <div key={idx} style={{
                                  padding: '20px',
                                  borderRadius: '12px',
                                  background: colors.bg,
                                  border: `2px solid ${colors.border}`
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div>
                                      <h5 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827' }}>{vital.title}</h5>
                                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#6b7280' }}>{vital.subtitle}</p>
                                    </div>
                                    <span style={{
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      fontSize: '10px',
                                      fontWeight: 600,
                                      textTransform: 'uppercase',
                                      background: colors.badge,
                                      color: colors.text
                                    }}>
                                      {vital.status === 'good' ? 'Good' : vital.status === 'needs-improvement' ? 'Needs Work' : vital.status === 'poor' ? 'Poor' : 'N/A'}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '28px', fontWeight: 700, color: colors.text, marginBottom: '8px' }}>
                                    {vital.value}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                    Target: {vital.target}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* Additional Metrics */}
                      {(runDetails.metrics.ttfb || runDetails.metrics.tti || runDetails.metrics.speed_index) && (
                        <div style={{ marginBottom: '24px' }}>
                          <h4 style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#374151'
                          }}>
                            <BarChart3 size={18} color="#6366f1" />
                            Additional Metrics
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            {runDetails.metrics.ttfb && (
                              <div style={{ padding: '16px', borderRadius: '10px', background: 'white', border: '1px solid #e5e7eb' }}>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: 500 }}>TTFB</div>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>{(runDetails.metrics.ttfb / 1000).toFixed(2)}s</div>
                                <div style={{ fontSize: '11px', color: '#9ca3af' }}>Time to First Byte</div>
                              </div>
                            )}
                            {runDetails.metrics.tti && (
                              <div style={{ padding: '16px', borderRadius: '10px', background: 'white', border: '1px solid #e5e7eb' }}>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: 500 }}>TTI</div>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>{(runDetails.metrics.tti / 1000).toFixed(2)}s</div>
                                <div style={{ fontSize: '11px', color: '#9ca3af' }}>Time to Interactive</div>
                              </div>
                            )}
                            {runDetails.metrics.speed_index && (
                              <div style={{ padding: '16px', borderRadius: '10px', background: 'white', border: '1px solid #e5e7eb' }}>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: 500 }}>Speed Index</div>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>{(runDetails.metrics.speed_index / 1000).toFixed(2)}s</div>
                                <div style={{ fontSize: '11px', color: '#9ca3af' }}>Visual loading speed</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Load Test Details */}
                  {runDetails.test_type === 'Load Test' && (
                    <div className="test-run-section">
                      <h3 className="test-run-section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Users size={24} color="#3b82f6" />
                        Load Test Metrics
                      </h3>

                      {runDetails.load_results ? (
                        <>
                          {/* Key Metrics Card */}
                          <div style={{
                            marginBottom: '24px',
                            padding: '24px',
                            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)',
                            borderRadius: '16px',
                            border: '2px solid #93c5fd'
                          }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                  Virtual Users
                                </div>
                                <div style={{ fontSize: '36px', fontWeight: 700, color: '#1e40af' }}>
                                  {runDetails.load_results.virtual_users || 0}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>Concurrent users</div>
                              </div>
                              <div style={{ textAlign: 'center', borderLeft: '1px solid #93c5fd', borderRight: '1px solid #93c5fd' }}>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                  Duration
                                </div>
                                <div style={{ fontSize: '36px', fontWeight: 700, color: '#7c3aed' }}>
                                  {runDetails.load_results.duration_seconds || 0}s
                                </div>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>Test runtime</div>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                  Throughput
                                </div>
                                <div style={{ fontSize: '36px', fontWeight: 700, color: '#059669' }}>
                                  {runDetails.load_results.throughput_rps ? runDetails.load_results.throughput_rps.toFixed(1) : 'N/A'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>Requests/sec</div>
                              </div>
                            </div>
                          </div>

                          {/* Requests & Latency */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                            {/* Requests Card */}
                            <div style={{ padding: '20px', borderRadius: '12px', background: 'white', border: '2px solid #e5e7eb' }}>
                              <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Activity size={16} color="#3b82f6" />
                                Request Statistics
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Total Requests</span>
                                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{runDetails.load_results.requests_total || 0}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '13px', color: '#059669' }}>✓ Passed</span>
                                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#059669' }}>{(runDetails.load_results.requests_total || 0) - (runDetails.load_results.requests_failed || 0)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '13px', color: '#dc2626' }}>✗ Failed</span>
                                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#dc2626' }}>{runDetails.load_results.requests_failed || 0}</span>
                                </div>
                                <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Error Rate</span>
                                  <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    background: (runDetails.load_results.error_rate || 0) > 0.05 ? '#fee2e2' : '#dcfce7',
                                    color: (runDetails.load_results.error_rate || 0) > 0.05 ? '#dc2626' : '#059669'
                                  }}>
                                    {runDetails.load_results.error_rate ? `${(runDetails.load_results.error_rate * 100).toFixed(2)}%` : '0%'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Latency Card */}
                            <div style={{ padding: '20px', borderRadius: '12px', background: 'white', border: '2px solid #e5e7eb' }}>
                              <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Clock size={16} color="#7c3aed" />
                                Latency Percentiles
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[
                                  { label: 'P50 (Median)', value: runDetails.load_results.latency_p50, color: '#059669' },
                                  { label: 'P90', value: runDetails.load_results.latency_p90, color: '#3b82f6' },
                                  { label: 'P95', value: runDetails.load_results.latency_p95, color: '#f59e0b' },
                                  { label: 'P99', value: runDetails.load_results.latency_p99, color: '#dc2626' }
                                ].map((item, idx) => (
                                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', color: '#6b7280' }}>{item.label}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <div style={{
                                        width: `${Math.min((item.value || 0) / 10, 100)}px`,
                                        height: '6px',
                                        background: item.color,
                                        borderRadius: '3px',
                                        opacity: 0.3
                                      }} />
                                      <span style={{ fontSize: '14px', fontWeight: 600, color: item.color, minWidth: '60px', textAlign: 'right' }}>
                                        {item.value ? `${item.value.toFixed(0)}ms` : 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{
                          padding: '32px',
                          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                          borderRadius: '12px',
                          border: '2px dashed #cbd5e1',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            width: '64px',
                            height: '64px',
                            margin: '0 auto 16px',
                            background: '#e2e8f0',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Server size={28} color="#64748b" />
                          </div>
                          <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600, color: '#334155' }}>
                            No Metrics Available
                          </h4>
                          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                            The load test didn't capture any metrics. This usually happens when the test runner couldn't establish a connection to the target server.
                          </p>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            background: '#fef3c7',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: '#92400e'
                          }}>
                            <Clock size={14} />
                            Test ran for {runDetails.duration_ms ? `${(runDetails.duration_ms / 1000).toFixed(1)}s` : 'unknown time'} before failing
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Visual Regression Image Gallery */}
                  {runDetails.test_type?.toLowerCase().includes('visual') && runDetails.visual_results && (
                    <div className="test-run-section">
                      <h3 className="test-run-section-title">Visual Regression Image Gallery</h3>
                      <VisualRegressionGallery
                        visualData={{
                          overall_score: runDetails.visual_results.overall_score,
                          is_baseline_run: runDetails.visual_results.is_baseline_run,
                          similarity_score: runDetails.visual_results.overall_score / 100
                        }}
                        comparisons={runDetails.visual_results.comparisons || []}
                        baseUrl="http://localhost:3004/screenshots"
                      />
                    </div>
                  )}

                  {/* Image Gallery Section - For other test types */}
                  {runDetails.test_type?.toLowerCase() !== 'visual' && runDetails.screenshots && runDetails.screenshots.length > 0 && (
                    <div className="test-run-section">
                      <h3 className="test-run-section-title">Test Screenshots</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        {runDetails.screenshots.map((screenshot, index) => (
                          <div key={index} style={{
                            border: '2px solid #e5e7eb',
                            borderRadius: '10px',
                            overflow: 'hidden'
                          }}>
                            <img src={screenshot} alt={`Screenshot ${index + 1}`} style={{ width: '100%', height: 'auto' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Test Results Section */}
                  {runDetails.results && runDetails.results.length > 0 && (
                    <div className="test-run-section">
                      <h3 className="test-run-section-title">Test Results</h3>
                      <div className="test-run-table-wrapper">
                        <table className="test-run-table">
                          <thead>
                            <tr>
                              <th>Status</th>
                              <th>Test Name</th>
                              <th>Duration</th>
                              <th>Message</th>
                            </tr>
                          </thead>
                          <tbody>
                            {runDetails.results.map((result, idx) => (
                              <tr key={idx}>
                                <td>
                                  <span className={`result-status status-${result.status?.toLowerCase()}`}>
                                    {result.status === 'Pass' ? '✓' : '✗'}
                                  </span>
                                </td>
                                <td>{result.test_name}</td>
                                <td>{result.duration_ms ? `${result.duration_ms}ms` : '—'}</td>
                                <td className="result-message">{result.error_message || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Report Section */}
                  {runDetails.report_url && (
                    <div className="test-run-section">
                      <h3 className="test-run-section-title">Lighthouse Report</h3>
                      <div className="test-run-report-info">
                        {reportAvailable === null ? (
                          <p style={{ color: '#6b7280' }}>Checking report availability...</p>
                        ) : reportAvailable === false ? (
                          <div>
                            <p style={{ color: '#dc2626', marginBottom: '8px' }}>
                              ⚠️ Report file not found on server
                            </p>
                            <p style={{ color: '#6b7280', fontSize: '13px' }}>
                              The Lighthouse report may have been deleted or moved. You can try regenerating the report using the download button below.
                            </p>
                          </div>
                        ) : (
                          <>
                            <p>Full Lighthouse report with performance, accessibility, and SEO metrics.</p>
                            <div className="test-run-report-actions">
                              <a
                                href={getReportUrl(runDetails.report_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-report-view"
                              >
                                <ExternalLink size={16} />
                                View Lighthouse Report
                              </a>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                    </>
                  )}
                </>
              ) : (
                <div className="test-run-error">
                  <p>Failed to load test run details</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="test-run-modal-footer">
              <div className="test-run-modal-footer-info">
                <span className="test-run-id">Run ID: {testRunId}</span>
              </div>
              <button
                className="btn-download-report"
                onClick={handleDownloadReport}
                disabled={generatingReport}
              >
                <FileDown size={16} />
                {generatingReport ? 'Generating PDF...' : 'Download PDF Report'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
