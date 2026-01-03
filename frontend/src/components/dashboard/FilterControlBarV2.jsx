import { useState } from 'react';
import { Search, Filter, SortDesc, BookmarkCheck, X, ChevronDown } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Popover, PopoverContent, PopoverSection, PopoverFooter, FilterChip } from '../ui/Popover';

/**
 * Filter Control Bar V2 - Structured filtering with Popover and chips
 *
 * Design Improvements:
 * - Structured filter panel with sections
 * - Visible filter chips below search
 * - Apply/Reset actions
 * - Presets for common workflows
 * - Clear visual hierarchy
 */
export function FilterControlBarV2({
  onSearchChange,
  onFilterChange,
  onSortChange,
  onSavedViewSelect,
  activeFilters = {},
  currentSort = 'most_recent',
  savedViews = []
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showSortPopover, setShowSortPopover] = useState(false);
  const [showViewsPopover, setShowViewsPopover] = useState(false);
  const [tempFilters, setTempFilters] = useState(activeFilters);

  // Filter definitions organized by category
  const filterSections = [
    {
      title: 'Status',
      filters: [
        { id: 'failed_only', label: 'Failed Only' },
        { id: 'passed_only', label: 'Passed Only' },
        { id: 'critical_only', label: 'Critical Only' },
        { id: 'regressions', label: 'Regressions' }
      ]
    },
    {
      title: 'Time Range',
      filters: [
        { id: 'last_24h', label: 'Last 24 hours' },
        { id: 'last_7d', label: 'Last 7 days' },
        { id: 'last_30d', label: 'Last 30 days' }
      ]
    },
    {
      title: 'Test Type',
      filters: [
        { id: 'smoke_only', label: 'Smoke Tests' },
        { id: 'performance_only', label: 'Performance' },
        { id: 'accessibility_only', label: 'Accessibility' },
        { id: 'security_only', label: 'Security' }
      ]
    }
  ];

  const sortOptions = [
    { id: 'most_failures', label: 'Most Failures', description: 'Show runs with most failures first' },
    { id: 'most_recent', label: 'Most Recent', description: 'Show newest runs first' },
    { id: 'longest_duration', label: 'Longest Duration', description: 'Show slowest runs first' },
    { id: 'alphabetical', label: 'Alphabetical', description: 'Sort by site name A-Z' }
  ];

  const defaultSavedViews = [
    { id: 'daily_smoke', label: 'Daily Smoke Triage', icon: '🔥', description: 'Last 24h smoke tests' },
    { id: 'accessibility_backlog', label: 'Accessibility Backlog', icon: '♿', description: 'Failed a11y tests' },
    { id: 'release_candidate', label: 'Release Candidate', icon: '🚀', description: 'Last 7d, most failures' },
    { id: 'performance_issues', label: 'Performance Issues', icon: '⚡', description: 'Failed performance tests' }
  ];

  const views = savedViews.length > 0 ? savedViews : defaultSavedViews;

  const handleSearch = (value) => {
    setSearchTerm(value);
    onSearchChange?.(value);
  };

  const handleTempFilterToggle = (filterId) => {
    setTempFilters({
      ...tempFilters,
      [filterId]: !tempFilters[filterId]
    });
  };

  const handleApplyFilters = () => {
    onFilterChange?.(tempFilters);
    setShowFilterPopover(false);
  };

  const handleResetFilters = () => {
    setTempFilters({});
    onFilterChange?.({});
    setShowFilterPopover(false);
  };

  const handleRemoveFilter = (filterId) => {
    const newFilters = { ...activeFilters };
    delete newFilters[filterId];
    onFilterChange?.(newFilters);
  };

  const handleSort = (sortId) => {
    onSortChange?.(sortId);
    setShowSortPopover(false);
  };

  const handleViewSelect = (viewId) => {
    onSavedViewSelect?.(viewId);
    setShowViewsPopover(false);
  };

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  // Get filter label by ID
  const getFilterLabel = (filterId) => {
    for (const section of filterSections) {
      const filter = section.filters.find(f => f.id === filterId);
      if (filter) return filter.label;
    }
    return filterId;
  };

  return (
    <div className="bg-white border-b-2 border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Main Control Row */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by site, run ID, URL..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Popover */}
          <Popover
            open={showFilterPopover}
            onOpenChange={setShowFilterPopover}
            align="end"
            trigger={
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                  activeFilterCount > 0
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full min-w-[18px] text-center">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown className={`w-3 h-3 transition-transform ${showFilterPopover ? 'rotate-180' : ''}`} />
              </button>
            }
          >
            <PopoverContent className="w-[400px]">
              {filterSections.map((section) => (
                <PopoverSection key={section.title} title={section.title}>
                  {section.filters.map((filter) => (
                    <label
                      key={filter.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={tempFilters[filter.id] || false}
                        onChange={() => handleTempFilterToggle(filter.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-700">{filter.label}</span>
                    </label>
                  ))}
                </PopoverSection>
              ))}

              <PopoverFooter>
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md transition-colors"
                >
                  Apply Filters
                </button>
              </PopoverFooter>
            </PopoverContent>
          </Popover>

          {/* Sort Popover */}
          <Popover
            open={showSortPopover}
            onOpenChange={setShowSortPopover}
            align="end"
            trigger={
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-200 bg-white hover:border-gray-300 text-sm font-semibold text-gray-700 transition-all">
                <SortDesc className="w-4 h-4" />
                <span>Sort</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showSortPopover ? 'rotate-180' : ''}`} />
              </button>
            }
          >
            <PopoverContent className="w-[280px] p-2">
              {sortOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSort(option.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    currentSort === option.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                  )}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Saved Views Popover */}
          <Popover
            open={showViewsPopover}
            onOpenChange={setShowViewsPopover}
            align="end"
            trigger={
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-purple-200 bg-purple-50 hover:border-purple-300 text-sm font-semibold text-purple-700 transition-all">
                <BookmarkCheck className="w-4 h-4" />
                <span>Saved Views</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showViewsPopover ? 'rotate-180' : ''}`} />
              </button>
            }
          >
            <PopoverContent className="w-[300px] p-2">
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => handleViewSelect(view.id)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-purple-50 text-sm font-medium text-gray-700 transition-colors flex items-start gap-3"
                >
                  <span className="text-lg">{view.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{view.label}</div>
                    {view.description && (
                      <div className="text-xs text-gray-500 mt-0.5">{view.description}</div>
                    )}
                  </div>
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        {/* Active Filters Chips */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active:</span>
            <AnimatePresence>
              {Object.entries(activeFilters)
                .filter(([_, active]) => active)
                .map(([filterId]) => (
                  <FilterChip
                    key={filterId}
                    label={getFilterLabel(filterId)}
                    onRemove={() => handleRemoveFilter(filterId)}
                  />
                ))}
            </AnimatePresence>
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline ml-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FilterControlBarV2;
