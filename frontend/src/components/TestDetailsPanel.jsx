import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X, RefreshCw, ExternalLink, FileDown, Shield, Lock, Globe, Image,
  Zap, Activity, BarChart3, AlertTriangle, AlertCircle, Lightbulb,
  Clock, Gauge, Eye, Code, TrendingUp, CheckCircle2, XCircle, Target,
  FileText, ChevronDown, ChevronRight, Play, Terminal, Folder, Database,
  Maximize2, Download, Copy, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tabs from '@radix-ui/react-tabs';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { JsonView, allExpanded, darkStyles, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import { Sheet } from './ui/Sheet';
import { ResultsTutorial } from './tutorial';
import { getTestRun, generateReport, runSmokeTest, runPerformanceTest } from '../services/api';
import './TestDetailsPanel.css';

// ============================================================================
// RADIAL PROGRESS COMPONENT (Lighthouse Style)
// ============================================================================
function RadialProgress({ value, size = 100, label, sublabel }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const getColor = () => {
    if (value >= 90) return '#0cce6b';
    if (value >= 50) return '#ffa400';
    return '#ff4e42';
  };

  const getBgColor = () => {
    if (value >= 90) return 'rgba(12, 206, 107, 0.1)';
    if (value >= 50) return 'rgba(255, 164, 0, 0.1)';
    return 'rgba(255, 78, 66, 0.1)';
  };

  return (
    <div className="radial-progress-container">
      <div className="radial-progress" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill={getBgColor()}
            stroke="#e5e7eb"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
              transition: 'stroke-dashoffset 0.6s ease-out'
            }}
          />
        </svg>
        <div className="radial-progress-value" style={{ color: getColor() }}>
          {value}
        </div>
      </div>
      {label && <div className="radial-progress-label">{label}</div>}
      {sublabel && <div className="radial-progress-sublabel">{sublabel}</div>}
    </div>
  );
}

