# QA Testing Dashboard - Brand Identity Guide

**Version:** 1.0  
**Purpose:** BMAD Brand Reference for Visual Design System  
**Last Updated:** January 2026

---

## 1. BRAND OVERVIEW

### 1.1 Product Identity

**Name:** QA Testing Dashboard  
**Tagline:** "Automated Website Quality Assurance & Performance Monitoring"  
**Target Users:** Agencies, developers, DevOps teams, marketing managers  
**Positioning:** Professional, technical, reliable, enterprise-grade

### 1.2 Brand Personality

| Trait | Description |
|-------|-------------|
| **Professional** | Enterprise-ready, trusted by agencies |
| **Technical** | Precise, data-driven, detailed |
| **Reliable** | Always-on monitoring, consistent results |
| **Efficient** | Fast tests, clear insights |
| **Clean** | Organized, minimal, focused |

---

## 2. COLOR PALETTE

### 2.1 Primary Colors

```css
/* Dark Theme (Current) */
--bg-primary: #1a1a2e;        /* Deep navy background */
--bg-secondary: #16213e;       /* Card/sidebar background */
--bg-tertiary: #0f3460;        /* Accent panels */

/* Text Colors */
--text-primary: #ffffff;       /* White headings */
--text-secondary: #94a3b8;     /* Gray body text (slate-400) */
--text-muted: #64748b;         /* Muted labels (slate-500) */
```

### 2.2 Status Colors

```css
/* Test Results */
--status-success: #22c55e;     /* Green - Pass */
--status-error: #ef4444;       /* Red - Fail */
--status-warning: #f59e0b;     /* Amber - Warning */
--status-info: #3b82f6;        /* Blue - Info */
--status-running: #8b5cf6;     /* Purple - In Progress */
--status-idle: #6b7280;        /* Gray - Idle/Unknown */
```

### 2.3 Accent Colors

```css
/* Brand Accents */
--accent-primary: #3b82f6;     /* Blue - Primary actions */
--accent-secondary: #8b5cf6;   /* Purple - Secondary highlights */
--accent-cyan: #06b6d4;        /* Cyan - Charts/metrics */
--accent-green: #10b981;       /* Emerald - Positive metrics */
```

### 2.4 Gradients (Recommended for Premium Feel)

```css
/* Header/CTA Gradients */
--gradient-primary: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
--gradient-success: linear-gradient(135deg, #22c55e 0%, #10b981 100%);
--gradient-danger: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);

/* Background Gradients */
--gradient-dark: linear-gradient(180deg, #1a1a2e 0%, #0f172a 100%);
--gradient-card: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
```

---

## 3. TYPOGRAPHY

### 3.1 Font Family

```css
/* Primary Font Stack */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Monospace (for code/technical data) */
font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', monospace;
```

### 3.2 Type Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 (Page Title) | 2rem (32px) | 700 | 1.2 |
| H2 (Section) | 1.5rem (24px) | 600 | 1.3 |
| H3 (Card Title) | 1.25rem (20px) | 600 | 1.4 |
| H4 (Subsection) | 1.125rem (18px) | 500 | 1.4 |
| Body | 1rem (16px) | 400 | 1.5 |
| Small/Label | 0.875rem (14px) | 500 | 1.4 |
| Caption | 0.75rem (12px) | 400 | 1.5 |

### 3.3 Usage Guidelines

- **Headings:** Inter, Semi-bold to Bold
- **Body text:** Inter, Regular (400)
- **Metrics/Numbers:** Inter or Mono, Medium (500)
- **Code/JSON:** JetBrains Mono, Regular
- **Labels/Badges:** Inter, Medium, UPPERCASE for badges

---

## 4. ICONOGRAPHY

### 4.1 Test Type Icons

| Test Type | Emoji | Description |
|-----------|-------|-------------|
| Smoke Test | 💨 | Quick validation |
| Performance | ⚡ | Lighthouse metrics |
| Pixel Audit | 🔍 | Marketing pixels |
| Load Test | 📊 | Traffic simulation |
| Accessibility | ♿ or ⚙️ | WCAG compliance |
| Security Scan | 🔒 or ⚙️ | Security headers |
| Visual Regression | 👁️ or ⚙️ | Screenshot comparison |
| SEO Audit | 📈 or ⚙️ | Search optimization |

### 4.2 Status Icons

| Status | Icon | Color |
|--------|------|-------|
| Pass | ✅ / CheckCircle | Green |
| Fail | ❌ / XCircle | Red |
| Running | 🔄 / Loader | Purple (animated) |
| Idle | ⏸️ / Pause | Gray |
| Warning | ⚠️ / AlertTriangle | Amber |

