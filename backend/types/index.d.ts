// Database Models
export interface Website {
  id: number;
  name: string;
  url: string;
  status: 'Active' | 'Inactive';
  test_frequency: 'Manual' | 'Daily' | 'Weekly';
  last_result?: 'Pass' | 'Fail' | null;
  last_tested_at?: string | null;
  created_at: string;
}

export interface TestRun {
  id: number;
  run_id: string;
  website_id: number;
  test_type: TestType;
  status: 'Pass' | 'Fail';
  total_tests: number;
  passed: number;
  failed: number;
  duration_ms: number;
  report_url?: string | null;
  created_at: string;
  website_name?: string;
  website_url?: string;
}

export type TestType =
  | 'Smoke'
  | 'Performance'
  | 'Pixel Audit'
  | 'Load Test'
  | 'Accessibility'
  | 'Security Scan'
  | 'SEO Audit'
  | 'API Test'
  | 'Visual Regression'
  | 'Broken Links'
  | 'Content Quality'
  | 'Uptime Check';

export interface TestResult {
  id: number;
  test_run_id: number;
  test_name: string;
  category?: string | null;
  status: 'Pass' | 'Fail';
  duration_ms: number;
  error_message?: string | null;
  screenshot_url?: string | null;
  created_at: string;
}

export interface PerformanceMetrics {
  id: number;
  test_run_id: number;
  lcp?: number | null;
  fcp?: number | null;
  ttfb?: number | null;
  cls?: number | null;
  fid?: number | null;
  performance_score?: number | null;
  accessibility_score?: number | null;
  seo_score?: number | null;
  created_at: string;
}

export interface PixelResult {
  id: number;
  test_run_id: number;
  pixel_vendor: string;
  pixel_id?: string | null;
  found: boolean;
  events_detected?: string | null; // JSON
  warnings?: string | null; // JSON
  created_at: string;
}

export interface AccessibilityResult {
  id: number;
  test_run_id: number;
  violation_id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description?: string | null;
  help?: string | null;
  help_url?: string | null;
  nodes_affected: number;
  wcag_tags?: string | null; // JSON
  created_at: string;
}

export interface LoadTestResult {
  id: number;
  test_run_id: number;
  virtual_users: number;
  duration_seconds: number;
  requests_total: number;
  requests_failed: number;
  latency_p50?: number | null;
  latency_p90?: number | null;
  latency_p95?: number | null;
  latency_p99?: number | null;
  throughput_rps?: number | null;
  error_rate?: number | null;
  created_at: string;
}

export interface Process {
  id: number;
  process_type: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  metadata: string; // JSON
  started_at: string;
  completed_at?: string | null;
  output_path?: string | null;
}

export interface ProcessWithMetadata extends Omit<Process, 'metadata'> {
  metadata: Record<string, any>;
}

export interface Activity {
  id: number;
  user: string;
  action: string;
  resource: string;
  status: 'success' | 'error' | 'running' | 'pending';
  metadata: string; // JSON
  created_at: string;
}

export interface ActivityWithMetadata extends Omit<Activity, 'metadata'> {
  metadata: Record<string, any>;
}

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface Failure {
  id: number;
  test_run_id?: number | null;
  test_result_id?: number | null;
  failure_type: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  title: string;
  description?: string | null;
  reproduction_steps?: string | null;
  status: 'Open' | 'In Progress' | 'Resolved';
  assigned_to?: string | null;
  resolution_notes?: string | null;
  resolved_at?: string | null;
  created_at: string;
}

export interface TestConfiguration {
  id: number;
  website_id: number;
  test_type: TestType;
  enabled: boolean;
  thresholds?: string | null; // JSON
  browsers?: string | null; // JSON
  viewports?: string | null; // JSON
  login_required: boolean;
  login_credentials?: string | null; // JSON
  expected_pixels?: string | null; // JSON
  created_at: string;
  updated_at: string;
}

// API Request/Response Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    username: string;
    role: string;
  };
}

export interface CreateWebsiteRequest {
  name: string;
  url: string;
  test_frequency?: 'Manual' | 'Daily' | 'Weekly';
}

export interface RunTestResponse {
  test_run_id: number;
  process_id: number;
  success: boolean;
  message?: string;
  duration_ms?: number;
  metrics?: any;
}

// Service Types
export interface ProcessMonitorStartParams {
  process_type: string;
  metadata?: Record<string, any>;
}

export interface ActivityLogParams {
  user?: string;
  action: string;
  resource: string;
  status: 'success' | 'error' | 'running' | 'pending';
  metadata?: Record<string, any>;
}

// WebSocket Event Types
export interface ProcessEvent {
  id: number;
  process_type: string;
  status: 'running' | 'completed' | 'failed';
  progress?: number;
  started_at: string;
  completed_at?: string | null;
  output_path?: string | null;
  metadata: Record<string, any>;
  timestamp: string;
}

export interface ActivityEvent {
  id: number;
  user: string;
  action: string;
  resource: string;
  status: string;
  metadata: Record<string, any>;
  created_at: string;
  timestamp: string;
}

export interface TestResultEvent extends TestRun {
  timestamp: string;
}

// JWT Payload
export interface JWTPayload {
  username: string;
  role: string;
  iat: number;
  exp?: number;
}

// Express Request Extension
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// Statistics Types
export interface DashboardStats {
  total_websites: number;
  total_tests: number;
  tests_today: number;
  success_rate: number;
  recent_tests: TestRun[];
  test_distribution: {
    test_type: string;
    count: number;
  }[];
}

export interface ProcessStats {
  running: number;
  completed: number;
  failed: number;
  total: number;
  by_type: {
    process_type: string;
    count: number;
  }[];
}

export interface ActivityStats {
  total: number;
  today: number;
  by_status: {
    status: string;
    count: number;
  }[];
  recent_actions: {
    action: string;
    count: number;
  }[];
}

export interface FailureStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  by_priority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

// Test API Response Types
export interface TestAPIHealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
  version: string;
}

export interface SmokeTestResponse {
  success: boolean;
  url: string;
  duration_ms: number;
  tests: {
    test_name: string;
    category: string;
    status: 'Pass' | 'Fail';
    duration_ms: number;
    error_message?: string;
    screenshot_url?: string;
  }[];
}

export interface PerformanceTestResponse {
  success: boolean;
  metrics: {
    lcp: number;
    fcp: number;
    ttfb: number;
    cls?: number;
    fid?: number;
    performance_score: number;
    accessibility_score: number;
    seo_score: number;
  };
  duration_ms: number;
  report_url?: string;
}

export interface LoadTestResponse {
  success: boolean;
  error?: string;
  message?: string;
  duration_ms: number;
  metrics?: {
    requests_total: number;
    requests_failed: number;
    latency_p50: number;
    latency_p90: number;
    latency_p95: number;
    latency_p99: number;
    throughput_rps: number;
    error_rate: number;
  };
}

export interface AccessibilityTestResponse {
  success: boolean;
  violations: {
    id: string;
    impact: 'critical' | 'serious' | 'moderate' | 'minor';
    description: string;
    help: string;
    helpUrl: string;
    tags: string[];
    nodes: any[];
  }[];
  summary: {
    total: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  duration_ms: number;
  url: string;
  timestamp: string;
}
