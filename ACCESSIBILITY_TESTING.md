# Accessibility Testing Documentation

## Overview

The QA Dashboard uses **axe-core** and **axe-playwright** to provide industry-standard accessibility testing that ensures websites comply with WCAG 2.1 guidelines.

---

## Core Technologies

### 1. axe-core

**What is it?**
- Industry-leading open-source accessibility testing engine
- Developed and maintained by Deque Systems
- Used by Google, Microsoft, and thousands of organizations worldwide
- Powers accessibility testing in Chrome DevTools, Firefox DevTools, and more

**Key Features:**
- **90+ automated rules** covering WCAG 2.1 Level A, AA, and AAA
- **Zero false positives** - only reports actual violations
- **Detailed reporting** with impact levels (critical, serious, moderate, minor)
- **Actionable guidance** with links to remediation documentation
- **Fast execution** - typically completes in 3-5 seconds

**What It Tests:**
- ✅ Color contrast violations (WCAG 1.4.3, 1.4.6, 1.4.11)
- ✅ Missing or improper ARIA attributes
- ✅ Keyboard navigation and focus management
- ✅ Form labels and accessible names
- ✅ Semantic HTML structure
- ✅ Image alt text
- ✅ Heading hierarchy
- ✅ Landmark regions
- ✅ Link text quality
- ✅ Table accessibility

**WCAG Coverage:**
- **Level A:** 30 success criteria
- **Level AA:** 20 additional criteria (total 50)
- **Level AAA:** 28 additional criteria (total 78)

**NPM Package:**
```bash
npm install axe-core
```

**Official Links:**
- Website: https://www.deque.com/axe/
- GitHub: https://github.com/dequelabs/axe-core
- Documentation: https://www.deque.com/axe/core-documentation/
- Rule Descriptions: https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md

---

### 2. axe-playwright

**What is it?**
- Official Playwright integration for axe-core
- Simplifies running accessibility scans on web pages
- Provides seamless integration with Playwright's browser automation

**Key Features:**
- **Easy injection** - automatically injects axe-core into pages
- **Comprehensive scanning** - analyzes entire page or specific elements
- **Detailed violations** - captures DOM context and selectors
- **Async/await support** - works with modern JavaScript patterns
- **TypeScript support** - fully typed for better developer experience

**How It Works:**
```javascript
const { injectAxe, getViolations } = require('axe-playwright');

// 1. Navigate to page with Playwright
await page.goto('https://example.com');

// 2. Inject axe-core library
await injectAxe(page);

// 3. Run accessibility scan
const violations = await getViolations(page);

// 4. Analyze results
violations.forEach(violation => {
  console.log('ID:', violation.id);
  console.log('Impact:', violation.impact);
  console.log('Description:', violation.description);
  console.log('Help URL:', violation.helpUrl);
  console.log('Affected nodes:', violation.nodes.length);
});
```

**NPM Package:**
```bash
npm install axe-playwright
```

**Official Links:**
- GitHub: https://github.com/abhinaba-ghosh/axe-playwright
- NPM: https://www.npmjs.com/package/axe-playwright

---

## Implementation in QA Dashboard

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Clicks "A11y"                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend: server.js (Endpoint)                  │
│  POST /api/run-test/accessibility/:websiteId               │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│       AccessibilityService.runTest(url)                     │
│                                                             │
│  1. Launch Playwright Chromium browser                      │
│  2. Navigate to website URL                                 │
│  3. Inject axe-core library                                 │
│  4. Run getViolations(page)                                 │
│  5. Format and return results                               │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Store Results in SQLite                        │
│                                                             │
│  - test_runs table (summary)                                │
│  - accessibility_results table (violations)                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│            Display Results in TestRuns.jsx                  │
│                                                             │
│  - Violation table with impact badges                       │
│  - WCAG tags and affected nodes                             │
│  - Help links to remediation docs                           │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
backend/
├── services/
│   └── AccessibilityService.js      # Core accessibility testing logic
├── server.js                        # API endpoint
└── database.js                      # accessibility_results table

frontend/
├── src/
│   ├── pages/
│   │   ├── Websites.jsx            # A11y button
│   │   ├── TestRuns.jsx            # Results display
│   │   └── NewDashboard.jsx        # Documentation
│   └── services/
│       └── api.js                  # runAccessibilityTest()
```

### Database Schema

```sql
CREATE TABLE accessibility_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_run_id INTEGER NOT NULL,
  violation_id TEXT NOT NULL,           -- e.g., "color-contrast"
  impact TEXT NOT NULL,                 -- critical/serious/moderate/minor
  description TEXT,                     -- Human-readable description
  help TEXT,                            -- Remediation guidance
  help_url TEXT,                        -- Link to documentation
  nodes_affected INTEGER,               -- Number of DOM elements
  wcag_tags TEXT,                       -- JSON array of WCAG criteria
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_run_id) REFERENCES test_runs(id)
);
```

---

## Usage Guide

### Running a Test

1. **Via UI:**
   - Go to Websites page
   - Click the cyan **"A11y"** button
   - Wait 5-10 seconds
   - View results in Test Runs page

2. **Via API:**
   ```bash
   curl -X POST http://localhost:3004/api/run-test/accessibility/1 \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Understanding Results