### 4.3 Icon Library

**Recommended:** Lucide React (lucide-react)  
- Consistent stroke width (2px)
- 24x24px default size
- Clean, modern aesthetic

---

## 5. COMPONENT STYLES

### 5.1 Cards

```css
/* Base Card */
.card {
  background: rgba(22, 33, 62, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
}

/* Card Hover */
.card:hover {
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.1);
}
```

### 5.2 Buttons

```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
}

/* Secondary/Ghost Button */
.btn-secondary {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #94a3b8;
}

.btn-secondary:hover {
  border-color: #3b82f6;
  color: #ffffff;
}
```

### 5.3 Status Badges

```css
/* Pass Badge */
.badge-pass {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
}

/* Fail Badge */
.badge-fail {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

/* Running Badge */
.badge-running {
  background: rgba(139, 92, 246, 0.15);
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, 0.3);
}
```

### 5.4 Tables

```css
/* Table Container */
.table-container {
  background: rgba(22, 33, 62, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
}

/* Table Header */
.table-header {
  background: rgba(15, 52, 96, 0.5);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.05em;
  color: #64748b;
}

/* Table Row Hover */
.table-row:hover {
  background: rgba(59, 130, 246, 0.05);
}
```

---

## 6. LAYOUT PATTERNS

### 6.1 Dashboard Grid

```
┌─────────────────────────────────────────────────────┐
│ Header (Navbar)                                     │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ Sidebar  │  Main Content Area                       │
│ (Nav)    │                                          │
│          │  ┌─────────┬─────────┬─────────┐        │
│ 200-250px│  │ Stat    │ Stat    │ Stat    │        │
│          │  │ Card    │ Card    │ Card    │        │
│          │  └─────────┴─────────┴─────────┘        │
│          │                                          │
│          │  ┌───────────────────────────────┐      │
│          │  │ Data Table / Content          │      │
│          │  │                               │      │
│          │  └───────────────────────────────┘      │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

### 6.2 Spacing System

```css
/* Spacing Scale (Tailwind-based) */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
```

### 6.3 Responsive Breakpoints

```css
/* Mobile First */
--sm: 640px;   /* Mobile landscape */
--md: 768px;   /* Tablets */
--lg: 1024px;  /* Desktop */
--xl: 1280px;  /* Large desktop */
--2xl: 1536px; /* Extra large */
```

---

## 7. ANIMATION GUIDELINES

### 7.1 Micro-interactions

```css
/* Default Transition */
transition: all 0.2s ease;

/* Hover Lift */
.hover-lift:hover {
  transform: translateY(-2px);
}

/* Subtle Scale */
.hover-scale:hover {
  transform: scale(1.02);
}
```

### 7.2 Loading States

```css
/* Pulse Animation */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Spin Animation (for loaders) */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### 7.3 Page Transitions

- **Enter:** Fade in + subtle slide up (300ms)
- **Exit:** Fade out (200ms)
- **Stagger:** 50ms delay between list items

---

## 8. DATA VISUALIZATION

### 8.1 Chart Colors

```javascript
const chartColors = {
  primary: '#3b82f6',    // Blue
  secondary: '#8b5cf6',  // Purple
  success: '#22c55e',    // Green
  warning: '#f59e0b',    // Amber
  danger: '#ef4444',     // Red
  muted: '#64748b',      // Gray
};
```

### 8.2 Progress Bars

```css
/* Progress Container */
.progress-bg {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
  height: 8px;
}

/* Progress Fill (based on score) */
.progress-fill {
  background: linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #22c55e 100%);
  border-radius: 9999px;
  transition: width 0.5s ease;
}
```

---

## 9. BEST PRACTICES

### 9.1 Do's

✅ Use consistent spacing (multiples of 4px)  
✅ Maintain high contrast for accessibility  
✅ Use status colors consistently  
✅ Apply glassmorphism subtly  
✅ Keep tables scannable with clear hierarchy  
✅ Use monospace fonts for technical data  

### 9.2 Don'ts

❌ Don't use pure black (#000000)  
❌ Don't overuse gradients  
❌ Don't mix multiple icon styles  
❌ Don't use more than 3 font weights  
❌ Don't animate everything  
❌ Don't compromise readability for aesthetics  

---

**BRAND IDENTITY COMPLETE** ✓

This document serves as the visual reference for BMAD development.