// ============================================================================
// OVERVIEW TAB - Executive Summary (No Scrolling Required)
// ============================================================================
function OverviewTab({ runDetails }) {
  const testType = runDetails?.test_type?.toLowerCase();
  const passRate = runDetails.total_tests > 0
    ? Math.round((runDetails.passed / runDetails.total_tests) * 100)
    : 0;

  // Get Lighthouse scores for performance tests
  const lighthouseScores = useMemo(() => {
    if (testType === 'performance' && runDetails.performance_metrics) {
      const perf = runDetails.performance_metrics;
      return [
        { label: 'Performance', value: perf.performance_score || 0 },
        { label: 'Accessibility', value: perf.accessibility_score || 0 },
        { label: 'Best Practices', value: perf.best_practices_score || 0 },
        { label: 'SEO', value: perf.seo_score || 0 }
      ];
    }
    return null;
  }, [testType, runDetails.performance_metrics]);

  // Get top 3 opportunities/recommendations
  const topOpportunities = useMemo(() => {
    const opportunities = [];

    if (testType === 'performance' && runDetails.performance_metrics) {
      const perf = runDetails.performance_metrics;
      if (perf.performance_score < 90) {
        opportunities.push({
          type: 'warning',
          text: 'Improve Largest Contentful Paint (LCP)',
          detail: 'Consider optimizing images and server response time'
        });
      }
      if (perf.accessibility_score < 90) {
        opportunities.push({
          type: 'info',
          text: 'Add ARIA labels to interactive elements',
          detail: 'Improves screen reader compatibility'
        });
      }
      if (perf.seo_score < 90) {
        opportunities.push({
          type: 'info',
          text: 'Add meta descriptions to pages',
          detail: 'Helps search engine visibility'
        });
      }
    }

    if (runDetails.failed > 0) {
      opportunities.unshift({
        type: 'error',
        text: `${runDetails.failed} test(s) failed`,
        detail: 'Check Console Logs tab for details'
      });
    }

    return opportunities.slice(0, 3);
  }, [testType, runDetails]);

  // Get quick stats based on test type
  const quickStats = useMemo(() => {
    if (testType === 'smoke') {
      return [
        { label: 'Steps', value: runDetails.total_tests || 0, icon: Target },
        { label: 'Passed', value: runDetails.passed || 0, icon: CheckCircle2, color: '#10b981' },
        { label: 'Screenshots', value: runDetails.results?.filter(r => r.screenshot_url)?.length || 0, icon: Image }
      ];
    }
    if (testType === 'load test' && runDetails.load_results) {
      return [
        { label: 'VUs', value: runDetails.load_results.virtual_users || 0, icon: Activity },
        { label: 'Req/s', value: runDetails.load_results.throughput_rps?.toFixed(1) || 0, icon: Zap, color: '#10b981' },
        { label: 'Error Rate', value: `${runDetails.load_results.error_rate?.toFixed(1) || 0}%`, icon: AlertTriangle, color: runDetails.load_results.error_rate > 5 ? '#ef4444' : '#10b981' }
      ];
    }
    return [
      { label: 'Total', value: runDetails.total_tests || 0, icon: Target },
      { label: 'Passed', value: runDetails.passed || 0, icon: CheckCircle2, color: '#10b981' },
      { label: 'Failed', value: runDetails.failed || 0, icon: XCircle, color: runDetails.failed > 0 ? '#ef4444' : '#6b7280' }
    ];
  }, [testType, runDetails]);

  return (
    <div className="overview-tab">
      {/* Status Banner */}
      <div className={`status-banner ${runDetails.status?.toLowerCase() === 'pass' ? 'success' : 'failure'}`}>
        <div className="status-icon">
          {runDetails.status?.toLowerCase() === 'pass' ? (
            <CheckCircle2 size={28} />
          ) : (
            <XCircle size={28} />
          )}
        </div>
        <div className="status-content">
          <h3>{runDetails.status?.toLowerCase() === 'pass' ? 'All Tests Passed' : 'Tests Failed'}</h3>
          <p>{runDetails.test_type} on {runDetails.website_name}</p>
        </div>
        <div className="status-rate">{passRate}%</div>
      </div>

      {/* Lighthouse Scores (if performance test) */}
      {lighthouseScores && (
        <div className="lighthouse-scores">
          {lighthouseScores.map((score, idx) => (
            <RadialProgress
              key={idx}
              value={score.value}
              size={90}
              label={score.label}
            />
          ))}
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="quick-stats-grid">
        {quickStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="quick-stat">
              <Icon size={18} color={stat.color || '#6b7280'} />
              <span className="stat-value" style={{ color: stat.color }}>{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          );
        })}
        <div className="quick-stat">
          <Clock size={18} color="#6b7280" />
          <span className="stat-value">{runDetails.duration_ms ? `${(runDetails.duration_ms / 1000).toFixed(1)}s` : '—'}</span>
          <span className="stat-label">Duration</span>
        </div>
      </div>

      {/* Top Opportunities */}
      {topOpportunities.length > 0 && (
        <div className="opportunities-section">
          <h4><Lightbulb size={16} /> Top Opportunities</h4>
          <div className="opportunities-list">
            {topOpportunities.map((opp, idx) => (
              <div key={idx} className={`opportunity-item ${opp.type}`}>
                <div className="opportunity-text">{opp.text}</div>
                <div className="opportunity-detail">{opp.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CONSOLE LOGS TAB - Virtualized with Color Coding
// ============================================================================
function ConsoleLogsTab({ runDetails }) {
  const [filter, setFilter] = useState('all');

  // Parse logs from various sources
  const logs = useMemo(() => {
    const allLogs = [];

    // Add test results as logs
    if (runDetails.results && Array.isArray(runDetails.results)) {
      runDetails.results.forEach((result, idx) => {
        allLogs.push({
          id: `result-${idx}`,
          level: result.status === 'Pass' ? 'info' : 'error',
          timestamp: new Date().toISOString(),
          message: `[${result.test_name}] ${result.status}`,
          detail: result.error_message || result.message || ''
        });
      });
    }

    // Add console errors if available
    if (runDetails.console_errors && Array.isArray(runDetails.console_errors)) {
      runDetails.console_errors.forEach((error, idx) => {
        allLogs.push({
          id: `console-${idx}`,
          level: 'error',
          timestamp: error.timestamp || new Date().toISOString(),
          message: error.text || error.message || String(error),
          detail: error.url || ''
        });
      });
    }

    // Add network errors if available
    if (runDetails.network_errors && Array.isArray(runDetails.network_errors)) {
      runDetails.network_errors.forEach((error, idx) => {
        allLogs.push({
          id: `network-${idx}`,
          level: 'warn',
          timestamp: error.timestamp || new Date().toISOString(),
          message: `[Network] ${error.url || 'Request failed'}`,
          detail: error.status ? `Status: ${error.status}` : ''
        });
      });
    }

    // If no logs found, add a placeholder
    if (allLogs.length === 0) {
      allLogs.push({
        id: 'empty',
        level: 'info',
        timestamp: new Date().toISOString(),
        message: 'No console logs captured for this test run',
        detail: ''
      });
    }

    return allLogs;
  }, [runDetails]);

  const filteredLogs = useMemo(() => {
    if (filter === 'all') return logs;
    return logs.filter(log => log.level === filter);
  }, [logs, filter]);

  const logCounts = useMemo(() => ({
    all: logs.length,
    error: logs.filter(l => l.level === 'error').length,
    warn: logs.filter(l => l.level === 'warn').length,
    info: logs.filter(l => l.level === 'info').length
  }), [logs]);

  // Virtualized row renderer
  const LogRow = ({ index, style }) => {
    const log = filteredLogs[index];
    return (
      <div
        style={style}
        className={`log-row ${log.level}`}
      >
        <span className="log-level">[{log.level.toUpperCase()}]</span>
        <span className="log-message">{log.message}</span>
        {log.detail && <span className="log-detail">{log.detail}</span>}
      </div>
    );
  };

  return (
    <div className="console-logs-tab">
      {/* Filter Tabs */}
      <div className="log-filters">
        {['all', 'error', 'warn', 'info'].map(type => (
          <button
            key={type}
            className={`log-filter-btn ${filter === type ? 'active' : ''} ${type}`}
            onClick={() => setFilter(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
            <span className="count">{logCounts[type]}</span>
          </button>
        ))}
      </div>

      {/* Virtualized Log List */}
      <div className="log-container">
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              itemCount={filteredLogs.length}
              itemSize={60}
              width={width}
            >
              {LogRow}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
}

// ============================================================================
// ARTIFACTS TAB - Grid with Lightbox
// ============================================================================
function ArtifactsTab({ runDetails }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState(null);

  // Collect all artifacts
  const artifacts = useMemo(() => {
    const items = [];

    // Screenshots from results
    if (runDetails.results && Array.isArray(runDetails.results)) {
      runDetails.results.forEach((result, idx) => {
        if (result.screenshot_url) {
          items.push({
            id: `screenshot-${idx}`,
            type: 'screenshot',
            name: result.test_name || `Screenshot ${idx + 1}`,
            url: result.screenshot_url,
            thumbnail: result.screenshot_url
          });
        }
      });
    }

    // Lighthouse report
    if (runDetails.report_url) {
      items.push({
        id: 'lighthouse-report',
        type: 'report',
        name: 'Lighthouse Report',
        url: runDetails.report_url,
        icon: FileText
      });
    }

    // JSON report
    if (runDetails.json_report_url) {
      items.push({
        id: 'json-report',
        type: 'json',
        name: 'JSON Report',
        url: runDetails.json_report_url,
        icon: Database
      });
    }

    // HAR file
    if (runDetails.har_url) {
      items.push({
        id: 'har-file',
        type: 'har',
        name: 'HAR File',
        url: runDetails.har_url,
        icon: Activity
      });
    }

    // Visual regression images
    if (runDetails.visual_results?.comparisons) {
      runDetails.visual_results.comparisons.forEach((comp, idx) => {
        if (comp.diff_url) {
          items.push({
            id: `diff-${idx}`,
            type: 'diff',
            name: `Diff: ${comp.viewport || 'Desktop'}`,
            url: comp.diff_url,
            thumbnail: comp.diff_url,
            difference: comp.difference
          });
        }
      });
    }

    return items;
  }, [runDetails]);

  const openLightbox = (artifact) => {
    if (artifact.type === 'screenshot' || artifact.type === 'diff') {
      setSelectedArtifact(artifact);
      setLightboxOpen(true);
    } else {
      window.open(artifact.url, '_blank');
    }
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedArtifact(null);
  };

  if (artifacts.length === 0) {
    return (
      <div className="artifacts-empty">
        <Folder size={48} />
        <p>No artifacts captured for this test run</p>
      </div>
    );
  }

  return (
    <div className="artifacts-tab">
      <div className="artifacts-grid">
        {artifacts.map(artifact => {
          const Icon = artifact.icon || Image;
          return (
            <div
              key={artifact.id}
              className={`artifact-card ${artifact.type}`}
              onClick={() => openLightbox(artifact)}
            >
              {artifact.thumbnail ? (
                <div className="artifact-thumbnail">
                  <img src={artifact.thumbnail} alt={artifact.name} />
                  <div className="artifact-overlay">
                    <Maximize2 size={20} />
                  </div>
                </div>
              ) : (
                <div className="artifact-icon">
                  <Icon size={32} />
                </div>
              )}
              <div className="artifact-info">
                <span className="artifact-name">{artifact.name}</span>
                <span className="artifact-type">{artifact.type.toUpperCase()}</span>
              </div>
              {artifact.difference !== undefined && (
                <div className={`artifact-badge ${artifact.difference > 0 ? 'changed' : 'match'}`}>
                  {artifact.difference > 0 ? `${artifact.difference.toFixed(2)}% diff` : 'Match'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && selectedArtifact && (
          <motion.div
            className="lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            <motion.div
              className="lightbox-content"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="lightbox-close" onClick={closeLightbox}>
                <X size={24} />
              </button>
              <img src={selectedArtifact.url} alt={selectedArtifact.name} />
              <div className="lightbox-caption">
                <span>{selectedArtifact.name}</span>
                <a href={selectedArtifact.url} target="_blank" rel="noopener noreferrer">
                  <Download size={16} /> Download
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// RAW DATA TAB - Collapsible JSON Tree
// ============================================================================
function RawDataTab({ runDetails }) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(runDetails, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Organize data into sections
  const organizedData = useMemo(() => ({
    summary: {
      run_id: runDetails.id,
      test_type: runDetails.test_type,
      status: runDetails.status,
      website: runDetails.website_name,
      url: runDetails.website_url,
      duration_ms: runDetails.duration_ms,
      created_at: runDetails.created_at
    },
    metrics: runDetails.performance_metrics || runDetails.load_results || runDetails.security_results || {},
    results: runDetails.results || [],
    raw: runDetails
  }), [runDetails]);

  return (
    <div className="raw-data-tab">
      <div className="raw-data-header">
        <div className="raw-data-actions">
          <button
            className="collapse-toggle"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            {collapsed ? 'Expand All' : 'Collapse All'}
          </button>
          <button
            className={`copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy JSON'}
          </button>
        </div>
      </div>

      <div className="json-tree-container">
        <JsonView
          data={organizedData}
          shouldExpandNode={collapsed ? () => false : allExpanded}
          style={{
            ...defaultStyles,
            container: 'json-tree',
            label: 'json-label',
            nullValue: 'json-null',
            undefinedValue: 'json-undefined',
            stringValue: 'json-string',
            booleanValue: 'json-boolean',
            numberValue: 'json-number',
            otherValue: 'json-other',
            punctuation: 'json-punctuation',
            noQuotesForStringValues: false
          }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// PANEL HEADER
// ============================================================================
function PanelHeader({ runDetails, onClose, onRefresh, onRetest, isLoading, isRetesting }) {
  const statusColor = runDetails?.status?.toLowerCase() === 'pass' ? '#10b981' : '#ef4444';

  return (
    <div className="panel-header">
      <div className="header-left">
        <div className="header-status" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
          {runDetails?.status?.toLowerCase() === 'pass' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
        </div>
        <div className="header-info">
          <h2>{runDetails?.test_type || 'Test Run'}</h2>
          <div className="header-meta">
            <span className="website-name">{runDetails?.website_name}</span>
            <span className="separator">•</span>
            <span className="run-id">#{runDetails?.id}</span>
            <span className="separator">•</span>
            <span className="timestamp">{runDetails?.created_at ? new Date(runDetails.created_at).toLocaleString() : ''}</span>
          </div>
        </div>
      </div>
      <div className="header-actions" data-tutorial="action-buttons">
        <ResultsTutorial />
        <button
          className="retest-btn"
          onClick={onRetest}
          disabled={isRetesting || isLoading}
        >
          <RefreshCw size={14} className={isRetesting ? 'spin' : ''} />
          {isRetesting ? 'Running...' : 'Re-run'}
        </button>
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT - TestDetailsPanel
// ============================================================================
export default function TestDetailsPanel({ isOpen, onClose, testRunId, initialData, onTestStarted }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRetesting, setIsRetesting] = useState(false);

  const { data: runDetails, isLoading, refetch } = useQuery({
    queryKey: ['testRun', testRunId],
    queryFn: () => getTestRun(testRunId),
    enabled: !!testRunId && isOpen,
    initialData: initialData ? { data: initialData } : undefined,
    select: (res) => res.data
  });

  // Reset to overview tab when panel opens with new test
  useEffect(() => {
    if (isOpen && testRunId) {
      setActiveTab('overview');
    }
  }, [isOpen, testRunId]);

  const handleRetest = async () => {
    if (!runDetails || isRetesting) return;
    setIsRetesting(true);
    try {
      const testType = runDetails.test_type?.toLowerCase();
      const websiteId = runDetails.website_id;

      let response;
      if (testType === 'smoke') {
        response = await runSmokeTest(websiteId);
      } else if (testType === 'performance') {
        response = await runPerformanceTest(websiteId);
      }

      if (onTestStarted && response?.data) {
        onTestStarted(response.data);
      }
      onClose();
    } catch (error) {
      console.error('Retest failed:', error);
    } finally {
      setIsRetesting(false);
    }
  };

  return (
    <Sheet open={isOpen} onClose={onClose}>
      {runDetails && (
        <div className="test-details-panel">
          <PanelHeader
            runDetails={runDetails}
            onClose={onClose}
            onRefresh={refetch}
            onRetest={handleRetest}
            isLoading={isLoading}
            isRetesting={isRetesting}
          />

          {/* Tab Navigation */}
          <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="tabs-root">
            <Tabs.List className="tabs-list" data-tutorial="overview-tab">
              <Tabs.Trigger value="overview" className="tab-trigger">
                <Gauge size={14} />
                Overview
              </Tabs.Trigger>
              <Tabs.Trigger value="logs" className="tab-trigger">
                <Terminal size={14} />
                Console Logs
              </Tabs.Trigger>
              <Tabs.Trigger value="artifacts" className="tab-trigger">
                <Image size={14} />
                Artifacts
              </Tabs.Trigger>
              <Tabs.Trigger value="raw" className="tab-trigger">
                <Database size={14} />
                Raw Data
              </Tabs.Trigger>
            </Tabs.List>

            <div className="tabs-content-wrapper" data-tutorial="results-list">
              <Tabs.Content value="overview" className="tab-content" data-tutorial="score-display">
                <OverviewTab runDetails={runDetails} />
              </Tabs.Content>
              <Tabs.Content value="logs" className="tab-content">
                <ConsoleLogsTab runDetails={runDetails} />
              </Tabs.Content>
              <Tabs.Content value="artifacts" className="tab-content">
                <ArtifactsTab runDetails={runDetails} />
              </Tabs.Content>
              <Tabs.Content value="raw" className="tab-content">
                <RawDataTab runDetails={runDetails} />
              </Tabs.Content>
            </div>
          </Tabs.Root>
        </div>
      )}

      {isLoading && !runDetails && (
        <div className="loading-state">
          <RefreshCw size={32} className="spin" />
        </div>
      )}
    </Sheet>
  );
}
