"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var playwright_1 = require("playwright");
var pngjs_1 = require("pngjs");
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var pixelmatch_1 = __importDefault(require("pixelmatch"));
var VisualRegression = /** @class */ (function () {
    function VisualRegression() {
    }
    /**
     * Run visual regression test on a URL
     */
    VisualRegression.runTest = function (url_1, websiteId_1) {
        return __awaiter(this, arguments, void 0, function (url, websiteId, createBaseline) {
            var startTime, issues, comparisons, browser, _i, _a, viewport, context, page, sanitizedUrl, timestamp, screenshotFilename, baselineFilename, diffFilename, screenshotPath, baselinePath, diffPath, baselineExists, comparison, comparisonResult, passed, severity, summary, isBaselineRun, overall_score, error_1;
            if (createBaseline === void 0) { createBaseline = false; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        startTime = Date.now();
                        issues = [];
                        comparisons = [];
                        // Ensure directories exist
                        this.ensureDirectories();
                        browser = null;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 16, , 19]);
                        return [4 /*yield*/, playwright_1.chromium.launch({ headless: true })];
                    case 2:
                        browser = _b.sent();
                        _i = 0, _a = this.viewports;
                        _b.label = 3;
                    case 3:
                        if (!(_i < _a.length)) return [3 /*break*/, 14];
                        viewport = _a[_i];
                        return [4 /*yield*/, browser.newContext({
                                viewport: { width: viewport.width, height: viewport.height },
                                deviceScaleFactor: 1
                            })];
                    case 4:
                        context = _b.sent();
                        return [4 /*yield*/, context.newPage()];
                    case 5:
                        page = _b.sent();
                        // Navigate to page
                        return [4 /*yield*/, page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })];
                    case 6:
                        // Navigate to page
                        _b.sent();
                        // Wait a bit for any animations to settle
                        return [4 /*yield*/, page.waitForTimeout(1000)];
                    case 7:
                        // Wait a bit for any animations to settle
                        _b.sent();
                        sanitizedUrl = this.sanitizeFilename(url);
                        timestamp = Date.now();
                        screenshotFilename = "".concat(websiteId, "-").concat(sanitizedUrl, "-").concat(viewport.name, "-").concat(timestamp, ".png");
                        baselineFilename = "".concat(websiteId, "-").concat(sanitizedUrl, "-").concat(viewport.name, "-baseline.png");
                        diffFilename = "".concat(websiteId, "-").concat(sanitizedUrl, "-").concat(viewport.name, "-diff-").concat(timestamp, ".png");
                        screenshotPath = path_1.default.join(this.screenshotsDir, screenshotFilename);
                        baselinePath = path_1.default.join(this.baselineDir, baselineFilename);
                        diffPath = path_1.default.join(this.diffDir, diffFilename);
                        // Take screenshot
                        return [4 /*yield*/, page.screenshot({
                                path: screenshotPath,
                                fullPage: true
                            })];
                    case 8:
                        // Take screenshot
                        _b.sent();
                        return [4 /*yield*/, context.close()];
                    case 9:
                        _b.sent();
                        baselineExists = fs_1.default.existsSync(baselinePath);
                        comparison = void 0;
                        if (!(createBaseline || !baselineExists)) return [3 /*break*/, 10];
                        // Create baseline
                        if (fs_1.default.existsSync(screenshotPath)) {
                            fs_1.default.copyFileSync(screenshotPath, baselinePath);
                        }
                        comparison = {
                            viewport: viewport.name,
                            width: viewport.width,
                            height: viewport.height,
                            baseline_exists: false,
                            screenshot_path: screenshotFilename,
                            baseline_path: baselineFilename,
                            difference_percentage: 0,
                            pixels_changed: 0,
                            total_pixels: 0,
                            is_baseline_run: true,
                            passed: true
                        };
                        return [3 /*break*/, 12];
                    case 10: return [4 /*yield*/, this.compareScreenshots(baselinePath, screenshotPath, diffPath)];
                    case 11:
                        comparisonResult = _b.sent();
                        passed = comparisonResult.difference_percentage < 1.0;
                        comparison = {
                            viewport: viewport.name,
                            width: viewport.width,
                            height: viewport.height,
                            baseline_exists: true,
                            screenshot_path: screenshotFilename,
                            baseline_path: baselineFilename,
                            diff_path: diffFilename,
                            difference_percentage: comparisonResult.difference_percentage,
                            pixels_changed: comparisonResult.pixels_changed,
                            total_pixels: comparisonResult.total_pixels,
                            is_baseline_run: false,
                            passed: passed
                        };
                        // Add issues if differences found
                        if (!passed) {
                            severity = comparisonResult.difference_percentage > 5 ? 'critical' :
                                comparisonResult.difference_percentage > 2 ? 'warning' : 'info';
                            issues.push({
                                severity: severity,
                                viewport: viewport.name,
                                difference_percentage: comparisonResult.difference_percentage,
                                pixels_changed: comparisonResult.pixels_changed,
                                description: "".concat(comparisonResult.difference_percentage.toFixed(2), "% visual difference detected in ").concat(viewport.name, " viewport")
                            });
                        }
                        _b.label = 12;
                    case 12:
                        comparisons.push(comparison);
                        _b.label = 13;
                    case 13:
                        _i++;
                        return [3 /*break*/, 3];
                    case 14: return [4 /*yield*/, browser.close()];
                    case 15:
                        _b.sent();
                        summary = {
                            total_viewports: comparisons.length,
                            passed: comparisons.filter(function (c) { return c.passed; }).length,
                            failed: comparisons.filter(function (c) { return !c.passed; }).length,
                            baseline_created: comparisons.filter(function (c) { return c.is_baseline_run; }).length
                        };
                        isBaselineRun = summary.baseline_created > 0;
                        overall_score = this.calculateVisualScore(comparisons);
                        return [2 /*return*/, {
                                success: summary.failed === 0,
                                url: url,
                                duration_ms: Date.now() - startTime,
                                timestamp: new Date().toISOString(),
                                overall_score: overall_score,
                                is_baseline_run: isBaselineRun,
                                comparisons: comparisons,
                                issues: issues,
                                summary: summary
                            }];
                    case 16:
                        error_1 = _b.sent();
                        if (!browser) return [3 /*break*/, 18];
                        return [4 /*yield*/, browser.close()];
                    case 17:
                        _b.sent();
                        _b.label = 18;
                    case 18: throw new Error("Visual regression test failed: ".concat(error_1.message));
                    case 19: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Compare two screenshots and return difference metrics
     */
    VisualRegression.compareScreenshots = function (baselinePath, currentPath, diffPath) {
        return __awaiter(this, void 0, void 0, function () {
            var baseline, current, width, height, diff, pixelsDifferent, totalPixels, differencePercentage;
            return __generator(this, function (_a) {
                try {
                    baseline = pngjs_1.PNG.sync.read(fs_1.default.readFileSync(baselinePath));
                    current = pngjs_1.PNG.sync.read(fs_1.default.readFileSync(currentPath));
                    width = baseline.width, height = baseline.height;
                    diff = new pngjs_1.PNG({ width: width, height: height });
                    // Ensure images are same size
                    if (baseline.width !== current.width || baseline.height !== current.height) {
                        throw new Error('Image dimensions do not match');
                    }
                    pixelsDifferent = (0, pixelmatch_1.default)(baseline.data, current.data, diff.data, width, height, { threshold: 0.1 });
                    totalPixels = width * height;
                    differencePercentage = (pixelsDifferent / totalPixels) * 100;
                    // Save diff image
                    fs_1.default.writeFileSync(diffPath, pngjs_1.PNG.sync.write(diff));
                    return [2 /*return*/, {
                            difference_percentage: differencePercentage,
                            pixels_changed: pixelsDifferent,
                            total_pixels: totalPixels
                        }];
                }
                catch (error) {
                    throw new Error("Screenshot comparison failed: ".concat(error.message));
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Calculate overall visual regression score (0-100)
     * 100 = no changes, 0 = massive changes
     */
    VisualRegression.calculateVisualScore = function (comparisons) {
        if (comparisons.length === 0)
            return 100;
        // If all are baseline runs, return 100
        if (comparisons.every(function (c) { return c.is_baseline_run; }))
            return 100;
        // Calculate average difference percentage
        var nonBaselineComparisons = comparisons.filter(function (c) { return !c.is_baseline_run; });
        if (nonBaselineComparisons.length === 0)
            return 100;
        var avgDifference = nonBaselineComparisons.reduce(function (sum, c) { return sum + c.difference_percentage; }, 0) / nonBaselineComparisons.length;
        // Convert to score (higher difference = lower score)
        // 0% diff = 100 score
        // 10% diff = 0 score
        var score = Math.max(0, 100 - (avgDifference * 10));
        return Math.round(score);
    };
    /**
     * Sanitize URL for filename
     */
    VisualRegression.sanitizeFilename = function (url) {
        return url
            .replace(/^https?:\/\//, '')
            .replace(/[^a-z0-9]/gi, '-')
            .toLowerCase()
            .substring(0, 50);
    };
    /**
     * Ensure required directories exist
     */
    VisualRegression.ensureDirectories = function () {
        [this.screenshotsDir, this.baselineDir, this.diffDir].forEach(function (dir) {
            if (!fs_1.default.existsSync(dir)) {
                fs_1.default.mkdirSync(dir, { recursive: true });
            }
        });
    };
    /**
     * Delete baseline for a website (to recreate)
     */
    VisualRegression.deleteBaseline = function (websiteId, url) {
        return __awaiter(this, void 0, void 0, function () {
            var sanitizedUrl, _i, _a, viewport, baselineFilename, baselinePath;
            return __generator(this, function (_b) {
                try {
                    sanitizedUrl = this.sanitizeFilename(url);
                    for (_i = 0, _a = this.viewports; _i < _a.length; _i++) {
                        viewport = _a[_i];
                        baselineFilename = "".concat(websiteId, "-").concat(sanitizedUrl, "-").concat(viewport.name, "-baseline.png");
                        baselinePath = path_1.default.join(this.baselineDir, baselineFilename);
                        if (fs_1.default.existsSync(baselinePath)) {
                            fs_1.default.unlinkSync(baselinePath);
                        }
                    }
                    return [2 /*return*/, true];
                }
                catch (error) {
                    console.error('Failed to delete baseline:', error);
                    return [2 /*return*/, false];
                }
                return [2 /*return*/];
            });
        });
    };
    VisualRegression.screenshotsDir = path_1.default.join(process.cwd(), 'screenshots');
    VisualRegression.baselineDir = path_1.default.join(process.cwd(), 'screenshots', 'baseline');
    VisualRegression.diffDir = path_1.default.join(process.cwd(), 'screenshots', 'diff');
    // Standard viewports to test
    VisualRegression.viewports = [
        { name: 'desktop', width: 1920, height: 1080 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'mobile', width: 375, height: 667 }
    ];
    return VisualRegression;
}());
exports.default = VisualRegression;
