import { Bug, Zap, Eye, Users, CheckCircle, CheckCircle2, Shield, Search, Image, Code } from 'lucide-react';
import './Dashboard.css';

export default function Help() {
  const testTypes = [
    {
      name: 'Smoke Test',
      icon: Bug,
      color: '#10b981',
      description: 'Quick validation that essential features work',
      whatItDoes: [
        'Checks if the homepage loads successfully (HTTP 200)',
        'Scans for JavaScript console errors',
        'Verifies all images load properly',
        'Tests navigation links functionality'
      ],
      benefits: [
        'Fast execution (~3-5 seconds)',
        'Catches critical breaking issues immediately',
        'Perfect for quick validation after deployments',
        'Low resource usage'
      ],
      technology: 'Playwright (Chromium browser automation)'
    },
    {
      name: 'Performance Test',
      icon: Zap,
      color: '#f59e0b',
      description: 'Comprehensive performance and quality analysis',
      whatItDoes: [
        'Measures Core Web Vitals (LCP, CLS, FCP, TTFB, INP)',
        'Generates Lighthouse reports with scores',
        'Tests on different devices (desktop/mobile)',
        'Analyzes accessibility compliance',
        'Checks SEO best practices'
      ],
      benefits: [
        'Google ranking optimization data',
        'User experience metrics',
        'Identifies performance bottlenecks',
        'Accessibility compliance reporting',
        'Detailed improvement suggestions'
      ],
      technology: 'Google Lighthouse'
    },
    {
      name: 'Pixel Audit',
      icon: Eye,
      color: '#8b5cf6',
      description: 'Marketing and analytics tracking validation',
      whatItDoes: [
        'Detects analytics pixels (GA4, GTM, Meta, TikTok)',
        'Validates event firing (pageview, purchase, etc.)',
        'Captures network requests (HAR files)',
        'Identifies duplicate or misconfigured pixels',
        'Checks compliance with tracking standards'
      ],
      benefits: [
        'Ensures marketing campaigns track correctly',
        'Prevents revenue loss from broken tracking',
        'Validates conversion tracking',
        'Compliance verification (GDPR, CCPA)',
        'Attribution confidence'
      ],
      technology: 'Playwright + Network Analysis'
    },
    {
      name: 'Load Test',
      icon: Users,
      color: '#ef4444',
      description: 'Stress testing under simulated user traffic',
      whatItDoes: [
        'Simulates concurrent users (virtual users)',
        'Measures response times under load',
        'Tests P50, P90, P95, P99 latency percentiles',
        'Calculates requests per second (RPS)',
        'Identifies breaking points and bottlenecks'
      ],
      benefits: [
        'Prevents downtime during traffic spikes',
        'Capacity planning data',
        'Identifies scalability issues',
        'Validates infrastructure resilience',
        'SLA compliance verification'
      ],
      technology: 'k6 (Load Testing Framework)'
    },
    {
      name: 'Accessibility Test',
      icon: CheckCircle,
      color: '#06b6d4',
      description: 'WCAG 2.1 compliance and accessibility audit',
      whatItDoes: [
        'Scans for WCAG 2.1 AA/AAA violations',
        'Detects color contrast issues',
        'Validates ARIA attributes and roles',
        'Checks form labels and keyboard navigation',
        'Identifies missing alt text and semantic HTML issues'
      ],
      benefits: [
        'Legal compliance (ADA, Section 508)',
        'Improved user experience for all users',
        'SEO benefits (screen reader optimization)',
        'Wider audience reach (15% of population)',
        'Prevents accessibility lawsuits'
      ],
      technology: 'axe-core + Playwright (Industry-standard accessibility engine)'
    },
    {
      name: 'Security Test',
      icon: Shield,
      color: '#dc2626',
      description: 'Security vulnerabilities and SSL/TLS compliance check',
      whatItDoes: [
        'Scans for common security vulnerabilities (OWASP Top 10)',
        'Validates SSL/TLS certificate and configuration',
        'Checks HTTP security headers (CSP, HSTS, X-Frame-Options)',
        'Detects exposed sensitive data in client-side code',
        'Tests for clickjacking, XSS, and CSRF vulnerabilities'
      ],
      benefits: [
        'Prevents data breaches and security incidents',
        'Ensures SSL certificate validity',
        'Compliance with security standards (PCI DSS, SOC 2)',
        'Protects user data and privacy',
        'Early vulnerability detection'
      ],
      technology: 'Playwright + OWASP ZAP'
    },
    {
      name: 'SEO Test',
      icon: Search,
      color: '#eab308',
      description: 'Search engine optimization and metadata validation',
      whatItDoes: [
        'Validates meta tags (title, description, keywords)',
        'Checks structured data (JSON-LD, microdata)',
        'Analyzes heading hierarchy (H1, H2, H3)',
        'Verifies robots.txt and sitemap.xml',
        'Tests canonical URLs and hreflang tags',
        'Checks for duplicate content and broken links'
      ],
      benefits: [
        'Improved search engine rankings',
        'Better click-through rates (CTR)',
        'Enhanced social media previews',
        'Rich snippet eligibility',
        'Faster Google indexing'
      ],
      technology: 'Lighthouse SEO Audit'
    },
    {
      name: 'Visual Regression Test',
      icon: Image,
      color: '#ec4899',
      description: 'Visual comparison and screenshot diff testing',
      whatItDoes: [
        'Captures baseline and current screenshots',
        'Generates pixel-by-pixel difference images',
        'Calculates visual similarity scores',
        'Tests across multiple viewports (desktop, tablet, mobile)',
        'Identifies unintended visual changes'
      ],
      benefits: [
        'Prevents UI breaking changes',
        'Ensures design consistency across deployments',
        'Catches CSS regression bugs',
        'Validates responsive design',
        'Automated visual QA'
      ],
      technology: 'Playwright + Pixelmatch'
    }
  ];

  const services = [
    {
      name: 'Playwright',
      description: 'Browser Automation Framework',
      role: 'Executes smoke tests and pixel audits by controlling real browsers',
      capabilities: [
        'Controls Chromium, Firefox, and WebKit browsers',
        'Captures screenshots and videos',
        'Intercepts network requests',
        'Simulates user interactions (clicks, typing, navigation)',
        'Runs tests in headless mode for CI/CD'
      ],
      usedIn: ['Smoke Test', 'Pixel Audit']
    },
    {
      name: 'Lighthouse',
      description: 'Google\'s Performance Auditing Tool',
      role: 'Measures web performance, accessibility, SEO, and best practices',
      capabilities: [
        'Measures Core Web Vitals (LCP, FID, CLS)',
        'Generates performance scores (0-100)',
        'Audits accessibility (WCAG compliance)',
        'Checks SEO best practices',
        'Provides actionable improvement suggestions'
      ],
      usedIn: ['Performance Test']
    },
    {
      name: 'k6',
      description: 'Modern Load Testing Tool',
      role: 'Simulates thousands of concurrent users to test scalability',
      capabilities: [
        'Simulates realistic user traffic patterns',
        'Measures latency percentiles (P50, P90, P95, P99)',
        'Monitors error rates under load',
        'Calculates throughput (requests/second)',
        'Identifies performance degradation points'
      ],
      usedIn: ['Load Test']
    },
    {
      name: 'axe-core',
      description: 'Industry-Standard Accessibility Testing Engine',
      role: 'Detects WCAG 2.1 accessibility violations using 90+ automated rules',
      capabilities: [
        'Tests against WCAG 2.1 Level A, AA, and AAA',
        'Detects color contrast violations',
        'Validates ARIA attributes and semantic HTML',
        'Checks keyboard navigation and focus management',
        'Identifies missing alt text, labels, and landmarks',
        'Provides detailed violation reports with remediation guidance',
        'Zero false positives - only reports actual issues'
      ],
      usedIn: ['Accessibility Test']
    },
    {
      name: 'axe-playwright',
      description: 'Playwright Integration for axe-core',
      role: 'Bridges axe-core accessibility engine with Playwright browser automation',
      capabilities: [
        'Injects axe-core library into web pages',
        'Runs accessibility scans on live pages',
        'Captures violation context (DOM nodes, selectors)',
        'Provides detailed violation metadata',
        'Integrates seamlessly with Playwright test flows'
      ],
      usedIn: ['Accessibility Test']
    },
    {
      name: 'SQLite Database',
      description: 'Local Database Storage',
      role: 'Stores all test results, websites, and activity history',
      capabilities: [
        'Stores website configurations',
        'Records all test run results',
        'Tracks activity logs and process history',
        'Maintains performance metrics over time',
        'Enables historical trend analysis'
      ],
      usedIn: ['All Features']
    }
  ];

  return (
    <div className="new-dashboard">
      <div className="dashboard-header">
        <h1>Help & Documentation</h1>
        <p>Learn about test types, service architecture, and how to use the QA dashboard</p>
      </div>

      <section className="section">
        <h2>Available Test Types</h2>
        <p className="section-subtitle">
          Each test type serves a specific purpose in ensuring your website's quality and performance
        </p>

        <div className="test-types-grid">
          {testTypes.map((test, idx) => (
            <div key={idx} className="test-card">
              <div className="test-card-header">
                <div className="test-icon" style={{ background: `${test.color}20`, color: test.color }}>
                  <test.icon size={28} />
                </div>
                <div>
                  <h3>{test.name}</h3>
                  <p className="test-description">{test.description}</p>
                </div>
              </div>

              <div className="test-section">
                <h4>What It Does</h4>
                <ul>
                  {test.whatItDoes.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="test-section">
                <h4>Benefits</h4>
                <ul className="benefits-list">
                  {test.benefits.map((benefit, i) => (
                    <li key={i}>
                      <CheckCircle2 size={16} color={test.color} />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="test-tech">
                <strong>Technology:</strong> {test.technology}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Service Architecture</h2>
        <p className="section-subtitle">
          Understanding the role of each service in the testing pipeline
        </p>

        <div className="services-grid">
          {services.map((service, idx) => (
            <div key={idx} className="service-card">
              <div className="service-header">
                <h3>{service.name}</h3>
                <p className="service-description">{service.description}</p>
              </div>

              <div className="service-role">
                <strong>Role:</strong> {service.role}
              </div>

              <div className="service-capabilities">
                <h4>Capabilities</h4>
                <ul>
                  {service.capabilities.map((capability, i) => (
                    <li key={i}>{capability}</li>
                  ))}
                </ul>
              </div>

              <div className="service-usage">
                <strong>Used In:</strong> {service.usedIn.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section workflow-section">
        <h2>How It Works</h2>
        <div className="workflow">
          <div className="workflow-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Configure Website</h4>
              <p>Add your website URL and configure test settings</p>
            </div>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Run Tests</h4>
              <p>Execute smoke, performance, pixel, or load tests</p>
            </div>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Collect Results</h4>
              <p>Tests run on remote Test API with real browsers</p>
            </div>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Analyze & Report</h4>
              <p>View detailed results, metrics, and recommendations</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section quick-start">
        <h2>Quick Start Guide</h2>
        <div className="quick-start-grid">
          <div className="quick-start-card">
            <div className="quick-start-number">1</div>
            <h4>Add a Website</h4>
            <p>Go to the Websites page and click "Add Website". Enter your site's name and URL.</p>
          </div>
          <div className="quick-start-card">
            <div className="quick-start-number">2</div>
            <h4>Run Your First Test</h4>
            <p>Click the "Smoke" button for a quick health check, or "Perf" for detailed performance analysis.</p>
          </div>
          <div className="quick-start-card">
            <div className="quick-start-number">3</div>
            <h4>Monitor Progress</h4>
            <p>Check the "Processes" page to see real-time test execution with progress indicators.</p>
          </div>
          <div className="quick-start-card">
            <div className="quick-start-number">4</div>
            <h4>Review Results</h4>
            <p>View test results on the "Test Runs" page with detailed metrics and recommendations.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>API Endpoints & Integration</h2>
        <p className="section-subtitle">
          Access test results programmatically via our REST API
        </p>

        <div className="api-docs">
          <div className="api-section">
            <h3>
              <Code size={20} style={{ display: 'inline', marginRight: '8px', color: '#3b82f6' }} />
              Base URL
            </h3>
            <div className="code-block">
              <code>http://localhost:3004/api</code>
            </div>
          </div>

          <div className="api-section">
            <h3>Test Execution Endpoints</h3>

            <div className="api-endpoint">
              <div className="endpoint-header">
                <span className="http-method post">POST</span>
                <code>/test-runs</code>
              </div>
              <p className="endpoint-desc">Start a new test run</p>
              <div className="code-block">
{`{
  "websiteId": 1,
  "testType": "smoke",
  "triggeredBy": "user@example.com"
}`}
              </div>
              <p className="endpoint-note">
                <strong>Test Types:</strong> <code>smoke</code>, <code>performance</code>, <code>load</code>,
                <code>accessibility</code>, <code>security</code>, <code>seo</code>, <code>visual</code>, <code>pixel</code>
              </p>
            </div>

            <div className="api-endpoint">
              <div className="endpoint-header">
                <span className="http-method get">GET</span>
                <code>/test-runs</code>
              </div>
              <p className="endpoint-desc">Get all test runs (with optional filters)</p>
              <div className="code-block">
{`// Query parameters
?website=1&type=smoke&status=pass&limit=10`}
              </div>
            </div>

            <div className="api-endpoint">
              <div className="endpoint-header">
                <span className="http-method get">GET</span>
                <code>/test-runs/:id</code>
              </div>
              <p className="endpoint-desc">Get detailed results for a specific test run</p>
              <div className="code-block">
{`// Response includes:
{
  "id": 123,
  "website_name": "Example Site",
  "test_type": "smoke",
  "status": "pass",
  "duration_seconds": 5.2,
  "passed_count": 4,
  "total_count": 4,
  "results": [...],  // Detailed test results
  "lighthouse_score": {...},  // For performance tests
  "violations": [...],  // For accessibility tests
  "comparisons": [...],  // For visual tests
  "created_at": "2025-01-03T03:21:00Z"
}`}
              </div>
            </div>
          </div>

          <div className="api-section">
            <h3>Website Management</h3>

            <div className="api-endpoint">
              <div className="endpoint-header">
                <span className="http-method get">GET</span>
                <code>/websites</code>
              </div>
              <p className="endpoint-desc">List all configured websites</p>
            </div>

            <div className="api-endpoint">
              <div className="endpoint-header">
                <span className="http-method post">POST</span>
                <code>/websites</code>
              </div>
              <p className="endpoint-desc">Add a new website</p>
              <div className="code-block">
{`{
  "name": "My Website",
  "url": "https://example.com"
}`}
              </div>
            </div>

            <div className="api-endpoint">
              <div className="endpoint-header">
                <span className="http-method delete">DELETE</span>
                <code>/websites/:id</code>
              </div>
              <p className="endpoint-desc">Remove a website</p>
            </div>
          </div>

          <div className="api-section">
            <h3>Reports & Artifacts</h3>

            <div className="api-endpoint">
              <div className="endpoint-header">
                <span className="http-method get">GET</span>
                <code>/reports/:filename</code>
              </div>
              <p className="endpoint-desc">Access generated reports (HTML, PDF)</p>
              <p className="endpoint-note">
                Reports are stored in MinIO and accessible via direct URLs returned in test results
              </p>
            </div>

            <div className="api-endpoint">
              <div className="endpoint-header">
                <span className="http-method get">GET</span>
                <code>/screenshots/:filename</code>
              </div>
              <p className="endpoint-desc">View test screenshots</p>
              <p className="endpoint-note">
                Screenshots are captured during test execution and stored in MinIO
              </p>
            </div>
          </div>

          <div className="api-section">
            <h3>Real-Time Updates (WebSocket)</h3>

            <div className="api-endpoint">
              <div className="endpoint-header">
                <span className="http-method ws">WS</span>
                <code>ws://localhost:3004</code>
              </div>
              <p className="endpoint-desc">Subscribe to real-time test run updates</p>
              <div className="code-block">
{`// Connect to WebSocket
const socket = io('http://localhost:3004');

// Listen for test completion
socket.on('test-completed', (data) => {
  console.log('Test finished:', data.testRunId);
});

// Listen for test failures
socket.on('test-failed', (data) => {
  console.log('Test failed:', data.error);
});`}
              </div>
            </div>
          </div>

          <div className="api-section">
            <h3>Example: Fetching Test Results</h3>

            <div className="code-block">
{`// JavaScript/Node.js example
const axios = require('axios');

async function getTestResults(testRunId) {
  try {
    const response = await axios.get(
      \`http://localhost:3004/api/test-runs/\${testRunId}\`
    );

    const testData = response.data;
    console.log(\`Status: \${testData.status}\`);
    console.log(\`Duration: \${testData.duration_seconds}s\`);
    console.log(\`Tests Passed: \${testData.passed_count}/\${testData.total_count}\`);

    // For performance tests
    if (testData.lighthouse_score) {
      console.log(\`Performance Score: \${testData.lighthouse_score.performance}\`);
    }

    // For visual regression tests
    if (testData.comparisons) {
      console.log(\`Visual Comparisons: \${testData.comparisons.length}\`);
      console.log(\`Baseline: \${testData.baseline_url}\`);
      console.log(\`Current: \${testData.current_url}\`);
      console.log(\`Diff: \${testData.diff_url}\`);
    }

    return testData;
  } catch (error) {
    console.error('Error fetching test results:', error);
  }
}

// Usage
getTestResults(123);`}
            </div>
          </div>

          <div className="api-section">
            <h3>Authentication</h3>
            <div className="code-block">
{`// Include credentials in requests
fetch('http://localhost:3004/api/test-runs', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Login endpoint
POST /api/auth/login
{
  "username": "admin",
  "password": "your-password"
}

// Verify authentication
GET /api/auth/verify`}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
