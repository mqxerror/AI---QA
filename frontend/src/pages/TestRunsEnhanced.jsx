import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTestRuns, getTestRun } from '../services/api';
import { RefreshCw, FlaskConical, Search, Filter, SortDesc, ChevronDown, X, LayoutList, LayoutGrid, Eye, RotateCw, GitCompare, AlertTriangle, ChevronRight, Globe } from 'lucide-react';
import { useTestResultUpdates } from '../hooks/useRealtimeUpdates';
import {
  AnimatedCounter,
  TextShimmer,
  FadeText
} from '../components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import TestRunSidePanel from '../components/TestRunSidePanel';
import './TestRunsEnhanced.css';

export default function TestRunsEnhanced() {
  const [selectedTestRunId, setSelectedTestRunId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState(null);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [sortBy, setSortBy] = useState('most_recent');
  const [density, setDensity] = useState('compact');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedWebsite, setSelectedWebsite] = useState('all');

  // Filter popovers
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showSortPopover, setShowSortPopover] = useState(false);
  const [showWebsitePopover, setShowWebsitePopover] = useState(false);

  const queryClient = useQueryClient();

  // Real-time updates
  useTestResultUpdates(() => {
    queryClient.invalidateQueries(['test-runs']);
  }, []);

  const { data: runs = [], isLoading, refetch } = useQuery({
    queryKey: ['test-runs'],
    queryFn: () => getTestRuns({ limit: 100 }).then(res => res.data),
    refetchInterval: 5000
  });

  // Calculate stats
  const stats = useMemo(() => ({
    total: runs.length,
    passed: runs.filter(r => r.status === 'Pass').length,
    failed: runs.filter(r => r.status === 'Fail').length,
    running: runs.filter(r => r.status === 'Running').length,
  }), [runs]);

  // Extract unique websites
  const websites = useMemo(() => {
    const uniqueWebsites = [...new Set(runs.map(r => r.website_name).filter(Boolean))];
    return uniqueWebsites.sort((a, b) => a.localeCompare(b));
  }, [runs]);

  const getPassRate = () => {
    if (stats.total === 0) return 0;
    return Math.round((stats.passed / stats.total) * 100);
  };

  // Filter and sort runs
  const filteredAndSortedRuns = useMemo(() => {
    let filtered = [...runs];

    // Website filter
    if (selectedWebsite !== 'all') {
      filtered = filtered.filter(run => run.website_name === selectedWebsite);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(run =>
        run.website_name?.toLowerCase().includes(term) ||
        run.website_url?.toLowerCase().includes(term) ||
        run.test_type?.toLowerCase().includes(term) ||
        String(run.id).includes(term)
      );
    }

    // Status filters
    if (activeFilters.failed_only) {
      filtered = filtered.filter(run => run.status === 'Fail');
    }
    if (activeFilters.passed_only) {
      filtered = filtered.filter(run => run.status === 'Pass');
    }

    // Test type filters
    if (activeFilters.accessibility_only) {
      filtered = filtered.filter(run => run.test_type === 'Accessibility');
    }
    if (activeFilters.performance_only) {
      filtered = filtered.filter(run => run.test_type === 'Performance');
    }
    if (activeFilters.security_only) {
      filtered = filtered.filter(run => run.test_type === 'Security Scan');
    }

    // Time filters
    if (activeFilters.last_24h) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      filtered = filtered.filter(run => new Date(run.created_at) > oneDayAgo);
    }
    if (activeFilters.last_7d) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(run => new Date(run.created_at) > sevenDaysAgo);
    }

    // Sorting
    switch (sortBy) {
      case 'most_failures':
        filtered.sort((a, b) => (b.failed || 0) - (a.failed || 0));
        break;
      case 'most_recent':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'longest_duration':
        filtered.sort((a, b) => (b.duration_ms || 0) - (a.duration_ms || 0));
        break;
      case 'alphabetical':
        filtered.sort((a, b) => (a.website_name || '').localeCompare(b.website_name || ''));
        break;
    }

    return filtered;
  }, [runs, searchTerm, activeFilters, sortBy, selectedWebsite]);

  const handleViewRun = async (run) => {
    console.log('handleViewRun called with:', run);
    console.log('Test type:', run.test_type);

    // Use side panel for all test types
    setSelectedTestRunId(run.id);
    setModalInitialData(run);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTestRunId(null);
    setModalInitialData(null);
  };

  const toggleFilter = (filterId) => {
    setActiveFilters(prev => ({ ...prev, [filterId]: !prev[filterId] }));
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchTerm('');
    setSelectedWebsite('all');
  };

  const toggleRowExpand = (runId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(runId)) {
      newExpanded.delete(runId);
    } else {
      newExpanded.add(runId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusBadge = (status) => {
    const badges = { Pass: 'status-success', Fail: 'status-error', Running: 'status-running', Pending: 'status-pending' };
    return badges[status] || 'status-default';
  };

  const getStatusIcon = (status) => {
    const icons = { Pass: '✓', Fail: '✗', Running: '⏳', Pending: '⚠' };
    return icons[status] || '•';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length + (selectedWebsite !== 'all' ? 1 : 0);

  const filterOptions = [
    { id: 'failed_only', label: 'Failed Only', category: 'Status' },
    { id: 'passed_only', label: 'Passed Only', category: 'Status' },
    { id: 'last_24h', label: 'Last 24 hours', category: 'Time' },
    { id: 'last_7d', label: 'Last 7 days', category: 'Time' },
    { id: 'accessibility_only', label: 'Accessibility', category: 'Type' },
    { id: 'performance_only', label: 'Performance', category: 'Type' },
    { id: 'security_only', label: 'Security', category: 'Type' },
  ];

  const sortOptions = [
    { id: 'most_recent', label: 'Most Recent' },
    { id: 'most_failures', label: 'Most Failures' },
    { id: 'longest_duration', label: 'Longest Duration' },
    { id: 'alphabetical', label: 'Alphabetical' },
  ];

  if (isLoading) return <div className="loading">Loading test runs...</div>;

  return (
    <div className="test-runs-page">
      {/* Header */}
      <div className="page-header">
        <FadeText direction="down">
          <div>
            <TextShimmer className="title-shimmer">
              <h1>Test Runs</h1>
            </TextShimmer>
            <p>View and manage all test executions</p>
          </div>
        </FadeText>
        <div className="header-actions">
          {/* Density Toggle */}
          <div className="density-toggle">
            <button
              onClick={() => setDensity('compact')}
              className={`density-btn ${density === 'compact' ? 'active' : ''}`}
            >
              <LayoutList size={16} />
              Compact
            </button>
            <button
              onClick={() => setDensity('comfortable')}
              className={`density-btn ${density === 'comfortable' ? 'active' : ''}`}
            >
              <LayoutGrid size={16} />
              Comfortable
            </button>
          </div>
          <button onClick={() => refetch()} className="refresh-btn">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card clickable" onClick={clearFilters}>
          <div className="stat-value"><AnimatedCounter value={stats.total} /></div>
          <div className="stat-label">Total Runs</div>
        </div>
        <div className="stat-card stat-success clickable" onClick={() => setActiveFilters({ passed_only: true })}>
          <div className="stat-value"><AnimatedCounter value={stats.passed} /></div>
          <div className="stat-label">Passed</div>
          <div className="stat-progress"><div className="progress-bar" style={{ width: `${getPassRate()}%` }}></div></div>
          <div className="stat-meta">{getPassRate()}% pass rate</div>
        </div>
        <div className="stat-card stat-failure clickable" onClick={() => setActiveFilters({ failed_only: true })}>
          <div className="stat-value"><AnimatedCounter value={stats.failed} /></div>
          <div className="stat-label">Failed</div>
        </div>
        {stats.running > 0 && (
          <div className="stat-card stat-running">
            <div className="stat-value"><AnimatedCounter value={stats.running} /><span className="live-indicator"></span></div>
            <div className="stat-label">Running</div>
            <div className="stat-meta">Live</div>
          </div>
        )}
      </div>

      {/* Optimized Filters Bar */}
      <div className="filters-bar-v2">
        <div className="filters-left">
          {/* Search */}
          <div className="search-box-v2">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search runs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Website/Project Dropdown */}
          <div className="popover-container">
            <button
              className={`dropdown-btn ${selectedWebsite !== 'all' ? 'active' : ''}`}
              onClick={() => setShowWebsitePopover(!showWebsitePopover)}
            >
              <Globe size={16} />
              <span className="dropdown-label">
                {selectedWebsite === 'all' ? 'All Websites' : selectedWebsite}
              </span>
              <ChevronDown size={14} className={showWebsitePopover ? 'rotate' : ''} />
            </button>
            {showWebsitePopover && (
              <div className="popover popover-websites">
                <div className="popover-search">
                  <Search size={14} />
                  <input type="text" placeholder="Search websites..." />
                </div>
                <div className="popover-content">
                  <button
                    className={`website-option ${selectedWebsite === 'all' ? 'active' : ''}`}
                    onClick={() => { setSelectedWebsite('all'); setShowWebsitePopover(false); }}
                  >
                    <span className="website-name">All Websites</span>
                    <span className="website-count">{runs.length}</span>
                  </button>
                  {websites.map(website => {
                    const count = runs.filter(r => r.website_name === website).length;
                    return (
                      <button
                        key={website}
                        className={`website-option ${selectedWebsite === website ? 'active' : ''}`}
                        onClick={() => { setSelectedWebsite(website); setShowWebsitePopover(false); }}
                      >
                        <span className="website-name">{website}</span>
                        <span className="website-count">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="filters-right">
          {/* Quick Filters */}
          <div className="quick-filters">
            <button
              className={`quick-filter-btn ${activeFilters.failed_only ? 'active danger' : ''}`}
              onClick={() => toggleFilter('failed_only')}
            >
              Failed
            </button>
            <button
              className={`quick-filter-btn ${activeFilters.last_24h ? 'active' : ''}`}
              onClick={() => toggleFilter('last_24h')}
            >
              24h
            </button>
          </div>

          {/* More Filters Popover */}
          <div className="popover-container">
            <button
              className={`icon-btn ${activeFilterCount > 2 ? 'active' : ''}`}
              onClick={() => setShowFilterPopover(!showFilterPopover)}
              title="More filters"
            >
              <Filter size={16} />
              {activeFilterCount > 0 && <span className="badge-count">{activeFilterCount}</span>}
            </button>
            {showFilterPopover && (
              <div className="popover popover-filters">
                <div className="popover-header">
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <button className="link-btn" onClick={clearFilters}>Clear all</button>
                  )}
                </div>
                <div className="popover-content">
                  {['Status', 'Time', 'Type'].map(category => (
                    <div key={category} className="popover-section">
                      <div className="popover-section-title">{category}</div>
                      {filterOptions.filter(f => f.category === category).map(filter => (
                        <label key={filter.id} className="filter-option">
                          <input
                            type="checkbox"
                            checked={activeFilters[filter.id] || false}
                            onChange={() => toggleFilter(filter.id)}
                          />
                          <span>{filter.label}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sort Popover */}
          <div className="popover-container">
            <button
              className="icon-btn"
              onClick={() => setShowSortPopover(!showSortPopover)}
              title="Sort options"
            >
              <SortDesc size={16} />
            </button>
            {showSortPopover && (
              <div className="popover popover-small popover-right">
                {sortOptions.map(option => (
                  <button
                    key={option.id}
                    className={`sort-option ${sortBy === option.id ? 'active' : ''}`}
                    onClick={() => { setSortBy(option.id); setShowSortPopover(false); }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="divider"></div>
          <span className="runs-count-v2">{filteredAndSortedRuns.length} <span>runs</span></span>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="filter-chips">
          <span className="chips-label">Active:</span>
          {selectedWebsite !== 'all' && (
            <button className="filter-chip website" onClick={() => setSelectedWebsite('all')}>
              <Globe size={12} />
              {selectedWebsite}
              <X size={12} />
            </button>
          )}
          {filterOptions.filter(f => activeFilters[f.id]).map(filter => (
            <button key={filter.id} className="filter-chip" onClick={() => toggleFilter(filter.id)}>
              {filter.label}
              <X size={12} />
            </button>
          ))}
          <button className="clear-all" onClick={clearFilters}>Clear all</button>
        </div>
      )}

      {/* Test Runs Table */}
      <div className="runs-table-container">
        {filteredAndSortedRuns.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FlaskConical size={48} /></div>
            <p>No test runs found</p>
            <p className="text-muted">
              {searchTerm || activeFilterCount > 0
                ? 'Try adjusting your filters or search terms'
                : 'Run a test from the Websites page to see results here'}
            </p>
          </div>
        ) : (
          <table className={`runs-table ${density}`}>
            <thead>
              <tr>
                <th style={{ width: '30px' }}></th>
                <th style={{ width: '50px' }}>Status</th>
                <th>Test Type</th>
                <th>Website</th>
                <th>Results</th>
                <th>Time</th>
                <th style={{ width: '80px' }}>Duration</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedRuns.map((run, index) => (
                <React.Fragment key={run.id}>
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className={`run-row ${getStatusBadge(run.status)} ${expandedRows.has(run.id) ? 'expanded' : ''}`}
                  >
                    <td className="expand-cell">
                      <button className="expand-btn" onClick={() => toggleRowExpand(run.id)}>
                        <ChevronRight size={16} className={expandedRows.has(run.id) ? 'rotate-90' : ''} />
                      </button>
                    </td>
                    <td className="status-cell">
                      <span className={`status-icon ${getStatusBadge(run.status)}`}>
                        {getStatusIcon(run.status)}
                      </span>
                    </td>
                    <td><span className="test-type-text">{run.test_type}</span></td>
                    <td><span className="website-name">{run.website_name || '—'}</span></td>
                    <td>
                      <span className="results-text">
                        {run.total_tests > 0 ? (
                          <>
                            <span className="passed-count">{run.passed}</span>
                            <span className="separator">/</span>
                            <span className="failed-count">{run.failed}</span>
                            <span className="separator">/</span>
                            <span className="total-count">{run.total_tests}</span>
                          </>
                        ) : '—'}
                      </span>
                    </td>
                    <td className="time-cell">{formatDate(run.created_at)}</td>
                    <td className="duration-cell">{run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : '—'}</td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        {run.failed > 0 && (
                          <button className="action-btn danger" onClick={() => handleViewRun(run)} title="View Failures">
                            <AlertTriangle size={14} />
                          </button>
                        )}
                        <button className="action-btn" onClick={() => handleViewRun(run)} title="View Details">
                          <Eye size={14} />
                        </button>
                        <button className="action-btn" title="Rerun">
                          <RotateCw size={14} />
                        </button>
                        <button className="action-btn" title="Compare">
                          <GitCompare size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                  {/* Expanded Row */}
                  <AnimatePresence>
                    {expandedRows.has(run.id) && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="expanded-row"
                      >
                        <td colSpan={8}>
                          <div className="expanded-content">
                            <div className="expanded-grid">
                              <div className="expanded-item">
                                <span className="expanded-label">Run ID</span>
                                <span className="expanded-value">#{run.id}</span>
                              </div>
                              <div className="expanded-item">
                                <span className="expanded-label">URL</span>
                                <span className="expanded-value">{run.website_url || '—'}</span>
                              </div>
                              <div className="expanded-item">
                                <span className="expanded-label">Failure Rate</span>
                                <span className="expanded-value">
                                  {run.total_tests > 0 ? `${((run.failed / run.total_tests) * 100).toFixed(1)}%` : '0%'}
                                </span>
                              </div>
                              <div className="expanded-item">
                                <button className="btn-view-full" onClick={() => handleViewRun(run)}>
                                  View Full Report
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Side Panel for all test types */}
      <TestRunSidePanel
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        testRunId={selectedTestRunId}
        initialData={modalInitialData}
      />
    </div>
  );
}
