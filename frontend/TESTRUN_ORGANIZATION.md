# ✨ Test Runs - Organized by Website

## Overview

Completely reorganized the Test Runs page to group all tests by website, making it much easier to navigate and understand test results.

## What Changed

### Before ❌
- Flat table showing all test runs mixed together
- Hard to find tests for a specific website
- Overwhelming when many tests exist
- Poor scannability

### After ✅
- **Grouped by website** with collapsible sections
- Clear website headers with name and URL
- Summary badges showing total tests, passed, and failed counts
- Expandable sections to see detailed test runs
- Much better organization and navigation

## Features

### 1. **Website Grouping**
All test runs are now organized by website with:
- Website name as header
- Website URL as subtitle
- Collapsible sections (click to expand/collapse)
- Visual indicators (ChevronRight/ChevronDown icons)

### 2. **Summary Badges**
Each website header shows:
- **Total tests**: Number of test runs for that website
- **Passed tests**: Count of successful tests (green badge)
- **Failed tests**: Count of failed tests (red badge)

### 3. **Expandable Test Tables**
When expanded, each website section shows:
- Table of all test runs for that website
- Columns: Test Type, Status, Tests, Duration, Date
- Same expandable details for individual test runs
- All existing test result details preserved

### 4. **Visual Design**
- Gradient background on expanded headers
- BorderBeam animations on each card
- Smooth transitions when expanding/collapsing
- Color-coded icons (blue when expanded, gray when collapsed)

## Data Structure

**Grouping Logic:**
```javascript
// Group runs by website
const groupedByWebsite = filteredRuns?.reduce((acc, run) => {
  const key = run.website_name
  if (!acc[key]) {
    acc[key] = {
      website_name: run.website_name,
      website_url: run.website_url,
      runs: []
    }
  }
  acc[key].runs.push(run)
  return acc
}, {})

// Sort alphabetically
const websiteGroups = Object.values(groupedByWebsite || {}).sort((a, b) =>
  a.website_name.localeCompare(b.website_name)
)
```

## User Interface

### Website Header
```
┌─────────────────────────────────────────────────────────┐
│  [>] Google                                   [badges]  │
│      https://google.com                                 │
└─────────────────────────────────────────────────────────┘
```

**When Collapsed:**
- Right chevron icon (>)
- Gray icon color
- White background
- Shows summary badges only

**When Expanded:**
- Down chevron icon (v)
- Blue icon color
- Gradient background
- Shows full test table below

### Summary Badges
- **Info badge** (blue): "5 tests"
- **Success badge** (green): "4 passed"
- **Danger badge** (red): "1 failed"

## Benefits

### For Users
✅ **Quick Overview** - See all websites at a glance
✅ **Easy Navigation** - Find specific website's tests instantly
✅ **Better Context** - All tests for one website grouped together
✅ **Clear Status** - Pass/fail counts visible without expanding
✅ **Less Clutter** - Collapse websites you're not interested in

### For Developers
✅ **Maintainable** - Clean grouping logic
✅ **Scalable** - Works with any number of websites
✅ **Flexible** - Easy to add more grouping options
✅ **Performant** - Efficient filtering and rendering

## State Management

### New State
```javascript
const [expandedWebsites, setExpandedWebsites] = useState(new Set())
```

### Toggle Function
```javascript
const toggleWebsite = (websiteName) => {
  setExpandedWebsites(prev => {
    const next = new Set(prev)
    if (next.has(websiteName)) {
      next.delete(websiteName)
    } else {
      next.add(websiteName)
    }
    return next
  })
}
```

### Check Expansion
```javascript
const isExpanded = expandedWebsites.has(group.website_name)
```

## Interaction Flow

1. **Page Loads**
   - All websites displayed as collapsed cards
   - Summary badges show test counts
   - Alphabetically sorted by website name

2. **Click Website Header**
   - Section expands/collapses
   - Smooth transition animation
   - Icon changes (chevron rotates)
   - Background changes to gradient

3. **View Tests**
   - Table shows all tests for that website
   - Can still expand individual test runs for details
   - All existing functionality preserved

4. **Filter Tests**
   - Filter tabs still work
   - Groups update to show only filtered test types
   - Empty websites hidden automatically

## Technical Details

### Files Modified
- `src/pages/TestRuns.jsx` - Main component logic

### Key Changes
1. Added `expandedWebsites` state (Set)
2. Added `toggleWebsite` function
3. Added grouping logic (`groupedByWebsite`)
4. Restructured JSX to use grouped cards instead of single table
5. Updated table colspan from 7 to 6 (removed Website column)

### Removed
- "Website" column from table (now in card header)
- Single flat table structure

### Added
- Website grouping card headers
- Summary badge calculations
- Collapsible section logic
- Gradient backgrounds and animations

## Example

### Website with Multiple Tests
```
┌─────────────────────────────────────────────────────────┐
│  [v] Google                  [5 tests] [4 passed] [1 failed]  │
│      https://google.com                                 │
├─────────────────────────────────────────────────────────┤
│  Test Type       Status    Tests    Duration    Date    │
│  ───────────────────────────────────────────────────────│
│  > Smoke         Pass      5/5      2.34s       Today   │
│  > Performance   Pass      3/3      45.21s      Today   │
│  > Accessibility Fail      2/3      12.45s      Today   │
│  > Security      Pass      5/5      38.12s      Yesterday│
│  > SEO           Pass      4/4      21.34s      Yesterday│
└─────────────────────────────────────────────────────────┘
```

## Performance

- ✅ **Efficient Grouping** - Single pass through data
- ✅ **Lazy Loading** - Test tables only render when expanded
- ✅ **Smooth Animations** - CSS transitions, no jank
- ✅ **Maintained Polling** - Real-time updates still work

## Compatibility

- ✅ **All Filters** - Works with existing filter tabs
- ✅ **Empty States** - Handles no tests gracefully
- ✅ **Real-time Updates** - WebSocket updates still trigger
- ✅ **PDF Generation** - Download reports still functional

---

**Status**: ✅ Complete and Production Ready
**Build**: ✅ Successful
**User Experience**: 🔥 Dramatically Improved Organization!
