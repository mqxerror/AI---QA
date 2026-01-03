import { useState } from 'react';
import { ChevronDown, ChevronRight, Eye, RotateCw, GitCompare, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { StatusBadge, SeverityBadge } from './Badge';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * DataTable Component - Dense, scannable table for test runs
 *
 * Design Principles:
 * - Information density first
 * - Clear visual hierarchy (primary/secondary/tertiary)
 * - Expandable rows for details
 * - Consistent spacing and alignment
 * - Action column for one-click operations
 */

export function DataTable({
  columns,
  data,
  onRowClick,
  onRowExpand,
  density = 'compact', // 'compact' | 'comfortable'
  expandedContent,
  className
}) {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const toggleRow = (rowId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
    onRowExpand?.(rowId, !expandedRows.has(rowId));
  };

  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const rowPadding = density === 'compact' ? 'px-4 py-2' : 'px-4 py-3';

  return (
    <div className={cn("bg-white rounded-lg border-2 border-gray-200 overflow-hidden", className)}>
      <table className="w-full">
        <thead className="bg-gray-50 border-b-2 border-gray-200">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "text-left text-xs font-bold text-gray-600 uppercase tracking-wide",
                  rowPadding,
                  column.sortable && "cursor-pointer hover:bg-gray-100 select-none"
                )}
                onClick={() => column.sortable && handleSort(column.key)}
                style={{ width: column.width }}
              >
                <div className="flex items-center gap-2">
                  {column.header}
                  {column.sortable && sortColumn === column.key && (
                    <ChevronDown
                      className={cn(
                        "w-3 h-3 transition-transform",
                        sortDirection === 'desc' && "rotate-180"
                      )}
                    />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence mode="popLayout">
            {data.map((row, index) => {
              const isExpanded = expandedRows.has(row.id);
              return (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-gray-100 hover:bg-gray-50 transition-colors",
                    isExpanded && "bg-blue-50/30"
                  )}
                >
                  <td colSpan={columns.length} className="p-0">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <div
                        className={cn("flex items-center", rowPadding, "cursor-pointer")}
                        onClick={() => onRowClick?.(row)}
                      >
                        {/* Expand button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(row.id);
                          }}
                          className="mr-2 p-0.5 hover:bg-gray-200 rounded transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                          )}
                        </button>

                        {/* Table cells */}
                        <div className="flex-1 grid grid-cols-[2fr_1.5fr_0.8fr_0.8fr_1fr_0.8fr_1fr_1fr_auto] gap-4 items-center">
                          {columns.map((column) => (
                            <div
                              key={column.key}
                              className={cn(
                                "min-w-0", // Prevent overflow
                                column.align === 'center' && "text-center",
                                column.align === 'right' && "text-right"
                              )}
                            >
                              {column.render ? column.render(row) : row[column.key]}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Expanded Content */}
                      <AnimatePresence>
                        {isExpanded && expandedContent && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 py-4 bg-gray-50/50 border-t border-gray-200">
                              {expandedContent(row)}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </td>
                </tr>
              );
            })}
          </AnimatePresence>
        </tbody>
      </table>

      {data.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No data to display</p>
        </div>
      )}
    </div>
  );
}

/**
 * TestRunsDataTable - Specialized table for test runs
 */
export function TestRunsDataTable({
  runs,
  onViewFailures,
  onRerun,
  onCompare,
  onViewDetails,
  density = 'compact'
}) {
  const columns = [
    {
      key: 'site',
      header: 'Site',
      sortable: true,
      width: '20%',
      render: (run) => (
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 truncate">{run.website_name}</div>
          <div className="text-xs text-gray-500 truncate">{run.website_url}</div>
        </div>
      )
    },
    {
      key: 'suite',
      header: 'Suite',
      sortable: true,
      width: '12%',
      render: (run) => (
        <div className="text-sm text-gray-700">{run.test_type}</div>
      )
    },
    {
      key: 'environment',
      header: 'Env',
      width: '8%',
      render: (run) => (
        <span className="text-xs text-gray-600">{run.environment || 'Prod'}</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '8%',
      align: 'center',
      render: (run) => <StatusBadge status={run.status} size="sm" />
    },
    {
      key: 'tests',
      header: 'Failed / Total',
      sortable: true,
      width: '10%',
      render: (run) => {
        const total = run.total_tests || 0;
        const failed = run.failed || 0;
        const passed = run.passed || 0;

        if (total === 0) {
          return <span className="text-xs text-gray-500">Not run</span>;
        }

        return (
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-semibold", failed > 0 ? "text-red-600" : "text-green-600")}>
              {failed}/{total}
            </span>
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-[60px]">
              <div
                className={cn("h-full transition-all", failed > 0 ? "bg-red-500" : "bg-green-500")}
                style={{ width: `${total > 0 ? (passed / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      key: 'critical',
      header: 'Critical',
      width: '8%',
      align: 'center',
      render: (run) => {
        const failureRate = run.total_tests > 0 ? (run.failed / run.total_tests) : 0;
        const criticalCount = failureRate > 0.5 ? run.failed : 0;

        if (criticalCount === 0) return <span className="text-xs text-gray-400">—</span>;

        return <SeverityBadge severity="critical" count={criticalCount} size="sm" />;
      }
    },
    {
      key: 'duration',
      header: 'Duration',
      sortable: true,
      width: '8%',
      render: (run) => (
        <span className="text-sm text-gray-700">
          {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : '—'}
        </span>
      )
    },
    {
      key: 'last_run',
      header: 'Last Run',
      sortable: true,
      width: '10%',
      render: (run) => (
        <div className="text-xs text-gray-600">
          <div>{new Date(run.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
          <div className="text-gray-500">{new Date(run.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '12%',
      align: 'right',
      render: (run) => (
        <div className="flex items-center justify-end gap-1">
          {run.failed > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewFailures?.(run);
              }}
              className="p-1.5 hover:bg-red-100 rounded text-red-600 transition-colors"
              title="View failures"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.(run);
              }}
              className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
              title="View details"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRerun?.(run);
            }}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
            title="Rerun"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCompare?.(run);
            }}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
            title="Compare"
          >
            <GitCompare className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const expandedContent = (run) => (
    <div className="grid grid-cols-4 gap-4 text-sm">
      <div>
        <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Run ID</div>
        <div className="text-gray-900 font-mono">{run.id}</div>
      </div>
      <div>
        <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Build Tag</div>
        <div className="text-gray-900">{run.build_tag || '—'}</div>
      </div>
      <div>
        <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Failure Rate</div>
        <div className="text-gray-900 font-semibold">
          {run.total_tests > 0 ? ((run.failed / run.total_tests) * 100).toFixed(1) : '0'}%
        </div>
      </div>
      <div>
        <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Quick Actions</div>
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails?.(run)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors"
          >
            View Full Report
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <DataTable
      columns={columns}
      data={runs}
      density={density}
      expandedContent={expandedContent}
      onRowClick={(run) => onViewDetails?.(run)}
    />
  );
}

export default DataTable;
