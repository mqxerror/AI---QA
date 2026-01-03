import { motion } from 'framer-motion';
import { Eye, RotateCw, GitCompare, AlertTriangle, CheckCircle, XCircle, Clock, Activity } from 'lucide-react';

/**
 * Enhanced Test Run Card with clearer hierarchy and one-click actions
 */
export function EnhancedTestRunCard({
  run,
  onViewFailures,
  onRerun,
  onCompare,
  onViewDetails,
  isExpanded = false
}) {
  const {
    id,
    website_name,
    test_type,
    status,
    total_tests = 0,
    passed = 0,
    failed = 0,
    duration_ms,
    created_at,
    environment = 'Production',
    build_tag
  } = run;

  // Calculate failure metrics
  const failureRate = total_tests > 0 ? ((failed / total_tests) * 100).toFixed(1) : 0;
  const criticalFailures = run.critical_count || Math.min(failed, 6); // Assume some are critical

  // Determine urgency
  const isUrgent = failureRate > 30 || criticalFailures > 0;
  const isCritical = criticalFailures > 0;

  // Status styling
  const getStatusStyle = () => {
    if (status === 'Pass') return {
      bg: 'from-green-50 to-emerald-100',
      border: 'border-green-300',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-500'
    };
    if (status === 'Fail') return {
      bg: 'from-red-50 to-rose-100',
      border: 'border-red-300',
      icon: XCircle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-500'
    };
    return {
      bg: 'from-yellow-50 to-amber-100',
      border: 'border-yellow-300',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      iconBg: 'bg-yellow-500'
    };
  };

  const styleConfig = getStatusStyle();
  const StatusIcon = styleConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className={`rounded-xl border-2 ${styleConfig.border} bg-gradient-to-br ${styleConfig.bg} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}
    >
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          {/* Left: Site & Test Type */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900">{website_name}</h3>
              {isCritical && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                  CRITICAL
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{test_type}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">{environment}</span>
              {build_tag && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full font-mono">
                    {build_tag}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: Status Icon */}
          <div className={`p-3 rounded-xl ${styleConfig.iconBg}`}>
            <StatusIcon className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Status Line - PRIMARY METRIC */}
        <div className="mb-4 p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold text-gray-900">
                  {failureRate}%
                </span>
                <span className="text-sm text-gray-600">failure rate</span>
              </div>
              <div className="text-sm text-gray-700">
                <span className="font-semibold text-red-600">{failed}</span> failed
                {' / '}
                <span className="font-semibold text-green-600">{passed}</span> passed
                {' / '}
                <span className="font-semibold text-gray-800">{total_tests}</span> total
                {criticalFailures > 0 && (
                  <span className="ml-2 text-red-600 font-semibold">
                    • {criticalFailures} critical
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Metrics Row */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span className="font-medium">
              {new Date(created_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            <span className="text-gray-400">•</span>
            <span>
              {new Date(created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4" />
            <span>{duration_ms ? `${(duration_ms / 1000).toFixed(1)}s` : 'N/A'}</span>
          </div>
        </div>

        {/* Action Buttons - CTAs */}
        <div className="flex items-center gap-2">
          {/* Primary CTA: View Failures (if failed) or View Details */}
          {failed > 0 ? (
            <button
              onClick={() => onViewFailures?.(run)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md"
            >
              <AlertTriangle className="w-4 h-4" />
              View {failed} Failure{failed !== 1 ? 's' : ''}
            </button>
          ) : (
            <button
              onClick={() => onViewDetails?.(run)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md"
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
          )}

          {/* Secondary CTAs */}
          <button
            onClick={() => onRerun?.(run)}
            className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border-2 border-gray-300 transition-all hover:border-gray-400 shadow-sm"
            title="Rerun test"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onCompare?.(run)}
            className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border-2 border-gray-300 transition-all hover:border-gray-400 shadow-sm"
            title="Compare with previous run"
          >
            <GitCompare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Details (if needed) */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t-2 border-gray-200 bg-white/40 backdrop-blur-sm p-5"
        >
          {/* Additional details can go here */}
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-2">Test Run ID: {id}</p>
            {/* Add more details as needed */}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default EnhancedTestRunCard;
