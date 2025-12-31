import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, RefreshCw, ExternalLink, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTestRun, generateReport } from '../services/api';
import { useTestResultUpdates } from '../hooks/useRealtimeUpdates';
import './TestRunModal.css';

// Reports are on MinIO - open directly (no proxy needed)
function getReportUrl(reportUrl) {
  return reportUrl;
}

export default function TestRunModal({ isOpen, onClose, testRunId, initialData }) {
  const queryClient = useQueryClient();
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportAvailable, setReportAvailable] = useState(null); // null = checking, true = available, false = not available

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

                  {/* Image Gallery Section - Placeholder */}
                  <div className="test-run-section">
                    <h3 className="test-run-section-title">Test Screenshots</h3>
                    <div className="test-run-placeholder">
                      <p>Image gallery will be displayed here</p>
                      <p className="test-run-placeholder-note">Screenshots from test results, visual regression, and pixel audits</p>
                    </div>
                  </div>

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
                                <td>{result.duration ? `${result.duration}ms` : '—'}</td>
                                <td className="result-message">{result.message || '—'}</td>
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
