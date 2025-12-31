"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const playwright_1 = require("playwright");
const ssl_checker_1 = __importDefault(require("ssl-checker"));
const axios_1 = __importDefault(require("axios"));
class SecurityScanner {
    /**
     * Run comprehensive security scan on a URL
     */
    static async runScan(url) {
        const startTime = Date.now();
        const violations = [];
        try {
            // 1. Check SSL/TLS Certificate
            const sslInfo = await this.checkSSL(url);
            if (sslInfo.violations) {
                violations.push(...sslInfo.violations);
            }
            // 2. Check Security Headers
            const headersInfo = await this.checkSecurityHeaders(url);
            violations.push(...headersInfo.violations);
            // 3. Check for Mixed Content
            const mixedContentViolations = await this.checkMixedContent(url);
            violations.push(...mixedContentViolations);
            // 4. Check for Common Vulnerabilities
            const commonVulns = await this.checkCommonVulnerabilities(url);
            violations.push(...commonVulns);
            // Calculate summary
            const summary = {
                critical: violations.filter(v => v.severity === 'critical').length,
                high: violations.filter(v => v.severity === 'high').length,
                medium: violations.filter(v => v.severity === 'medium').length,
                low: violations.filter(v => v.severity === 'low').length,
                total: violations.length
            };
            // Calculate overall security score (0-100)
            const overall_score = this.calculateSecurityScore(summary);
            return {
                success: summary.critical === 0,
                url,
                duration_ms: Date.now() - startTime,
                timestamp: new Date().toISOString(),
                overall_score,
                violations,
                ssl_info: sslInfo.info,
                security_headers: headersInfo.headers,
                summary
            };
        }
        catch (error) {
            throw new Error(`Security scan failed: ${error.message}`);
        }
    }
    /**
     * Check SSL/TLS certificate
     */
    static async checkSSL(url) {
        const violations = [];
        try {
            const hostname = new URL(url).hostname;
            const sslInfo = await (0, ssl_checker_1.default)(hostname);
            // Check if certificate is valid
            if (!sslInfo.valid) {
                violations.push({
                    severity: 'critical',
                    category: 'SSL/TLS',
                    issue: 'Invalid SSL Certificate',
                    description: 'The SSL certificate is not valid or has expired',
                    recommendation: 'Renew your SSL certificate immediately to ensure secure connections'
                });
            }
            // Check if certificate expires soon (< 30 days)
            if (sslInfo.daysRemaining < 30) {
                violations.push({
                    severity: sslInfo.daysRemaining < 7 ? 'critical' : 'medium',
                    category: 'SSL/TLS',
                    issue: 'SSL Certificate Expiring Soon',
                    description: `SSL certificate expires in ${sslInfo.daysRemaining} days`,
                    recommendation: 'Renew your SSL certificate to prevent service interruptions'
                });
            }
            return {
                info: {
                    valid: sslInfo.valid,
                    days_remaining: sslInfo.daysRemaining,
                    issuer: sslInfo.issuer,
                    valid_from: sslInfo.validFrom,
                    valid_to: sslInfo.validTo
                },
                violations
            };
        }
        catch (error) {
            // If URL doesn't use HTTPS
            if (url.startsWith('http://')) {
                violations.push({
                    severity: 'critical',
                    category: 'SSL/TLS',
                    issue: 'No HTTPS',
                    description: 'Website is not using HTTPS encryption',
                    recommendation: 'Install an SSL certificate and redirect all HTTP traffic to HTTPS'
                });
            }
            return { violations };
        }
    }
    /**
     * Check security headers
     */
    static async checkSecurityHeaders(url) {
        const violations = [];
        const securityHeaders = {};
        try {
            const response = await axios_1.default.get(url, {
                maxRedirects: 5,
                timeout: 10000,
                validateStatus: () => true
            });
            const headers = response.headers;
            // Check Content-Security-Policy
            const csp = headers['content-security-policy'];
            securityHeaders['Content-Security-Policy'] = {
                present: !!csp,
                value: csp,
                secure: !!csp
            };
            if (!csp) {
                violations.push({
                    severity: 'high',
                    category: 'Security Headers',
                    issue: 'Missing Content-Security-Policy',
                    description: 'No CSP header found - vulnerable to XSS attacks',
                    recommendation: 'Implement a Content-Security-Policy header to prevent XSS attacks'
                });
            }
            // Check Strict-Transport-Security (HSTS)
            const hsts = headers['strict-transport-security'];
            securityHeaders['Strict-Transport-Security'] = {
                present: !!hsts,
                value: hsts,
                secure: !!hsts
            };
            if (!hsts && url.startsWith('https://')) {
                violations.push({
                    severity: 'medium',
                    category: 'Security Headers',
                    issue: 'Missing HSTS Header',
                    description: 'No Strict-Transport-Security header - vulnerable to downgrade attacks',
                    recommendation: 'Add HSTS header: Strict-Transport-Security: max-age=31536000; includeSubDomains'
                });
            }
            // Check X-Frame-Options
            const xFrameOptions = headers['x-frame-options'];
            securityHeaders['X-Frame-Options'] = {
                present: !!xFrameOptions,
                value: xFrameOptions,
                secure: !!xFrameOptions
            };
            if (!xFrameOptions) {
                violations.push({
                    severity: 'medium',
                    category: 'Security Headers',
                    issue: 'Missing X-Frame-Options',
                    description: 'No X-Frame-Options header - vulnerable to clickjacking',
                    recommendation: 'Add X-Frame-Options: DENY or SAMEORIGIN header'
                });
            }
            // Check X-Content-Type-Options
            const xContentType = headers['x-content-type-options'];
            securityHeaders['X-Content-Type-Options'] = {
                present: !!xContentType,
                value: xContentType,
                secure: xContentType === 'nosniff'
            };
            if (xContentType !== 'nosniff') {
                violations.push({
                    severity: 'low',
                    category: 'Security Headers',
                    issue: 'Missing X-Content-Type-Options',
                    description: 'No X-Content-Type-Options: nosniff header',
                    recommendation: 'Add X-Content-Type-Options: nosniff header'
                });
            }
            // Check X-XSS-Protection
            const xssProtection = headers['x-xss-protection'];
            securityHeaders['X-XSS-Protection'] = {
                present: !!xssProtection,
                value: xssProtection,
                secure: xssProtection === '1; mode=block'
            };
            if (!xssProtection) {
                violations.push({
                    severity: 'low',
                    category: 'Security Headers',
                    issue: 'Missing X-XSS-Protection',
                    description: 'No X-XSS-Protection header',
                    recommendation: 'Add X-XSS-Protection: 1; mode=block header'
                });
            }
            // Check Referrer-Policy
            const referrerPolicy = headers['referrer-policy'];
            securityHeaders['Referrer-Policy'] = {
                present: !!referrerPolicy,
                value: referrerPolicy,
                secure: !!referrerPolicy
            };
            if (!referrerPolicy) {
                violations.push({
                    severity: 'low',
                    category: 'Security Headers',
                    issue: 'Missing Referrer-Policy',
                    description: 'No Referrer-Policy header',
                    recommendation: 'Add Referrer-Policy: strict-origin-when-cross-origin header'
                });
            }
            // Check Permissions-Policy
            const permissionsPolicy = headers['permissions-policy'] || headers['feature-policy'];
            securityHeaders['Permissions-Policy'] = {
                present: !!permissionsPolicy,
                value: permissionsPolicy,
                secure: !!permissionsPolicy
            };
            return { headers: securityHeaders, violations };
        }
        catch (error) {
            throw new Error(`Failed to check security headers: ${error.message}`);
        }
    }
    /**
     * Check for mixed content (HTTPS page loading HTTP resources)
     */
    static async checkMixedContent(url) {
        const violations = [];
        if (!url.startsWith('https://')) {
            return violations; // Only check HTTPS sites
        }
        let browser = null;
        try {
            browser = await playwright_1.chromium.launch({ headless: true });
            const context = await browser.newContext();
            const page = await context.newPage();
            const mixedContentResources = [];
            // Listen for console warnings about mixed content
            page.on('console', msg => {
                if (msg.text().toLowerCase().includes('mixed content')) {
                    mixedContentResources.push(msg.text());
                }
            });
            // Listen for failed requests (HTTP on HTTPS)
            page.on('requestfailed', request => {
                const requestUrl = request.url();
                if (requestUrl.startsWith('http://')) {
                    mixedContentResources.push(requestUrl);
                }
            });
            await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
            if (mixedContentResources.length > 0) {
                violations.push({
                    severity: 'high',
                    category: 'Mixed Content',
                    issue: 'HTTP Resources on HTTPS Page',
                    description: `Found ${mixedContentResources.length} HTTP resources loaded on HTTPS page`,
                    recommendation: 'Update all resource URLs to use HTTPS to prevent security warnings'
                });
            }
            await browser.close();
        }
        catch (error) {
            if (browser)
                await browser.close();
            console.error('Mixed content check failed:', error.message);
        }
        return violations;
    }
    /**
     * Check for common vulnerabilities
     */
    static async checkCommonVulnerabilities(url) {
        const violations = [];
        try {
            const response = await axios_1.default.get(url, {
                maxRedirects: 0,
                timeout: 10000,
                validateStatus: () => true
            });
            // Check if server version is exposed
            const serverHeader = response.headers['server'];
            if (serverHeader && /\d+\.\d+/.test(serverHeader)) {
                violations.push({
                    severity: 'low',
                    category: 'Information Disclosure',
                    issue: 'Server Version Exposed',
                    description: `Server header exposes version: ${serverHeader}`,
                    recommendation: 'Remove version information from Server header to prevent targeted attacks'
                });
            }
            // Check for X-Powered-By header (information disclosure)
            const xPoweredBy = response.headers['x-powered-by'];
            if (xPoweredBy) {
                violations.push({
                    severity: 'low',
                    category: 'Information Disclosure',
                    issue: 'Technology Stack Exposed',
                    description: `X-Powered-By header reveals: ${xPoweredBy}`,
                    recommendation: 'Remove X-Powered-By header to hide technology stack'
                });
            }
            // Check for cookies without Secure flag on HTTPS
            const setCookie = response.headers['set-cookie'];
            if (url.startsWith('https://') && setCookie) {
                const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
                const insecureCookies = cookies.filter(c => !c.toLowerCase().includes('secure'));
                if (insecureCookies.length > 0) {
                    violations.push({
                        severity: 'medium',
                        category: 'Cookies',
                        issue: 'Cookies Without Secure Flag',
                        description: `${insecureCookies.length} cookies missing Secure flag on HTTPS site`,
                        recommendation: 'Add Secure flag to all cookies on HTTPS sites'
                    });
                }
                const noHttpOnlyCookies = cookies.filter(c => !c.toLowerCase().includes('httponly'));
                if (noHttpOnlyCookies.length > 0) {
                    violations.push({
                        severity: 'medium',
                        category: 'Cookies',
                        issue: 'Cookies Without HttpOnly Flag',
                        description: `${noHttpOnlyCookies.length} cookies missing HttpOnly flag`,
                        recommendation: 'Add HttpOnly flag to prevent XSS cookie theft'
                    });
                }
            }
        }
        catch (error) {
            // Ignore errors for this check
        }
        return violations;
    }
    /**
     * Calculate overall security score (0-100)
     */
    static calculateSecurityScore(summary) {
        let score = 100;
        // Deduct points based on severity
        score -= summary.critical * 25; // Critical: -25 points each
        score -= summary.high * 15; // High: -15 points each
        score -= summary.medium * 8; // Medium: -8 points each
        score -= summary.low * 3; // Low: -3 points each
        return Math.max(0, score); // Minimum score is 0
    }
}
exports.default = SecurityScanner;
//# sourceMappingURL=SecurityScanner.js.map