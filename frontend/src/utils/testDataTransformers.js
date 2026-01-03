/**
 * Data transformers for Test Runs
 * These functions transform backend data into frontend-ready formats
 */

/**
 * Transform smoke test results - FIXES FIELD MISMATCH BUG
 * Backend uses: duration_ms, error_message
 * Old code used: duration, message
 */
export const transformSmokeResults = (results) => {
  if (!results || !Array.isArray(results)) return [];

  return results.map(result => ({
    id: result.id,
    test_name: result.test_name,
    category: result.category,
    status: result.status,
    duration_ms: result.duration_ms,      // FIX: was result.duration
    error_message: result.error_message,  // FIX: was result.message
    screenshot_url: result.screenshot_url,
    created_at: result.created_at
  }));
};

/**
 * Transform performance metrics and add ratings
 */
export const transformPerformanceMetrics = (metrics) => {
  if (!metrics) return null;

  const getRating = (metric, value) => {
    const thresholds = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      ttfb: { good: 800, poor: 1800 },
      fcp: { good: 1800, poor: 3000 },
    };

    const threshold = thresholds[metric.toLowerCase()];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value >= threshold.poor) return 'poor';
    return 'needs-improvement';
  };

  return {
    lcp: {
      value: metrics.lcp,
      rating: getRating('lcp', metrics.lcp),
      label: 'Largest Contentful Paint'
    },
    fid: {
      value: metrics.fid,
      rating: getRating('fid', metrics.fid),
      label: 'First Input Delay'
    },
    cls: {
      value: metrics.cls,
      rating: getRating('cls', metrics.cls),
      label: 'Cumulative Layout Shift'
    },
    ttfb: {
      value: metrics.ttfb,
      rating: getRating('ttfb', metrics.ttfb),
      label: 'Time to First Byte'
    },
    fcp: {
      value: metrics.fcp,
      rating: getRating('fcp', metrics.fcp),
      label: 'First Contentful Paint'
    },
    lighthouse: metrics.lighthouse_score ? {
      performance: metrics.lighthouse_score.performance,
      accessibility: metrics.lighthouse_score.accessibility,
      bestPractices: metrics.lighthouse_score['best-practices'],
      seo: metrics.lighthouse_score.seo,
    } : null
  };
};

/**
 * Transform accessibility violations grouped by severity
 */
export const transformAccessibilityViolations = (violations) => {
  if (!violations || !Array.isArray(violations)) return [];

  const grouped = {
    critical: [],
    serious: [],
    moderate: [],
    minor: []
  };

  violations.forEach(violation => {
    const severity = violation.impact || 'minor';
    if (grouped[severity]) {
      grouped[severity].push({
        id: violation.id,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes?.length || 0,
        wcag: violation.tags?.filter(tag => tag.startsWith('wcag')) || []
      });
    }
  });

  return grouped;
};

/**
 * Transform security test results
 */
export const transformSecurityResults = (security) => {
  if (!security) return null;

  return {
    ssl: {
      status: security.ssl_status,
      grade: security.ssl_grade,
      expires: security.ssl_expires
    },
    headers: security.security_headers ? JSON.parse(security.security_headers) : {},
    vulnerabilities: security.vulnerabilities ? JSON.parse(security.vulnerabilities) : []
  };
};

/**
 * Transform SEO results
 */
export const transformSEOResults = (seo) => {
  if (!seo) return null;

  return {
    score: seo.seo_score,
    metaTags: seo.meta_tags ? JSON.parse(seo.meta_tags) : {},
    structuredData: seo.structured_data ? JSON.parse(seo.structured_data) : [],
    technicalSEO: seo.technical_seo ? JSON.parse(seo.technical_seo) : {},
    issues: seo.issues ? JSON.parse(seo.issues) : []
  };
};

/**
 * Transform pixel detection results
 */
export const transformPixelResults = (pixelResults) => {
  if (!pixelResults) return null;

  return {
    detected: pixelResults.pixels_detected ? JSON.parse(pixelResults.pixels_detected) : [],
    events: pixelResults.events ? JSON.parse(pixelResults.events) : [],
    network: pixelResults.network_timeline ? JSON.parse(pixelResults.network_timeline) : []
  };
};

/**
 * Transform visual regression results
 */
export const transformVisualResults = (visual) => {
  if (!visual) return null;

  return {
    baselineUrl: visual.baseline_url,
    currentUrl: visual.current_url,
    diffUrl: visual.diff_url,
    comparisons: visual.comparisons ? JSON.parse(visual.comparisons) : [],
    issues: visual.issues_detected || 0,
    similarity: visual.similarity_score
  };
};

/**
 * Transform load test results with derived metrics
 */
export const transformLoadResults = (load) => {
  if (!load) return null;

  const requests = load.total_requests || 0;
  const duration = load.duration_seconds || 1;
  const failed = load.failed_requests || 0;

  return {
    totalRequests: requests,
    successfulRequests: requests - failed,
    failedRequests: failed,
    duration: duration,
    throughput: (requests / duration).toFixed(2), // requests per second
    errorRate: ((failed / requests) * 100).toFixed(2), // percentage
    avgLatency: load.avg_latency_ms,
    p95Latency: load.p95_latency_ms,
    p99Latency: load.p99_latency_ms,
    latencyDistribution: load.latency_distribution ? JSON.parse(load.latency_distribution) : []
  };
};

/**
 * Calculate pass/fail stats for charts
 */
export const calculateTestStats = (testRuns) => {
  if (!testRuns || !Array.isArray(testRuns)) return { passed: 0, failed: 0, running: 0, total: 0 };

  const stats = testRuns.reduce((acc, run) => {
    const status = run.status?.toLowerCase();
    if (status === 'pass') acc.passed++;
    else if (status === 'fail') acc.failed++;
    else if (status === 'running') acc.running++;
    acc.total++;
    return acc;
  }, { passed: 0, failed: 0, running: 0, total: 0 });

  stats.passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;

  return stats;
};

/**
 * Group test runs by website
 */
export const groupByWebsite = (testRuns) => {
  if (!testRuns || !Array.isArray(testRuns)) return {};

  return testRuns.reduce((acc, run) => {
    const website = run.website_name || 'Unknown';
    if (!acc[website]) {
      acc[website] = [];
    }
    acc[website].push(run);
    return acc;
  }, {});
};

/**
 * Group test runs by date
 */
export const groupByDate = (testRuns) => {
  if (!testRuns || !Array.isArray(testRuns)) return {};

  return testRuns.reduce((acc, run) => {
    const date = new Date(run.created_at).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(run);
    return acc;
  }, {});
};

/**
 * Get timeline data for last N days
 */
export const getTimelineData = (testRuns, days = 7) => {
  const timeline = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = date.toLocaleDateString();

    const runsForDay = testRuns.filter(run => {
      const runDate = new Date(run.created_at).toLocaleDateString();
      return runDate === dateString;
    });

    timeline.push({
      date: dateString,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      runs: runsForDay,
      stats: calculateTestStats(runsForDay)
    });
  }

  return timeline;
};