**Impact Levels:**
- **Critical** 🔴 - Severe accessibility barriers (e.g., missing form labels)
- **Serious** 🟠 - Major issues affecting usability (e.g., poor color contrast)
- **Moderate** 🔵 - Medium-priority issues (e.g., suboptimal ARIA usage)
- **Minor** 🟡 - Low-priority enhancements (e.g., missing landmarks)

**Common Violations:**

1. **color-contrast** (Serious)
   - Issue: Text doesn't have sufficient contrast with background
   - WCAG: 1.4.3 (AA), 1.4.6 (AAA)
   - Fix: Increase contrast ratio to at least 4.5:1 (normal text) or 3:1 (large text)

2. **label** (Critical)
   - Issue: Form inputs missing associated labels
   - WCAG: 1.3.1, 4.1.2
   - Fix: Add `<label for="input-id">` or `aria-label` attribute

3. **image-alt** (Critical)
   - Issue: Images missing alt text
   - WCAG: 1.1.1
   - Fix: Add descriptive `alt="..."` attribute

4. **heading-order** (Moderate)
   - Issue: Heading levels skip (h1 → h3)
   - WCAG: 1.3.1
   - Fix: Use sequential heading levels

5. **aria-roles** (Serious)
   - Issue: Invalid or misused ARIA roles
   - WCAG: 4.1.2
   - Fix: Use valid ARIA roles or remove if redundant

---

## Testing Best Practices

### 1. Test Early and Often
- Run accessibility tests during development, not just before release
- Integrate into CI/CD pipeline for automated checks

### 2. Manual Testing Required
- axe-core detects ~57% of WCAG issues automatically
- Manual testing needed for:
  - Keyboard navigation flows
  - Screen reader compatibility
  - Focus order and management
  - Content readability

### 3. Prioritize Fixes by Impact
- **Critical** → Fix immediately (blocks users)
- **Serious** → Fix in current sprint
- **Moderate** → Schedule for next release
- **Minor** → Backlog for future improvements

### 4. Test Real User Flows
- Don't just test homepage
- Test forms, checkouts, navigation menus
- Test dynamic content (modals, accordions, tabs)

### 5. Monitor Trends
- Track violation counts over time
- Set goals (e.g., "Zero critical violations")
- Prevent regressions with automated tests

---

## Why Accessibility Matters

### Legal Compliance
- **ADA (Americans with Disabilities Act)** - US federal law
- **Section 508** - US government accessibility requirements
- **AODA** - Accessibility for Ontarians with Disabilities Act
- **EN 301 549** - European accessibility standard

**Lawsuit Risk:**
- Over 4,000 ADA lawsuits filed in 2023
- Average settlement: $20,000 - $100,000
- Prevent legal risk with proactive testing

### Business Benefits
- **15% of population** has disabilities (1+ billion people worldwide)
- **SEO improvement** - accessible sites rank better
- **Better UX for everyone** - curb-cut effect
- **Mobile optimization** - many accessibility fixes improve mobile UX
- **Brand reputation** - demonstrates social responsibility

### Technical Benefits
- **Better code quality** - semantic HTML, clear structure
- **Easier maintenance** - well-structured markup
- **Future-proof** - works with assistive technologies
- **Performance** - often improves page speed

---

## Accessibility Statistics

- **90%** of websites have detectable WCAG failures
- **98.1%** of homepages have at least one accessibility issue
- **57%** of issues can be detected automatically (rest needs manual testing)
- **1 in 4** adults in the US has a disability
- **285 million** people worldwide are visually impaired

**Most Common Issues:**
1. Low color contrast (86.4%)
2. Missing alt text (58.2%)
3. Missing form labels (50.8%)
4. Empty links (44.4%)
5. Missing page language (33.1%)

---

## Resources

### Official Documentation
- **axe-core Rules:** https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md
- **WCAG 2.1 Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **WebAIM:** https://webaim.org/ (Excellent tutorials and articles)
- **A11y Project:** https://www.a11yproject.com/ (Community-driven resources)

### Testing Tools
- **axe DevTools:** https://www.deque.com/axe/devtools/ (Browser extension)
- **WAVE:** https://wave.webaim.org/ (Web accessibility evaluation tool)
- **Lighthouse:** https://developers.google.com/web/tools/lighthouse (Chrome DevTools)
- **NVDA:** https://www.nvaccess.org/ (Free screen reader for testing)

### Learning Resources
- **WebAIM Screen Reader Survey:** https://webaim.org/projects/screenreadersurvey9/
- **Inclusive Components:** https://inclusive-components.design/
- **A11y Coffee:** https://a11y.coffee/ (Quick accessibility tips)

---

## Version History

- **v1.0.0** (2025-12-28) - Initial implementation with axe-core + axe-playwright
  - Added `AccessibilityService.js` with Playwright integration
  - Created database schema for storing violations
  - Built frontend UI for displaying results
  - Integrated with process monitoring and activity logging

---

## Support

For questions or issues with accessibility testing:
1. Check axe-core documentation: https://www.deque.com/axe/core-documentation/
2. Review WCAG guidelines: https://www.w3.org/WAI/WCAG21/quickref/
3. Test with browser DevTools (F12 → Accessibility tab)
4. Consult WebAIM for guidance: https://webaim.org/

**Remember:** Automated testing catches ~57% of issues. Manual testing with screen readers and keyboard navigation is essential for comprehensive accessibility validation.
