"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class ReportGenerator {
    static reportsDir = path_1.default.join(process.cwd(), 'reports');
    /**
     * Generate comprehensive PDF report for a test run
     */
    static async generateReport(options) {
        const { testRun } = options;
        // Ensure reports directory exists
        this.ensureReportsDirectory();
        // Generate unique filename
        const timestamp = new Date().getTime();
        const filename = `report-${testRun.run_id}-${timestamp}.pdf`;
        const filepath = path_1.default.join(this.reportsDir, filename);
        return new Promise((resolve, reject) => {
            try {
                // Create PDF document
                const doc = new pdfkit_1.default({
                    size: 'A4',
                    margins: { top: 50, bottom: 50, left: 50, right: 50 }
                });
                // Pipe to file
                const stream = fs_1.default.createWriteStream(filepath);
                doc.pipe(stream);
                // Generate report content
                this.addHeader(doc, testRun);
                this.addTestSummary(doc, testRun);
                // Add test-specific sections
                switch (testRun.test_type) {
                    case 'Smoke':
                        this.addSmokeTestResults(doc, options.testResults || []);
                        break;
                    case 'Performance':
                        this.addPerformanceResults(doc, options.metrics);
                        break;
                    case 'Pixel Audit':
                        this.addPixelAuditResults(doc, options.pixelResults || []);
                        break;
                    case 'Load Test':
                        this.addLoadTestResults(doc, options.loadResults);
                        break;
                    case 'Accessibility':
                        this.addAccessibilityResults(doc, options.accessibilityResults || []);
                        break;
                    case 'Security Scan':
                        this.addSecurityScanResults(doc, options.securityResults);
                        break;
                    case 'SEO Audit':
                        this.addSEOAuditResults(doc, options.seoResults);
                        break;
                    case 'Visual Regression':
                        this.addVisualRegressionResults(doc, options.visualResults);
                        break;
                }
                this.addFooter(doc);
                // Finalize PDF
                doc.end();
                stream.on('finish', () => {
                    resolve(filename);
                });
                stream.on('error', (error) => {
                    reject(error);
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Add report header
     */
    static addHeader(doc, testRun) {
        // Title
        doc.fontSize(24)
            .fillColor('#1f2937')
            .text('QA Test Report', { align: 'center' });
        doc.moveDown(0.5);
        // Test type badge
        doc.fontSize(14)
            .fillColor('#6b7280')
            .text(testRun.test_type, { align: 'center' });
        doc.moveDown(1);
        // Website info
        doc.fontSize(12)
            .fillColor('#374151')
            .text(`Website: ${testRun.website_name}`, { continued: false });
        doc.fontSize(10)
            .fillColor('#6b7280')
            .text(`URL: ${testRun.website_url}`);
        doc.moveDown(0.5);
        // Test date
        doc.fontSize(10)
            .fillColor('#6b7280')
            .text(`Test Date: ${new Date(testRun.created_at).toLocaleString()}`);
        doc.moveDown(1);
        // Divider line
        doc.moveTo(50, doc.y)
            .lineTo(545, doc.y)
            .stroke('#e5e7eb');
        doc.moveDown(1);
    }
    /**
     * Add test summary section
     */
    static addTestSummary(doc, testRun) {
        doc.fontSize(16)
            .fillColor('#1f2937')
            .text('Test Summary', { underline: true });
        doc.moveDown(0.5);
        // Status
        const statusColor = testRun.status === 'Pass' ? '#10b981' : '#ef4444';
        doc.fontSize(12)
            .fillColor('#374151')
            .text('Status: ', { continued: true })
            .fillColor(statusColor)
            .text(testRun.status);
        // Results
        doc.fillColor('#374151')
            .text(`Total Tests: ${testRun.total_tests}`);
        doc.fillColor('#10b981')
            .text(`Passed: ${testRun.passed}`);
        doc.fillColor('#ef4444')
            .text(`Failed: ${testRun.failed}`);
        // Duration
        doc.fillColor('#374151')
            .text(`Duration: ${(testRun.duration_ms / 1000).toFixed(2)}s`);
        doc.moveDown(1);
    }
    /**
     * Add smoke test results
     */
    static addSmokeTestResults(doc, results) {
        doc.fontSize(16)
            .fillColor('#1f2937')
            .text('Test Results', { underline: true });
        doc.moveDown(0.5);
        results.forEach((result, index) => {
            if (index > 0 && index % 15 === 0) {
                doc.addPage();
            }
            const statusColor = result.status === 'Pass' ? '#10b981' : '#ef4444';
            doc.fontSize(11)
                .fillColor('#374151')
                .text(`${index + 1}. ${result.test_name}`, { continued: true })
                .fillColor(statusColor)
                .text(` [${result.status}]`);
            if (result.error_message) {
                doc.fontSize(9)
                    .fillColor('#6b7280')
                    .text(`   Error: ${result.error_message}`);
            }
            doc.moveDown(0.3);
        });
        doc.moveDown(0.5);
    }
    /**
     * Add performance test results
     */
    static addPerformanceResults(doc, metrics) {
        if (!metrics)
            return;
        doc.fontSize(16)
            .fillColor('#1f2937')
            .text('Performance Metrics', { underline: true });
        doc.moveDown(0.5);
        const metricsData = [
            { label: 'LCP (Largest Contentful Paint)', value: `${metrics.lcp?.toFixed(0)}ms` },
            { label: 'FCP (First Contentful Paint)', value: `${metrics.fcp?.toFixed(0)}ms` },
            { label: 'TTFB (Time to First Byte)', value: `${metrics.ttfb?.toFixed(0)}ms` },
            { label: 'CLS (Cumulative Layout Shift)', value: metrics.cls?.toFixed(3) },
            { label: 'Performance Score', value: `${metrics.performance_score}/100` },
            { label: 'Accessibility Score', value: `${metrics.accessibility_score}/100` },
            { label: 'SEO Score', value: `${metrics.seo_score}/100` },
            { label: 'Best Practices Score', value: `${metrics.best_practices_score}/100` }
        ];
        metricsData.forEach(metric => {
            if (metric.value && metric.value !== 'undefined') {
                doc.fontSize(11)
                    .fillColor('#374151')
                    .text(`${metric.label}: `, { continued: true })
                    .fillColor('#6b7280')
                    .text(metric.value);
            }
        });
        doc.moveDown(1);
    }
    /**
     * Add pixel audit results
     */
    static addPixelAuditResults(doc, results) {
        doc.fontSize(16)
            .fillColor('#1f2937')
            .text('Pixel Audit Results', { underline: true });
        doc.moveDown(0.5);
        results.forEach(result => {
            const statusColor = result.found ? '#10b981' : '#ef4444';
            doc.fontSize(12)
                .fillColor('#374151')
                .text(`${result.pixel_vendor}`, { continued: true })
                .fillColor(statusColor)
                .text(` [${result.found ? 'Found' : 'Not Found'}]`);
            if (result.pixel_id) {
                doc.fontSize(10)
                    .fillColor('#6b7280')
                    .text(`  ID: ${result.pixel_id}`);
            }
            if (result.events_detected) {
                doc.fontSize(10)
                    .fillColor('#6b7280')
                    .text(`  Events: ${result.events_detected}`);
            }
            doc.moveDown(0.5);
        });
        doc.moveDown(0.5);
    }
    /**
     * Add load test results
     */
    static addLoadTestResults(doc, results) {
        if (!results)
            return;
        doc.fontSize(16)
            .fillColor('#1f2937')
            .text('Load Test Results', { underline: true });
        doc.moveDown(0.5);
        const loadData = [
            { label: 'Virtual Users', value: results.virtual_users },
            { label: 'Duration', value: `${results.duration_seconds}s` },
            { label: 'Total Requests', value: results.requests_total?.toLocaleString() },
            { label: 'Failed Requests', value: results.requests_failed },
            { label: 'Error Rate', value: `${(results.error_rate * 100).toFixed(2)}%` },
            { label: 'Throughput', value: `${results.throughput_rps?.toFixed(2)} req/s` },
            { label: 'P50 Latency', value: `${results.latency_p50?.toFixed(0)}ms` },
            { label: 'P90 Latency', value: `${results.latency_p90?.toFixed(0)}ms` },
            { label: 'P95 Latency', value: `${results.latency_p95?.toFixed(0)}ms` },
            { label: 'P99 Latency', value: `${results.latency_p99?.toFixed(0)}ms` }
        ];
        loadData.forEach(item => {
            if (item.value !== undefined && item.value !== null) {
                doc.fontSize(11)
                    .fillColor('#374151')
                    .text(`${item.label}: `, { continued: true })
                    .fillColor('#6b7280')
                    .text(String(item.value));
            }
        });
        doc.moveDown(1);
    }
    /**
     * Add accessibility results
     */
    static addAccessibilityResults(doc, results) {
        doc.fontSize(16)
            .fillColor('#1f2937')
            .text('Accessibility Violations', { underline: true });
        doc.moveDown(0.5);
        if (results.length === 0) {
            doc.fontSize(11)
                .fillColor('#10b981')
                .text('No accessibility violations found!');
        }
        else {
            results.slice(0, 20).forEach((violation, index) => {
                if (index > 0 && index % 8 === 0) {
                    doc.addPage();
                }
                const impactColor = violation.impact === 'critical' ? '#dc2626' :
                    violation.impact === 'serious' ? '#f59e0b' : '#6b7280';
                doc.fontSize(11)
                    .fillColor('#374151')
                    .text(`${index + 1}. ${violation.violation_id}`, { continued: true })
                    .fillColor(impactColor)
                    .text(` [${violation.impact}]`);
                doc.fontSize(9)
                    .fillColor('#6b7280')
                    .text(`   ${violation.description}`);
                doc.fontSize(9)
                    .fillColor('#6b7280')
                    .text(`   Nodes affected: ${violation.nodes_affected}`);
                doc.moveDown(0.5);
            });
            if (results.length > 20) {
                doc.fontSize(9)
                    .fillColor('#6b7280')
                    .text(`... and ${results.length - 20} more violations`);
            }
        }
        doc.moveDown(1);
    }
    /**
     * Add security scan results
     */
    static addSecurityScanResults(doc, results) {
        if (!results)
            return;
        doc.fontSize(16)
            .fillColor('#1f2937')
            .text('Security Scan Results', { underline: true });
        doc.moveDown(0.5);
        // Overall score
        const scoreColor = results.overall_score >= 80 ? '#10b981' :
            results.overall_score >= 60 ? '#f59e0b' : '#ef4444';
        doc.fontSize(12)
            .fillColor('#374151')
            .text('Security Score: ', { continued: true })
            .fillColor(scoreColor)
            .text(`${results.overall_score}/100`);
        doc.moveDown(0.5);
        // SSL info
        if (results.ssl_valid !== null) {
            doc.fontSize(11)
                .fillColor('#374151')
                .text('SSL Certificate: ', { continued: true })
                .fillColor(results.ssl_valid ? '#10b981' : '#ef4444')
                .text(results.ssl_valid ? 'Valid' : 'Invalid');
            if (results.ssl_days_remaining) {
                doc.fillColor('#6b7280')
                    .text(`  Expires in ${results.ssl_days_remaining} days`);
            }
        }
        doc.moveDown(0.5);
        // Violations
        if (results.violations) {
            const violations = JSON.parse(results.violations);
            doc.fontSize(12)
                .fillColor('#374151')
                .text(`Security Issues Found: ${violations.length}`);
            doc.moveDown(0.3);
            violations.slice(0, 15).forEach((violation, index) => {
                if (index > 0 && index % 6 === 0) {
                    doc.addPage();
                }
                const severityColor = violation.severity === 'critical' ? '#dc2626' :
                    violation.severity === 'high' ? '#f59e0b' : '#6b7280';
                doc.fontSize(10)
                    .fillColor(severityColor)
                    .text(`[${violation.severity.toUpperCase()}] ${violation.issue}`);
                doc.fontSize(9)
                    .fillColor('#6b7280')
                    .text(`   ${violation.description}`);
                doc.fontSize(9)
                    .fillColor('#374151')
                    .text(`   Recommendation: ${violation.recommendation}`);
                doc.moveDown(0.4);
            });
        }
        doc.moveDown(0.5);
    }
    /**
     * Add SEO audit results
     */
    static addSEOAuditResults(doc, results) {
        if (!results)
            return;
        doc.fontSize(16)
            .fillColor('#1f2937')
            .text('SEO Audit Results', { underline: true });
        doc.moveDown(0.5);
        // Overall score
        const scoreColor = results.overall_score >= 80 ? '#10b981' :
            results.overall_score >= 60 ? '#f59e0b' : '#ef4444';
        doc.fontSize(12)
            .fillColor('#374151')
            .text('SEO Score: ', { continued: true })
            .fillColor(scoreColor)
            .text(`${results.overall_score}/100`);
        doc.moveDown(0.5);
        // Meta tags
        if (results.meta_tags) {
            const metaTags = JSON.parse(results.meta_tags);
            doc.fontSize(11)
                .fillColor('#374151')
                .text('Meta Information:');
            doc.fontSize(10)
                .fillColor('#6b7280')
                .text(`  Title: ${metaTags.has_title ? `✓ (${metaTags.title_length} chars)` : '✗ Missing'}`);
            doc.text(`  Description: ${metaTags.has_description ? `✓ (${metaTags.description_length} chars)` : '✗ Missing'}`);
        }
        doc.moveDown(0.5);
        // Issues
        if (results.issues) {
            const issues = JSON.parse(results.issues);
            doc.fontSize(11)
                .fillColor('#374151')
                .text(`SEO Issues Found: ${issues.length}`);
            doc.moveDown(0.3);
            issues.slice(0, 15).forEach((issue, index) => {
                if (index > 0 && index % 6 === 0) {
                    doc.addPage();
                }
                const severityColor = issue.severity === 'critical' ? '#dc2626' :
                    issue.severity === 'warning' ? '#f59e0b' : '#6b7280';
                doc.fontSize(10)
                    .fillColor(severityColor)
                    .text(`[${issue.severity.toUpperCase()}] ${issue.issue}`);
                doc.fontSize(9)
                    .fillColor('#6b7280')
                    .text(`   ${issue.description}`);
                doc.fontSize(9)
                    .fillColor('#374151')
                    .text(`   Recommendation: ${issue.recommendation}`);
                doc.moveDown(0.4);
            });
        }
        doc.moveDown(0.5);
    }
    /**
     * Add visual regression results
     */
    static addVisualRegressionResults(doc, results) {
        if (!results)
            return;
        doc.fontSize(16)
            .fillColor('#1f2937')
            .text('Visual Regression Results', { underline: true });
        doc.moveDown(0.5);
        // Overall score
        const scoreColor = results.overall_score >= 95 ? '#10b981' :
            results.overall_score >= 85 ? '#f59e0b' : '#ef4444';
        doc.fontSize(12)
            .fillColor('#374151')
            .text('Visual Similarity: ', { continued: true })
            .fillColor(scoreColor)
            .text(`${results.overall_score}/100`);
        doc.moveDown(0.5);
        // Baseline info
        if (results.is_baseline_run) {
            doc.fontSize(11)
                .fillColor('#f59e0b')
                .text('⚠ Baseline Run - Reference images created');
            doc.moveDown(0.5);
        }
        // Comparisons with screenshots
        if (results.comparisons) {
            const comparisons = JSON.parse(results.comparisons);
            const screenshotsDir = path_1.default.join(process.cwd(), 'screenshots');
            const baselineDir = path_1.default.join(screenshotsDir, 'baseline');
            const diffDir = path_1.default.join(screenshotsDir, 'diff');
            comparisons.forEach((comp, index) => {
                // Add new page for each viewport (except first)
                if (index > 0) {
                    doc.addPage();
                }
                const statusColor = comp.passed ? '#10b981' : '#ef4444';
                doc.fontSize(14)
                    .fillColor('#1f2937')
                    .text(`${comp.viewport.toUpperCase()} (${comp.width}×${comp.height})`);
                doc.fontSize(10)
                    .fillColor('#374151')
                    .text('Status: ', { continued: true })
                    .fillColor(statusColor)
                    .text(comp.is_baseline_run ? 'Baseline Created' : (comp.passed ? 'Passed ✓' : 'Failed ✗'));
                if (!comp.is_baseline_run && comp.difference_percentage) {
                    doc.fontSize(9)
                        .fillColor('#6b7280')
                        .text(`Difference: ${comp.difference_percentage.toFixed(2)}% (${comp.pixels_changed.toLocaleString()} pixels changed)`);
                }
                doc.moveDown(0.5);
                // Add screenshots
                const imageWidth = 200; // Width in PDF points
                const imageX = 50;
                let currentY = doc.y;
                try {
                    // Current screenshot
                    const screenshotPath = path_1.default.join(screenshotsDir, comp.screenshot_path);
                    if (fs_1.default.existsSync(screenshotPath)) {
                        doc.fontSize(10)
                            .fillColor('#374151')
                            .text('Current Screenshot:', imageX, currentY);
                        currentY += 20;
                        doc.image(screenshotPath, imageX, currentY, {
                            width: imageWidth,
                            fit: [imageWidth, 250]
                        });
                        currentY += 260;
                    }
                    // Baseline screenshot (if exists)
                    if (comp.baseline_path) {
                        const baselinePath = path_1.default.join(baselineDir, comp.baseline_path);
                        if (fs_1.default.existsSync(baselinePath)) {
                            // Check if we need a new page
                            if (currentY > 600) {
                                doc.addPage();
                                currentY = 50;
                            }
                            doc.fontSize(10)
                                .fillColor('#374151')
                                .text('Baseline Screenshot:', imageX, currentY);
                            currentY += 20;
                            doc.image(baselinePath, imageX, currentY, {
                                width: imageWidth,
                                fit: [imageWidth, 250]
                            });
                            currentY += 260;
                        }
                    }
                    // Diff screenshot (if exists and not baseline run)
                    if (!comp.is_baseline_run && comp.diff_path) {
                        const diffPath = path_1.default.join(diffDir, comp.diff_path);
                        if (fs_1.default.existsSync(diffPath)) {
                            // Check if we need a new page
                            if (currentY > 600) {
                                doc.addPage();
                                currentY = 50;
                            }
                            doc.fontSize(10)
                                .fillColor('#ef4444')
                                .text('Difference Visualization:', imageX, currentY);
                            currentY += 20;
                            doc.image(diffPath, imageX, currentY, {
                                width: imageWidth,
                                fit: [imageWidth, 250]
                            });
                        }
                    }
                }
                catch (error) {
                    doc.fontSize(9)
                        .fillColor('#ef4444')
                        .text(`Error loading screenshots: ${error.message}`);
                }
            });
        }
        doc.moveDown(0.5);
    }
    /**
     * Add footer
     * Note: Disabled due to issues with dynamic page creation
     */
    static addFooter(_doc) {
        // Footer functionality disabled to prevent pagination errors
        // when using dynamic page creation with image embedding
        return;
    }
    /**
     * Ensure reports directory exists
     */
    static ensureReportsDirectory() {
        if (!fs_1.default.existsSync(this.reportsDir)) {
            fs_1.default.mkdirSync(this.reportsDir, { recursive: true });
        }
    }
    /**
     * Get report path
     */
    static getReportPath(filename) {
        return path_1.default.join(this.reportsDir, filename);
    }
}
exports.default = ReportGenerator;
//# sourceMappingURL=ReportGenerator.js.map