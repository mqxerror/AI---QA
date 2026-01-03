import { useState } from 'react';
import { Search, Filter, SortDesc, BookmarkCheck, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Filter Control Bar - Advanced filtering, search, sort, and saved views
 */
export function FilterControlBar({
  onSearchChange,
  onFilterChange,
  onSortChange,
  onSavedViewSelect,
  activeFilters = {},
  savedViews = []
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showViewsMenu, setShowViewsMenu] = useState(false);

  const quickFilters = [
    { id: 'failed_only', label: 'Failed Only', color: 'red' },
    { id: 'critical_only', label: 'Critical Only', color: 'orange' },
    { id: 'regressions', label: 'Regressions', color: 'purple' },
    { id: 'last_24h', label: 'Last 24h', color: 'blue' },
    { id: 'last_7d', label: 'Last 7 days', color: 'cyan' }
  ];

  const sortOptions = [
    { id: 'most_failures', label: 'Most Failures' },
    { id: 'most_recent', label: 'Most Recent' },
    { id: 'longest_duration', label: 'Longest Duration' },
    { id: 'alphabetical', label: 'Alphabetical' }
  ];

  const defaultSavedViews = [
    { id: 'daily_smoke', label: 'Daily Smoke Triage', icon: '🔥' },
    { id: 'accessibility_backlog', label: 'Accessibility Backlog', icon: '♿' },
    { id: 'release_candidate', label: 'Release Candidate', icon: '🚀' },
    { id: 'performance_issues', label: 'Performance Issues', icon: '⚡' }
  ];

  const views = savedViews.length > 0 ? savedViews : defaultSavedViews;

  const handleSearch = (value) => {
    setSearchTerm(value);
    onSearchChange?.(value);
  };

  const toggleFilter = (filterId) => {
    const newFilters = { ...activeFilters };
    newFilters[filterId] = !newFilters[filterId];
    onFilterChange?.(newFilters);
  };

  const handleSort = (sortId) => {
    onSortChange?.(sortId);
    setShowSortMenu(false);
  };

  const handleViewSelect = (viewId) => {
    onSavedViewSelect?.(viewId);
    setShowViewsMenu(false);
  };

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Main Control Row */}
        <div className="flex items-center gap-4 mb-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by site, run ID, URL..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                activeFilterCount > 0
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span className="font-medium">Filters</span>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showFilterMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border-2 border-gray-200 p-3 z-50"
                >
                  <div className="space-y-2">
                    {quickFilters.map((filter) => (
                      <label
                        key={filter.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={activeFilters[filter.id] || false}
                          onChange={() => toggleFilter(filter.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{filter.label}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sort Button */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white hover:border-gray-300 transition-all"
            >
              <SortDesc className="w-5 h-5" />
              <span className="font-medium">Sort</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showSortMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border-2 border-gray-200 p-2 z-50"
                >
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleSort(option.id)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Saved Views Button */}
          <div className="relative">
            <button
              onClick={() => setShowViewsMenu(!showViewsMenu)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-purple-200 bg-purple-50 hover:border-purple-300 transition-all"
            >
              <BookmarkCheck className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-700">Saved Views</span>
              <ChevronDown className={`w-4 h-4 text-purple-600 transition-transform ${showViewsMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showViewsMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border-2 border-gray-200 p-2 z-50"
                >
                  {views.map((view) => (
                    <button
                      key={view.id}
                      onClick={() => handleViewSelect(view.id)}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-purple-50 text-sm font-medium text-gray-700 transition-colors flex items-center gap-2"
                    >
                      <span className="text-lg">{view.icon}</span>
                      <span>{view.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500">Active Filters:</span>
            {Object.entries(activeFilters)
              .filter(([_, active]) => active)
              .map(([filterId]) => {
                const filter = quickFilters.find((f) => f.id === filterId);
                return (
                  <motion.button
                    key={filterId}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={() => toggleFilter(filterId)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-${filter?.color}-100 text-${filter?.color}-700 hover:bg-${filter?.color}-200 transition-colors`}
                  >
                    {filter?.label}
                    <X className="w-3 h-3" />
                  </motion.button>
                );
              })}
            <button
              onClick={() => onFilterChange?.({})}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FilterControlBar;
