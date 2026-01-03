import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';

/**
 * Status Summary Bar - Primary visual anchor showing failures first
 * Displays: Failed (critical), Failed (total), Pass rate, Last run time, Trends
 */
export function StatusSummaryBar({ stats, isLoading }) {
  if (isLoading) {
    return (
      <div className="sticky top-0 z-30 bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-6">
            <div className="h-16 bg-gray-200 rounded-lg animate-pulse w-48"></div>
            <div className="h-16 bg-gray-200 rounded-lg animate-pulse w-48"></div>
            <div className="h-16 bg-gray-200 rounded-lg animate-pulse w-48"></div>
          </div>
        </div>
      </div>
    );
  }

  const {
    totalFailed = 0,
    criticalFailed = 0,
    totalPassed = 0,
    totalTests = 0,
    lastRunTime = null,
    failedTrend = 0, // positive = more failures, negative = fewer failures
    passRate = 0
  } = stats || {};

  const getTrendIcon = (trend) => {
    if (trend > 0) return { Icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-50' };
    if (trend < 0) return { Icon: TrendingDown, color: 'text-green-600', bg: 'bg-green-50' };
    return { Icon: Activity, color: 'text-gray-600', bg: 'bg-gray-50' };
  };

  const trendInfo = getTrendIcon(failedTrend);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-30 bg-gradient-to-r from-white to-gray-50 border-b-2 border-gray-200 shadow-md backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Critical Failures - PRIMARY ANCHOR */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`flex-1 p-4 rounded-xl border-2 ${
              criticalFailed > 0
                ? 'bg-gradient-to-br from-red-50 to-rose-100 border-red-300 shadow-red-100 shadow-lg'
                : 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${criticalFailed > 0 ? 'bg-red-500' : 'bg-green-500'}`}>
                {criticalFailed > 0 ? (
                  <AlertTriangle className="w-6 h-6 text-white" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-600 mb-0.5">Critical Failures</div>
                <div className={`text-2xl font-bold ${criticalFailed > 0 ? 'text-red-700' : 'text-green-700'}`}>
                  {criticalFailed}
                </div>
              </div>
              {criticalFailed > 0 && (
                <div className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                  URGENT
                </div>
              )}
            </div>
          </motion.div>

          {/* Total Failures */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`flex-1 p-4 rounded-xl border-2 ${
              totalFailed > 0
                ? 'bg-gradient-to-br from-orange-50 to-amber-100 border-orange-300'
                : 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${totalFailed > 0 ? 'bg-orange-500' : 'bg-green-500'}`}>
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-600 mb-0.5">Total Failures</div>
                <div className={`text-2xl font-bold ${totalFailed > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                  {totalFailed}
                </div>
              </div>
              {/* Trend Indicator */}
              {failedTrend !== 0 && (
                <div className={`flex items-center gap-1 ${trendInfo.color} ${trendInfo.bg} px-2 py-1 rounded-full`}>
                  <trendInfo.Icon className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">{Math.abs(failedTrend)}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Pass Rate */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex-1 p-4 rounded-xl border-2 bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-300"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-600 mb-0.5">Pass Rate</div>
                <div className="text-2xl font-bold text-blue-700">
                  {passRate.toFixed(1)}%
                </div>
              </div>
              <div className="text-xs text-gray-600">
                {totalPassed}/{totalTests}
              </div>
            </div>
          </motion.div>

          {/* Last Run Time */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex-1 p-4 rounded-xl border-2 bg-gradient-to-br from-purple-50 to-violet-100 border-purple-300"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-500">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-600 mb-0.5">Last Run</div>
                <div className="text-sm font-bold text-purple-700">
                  {lastRunTime
                    ? new Date(lastRunTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Never'}
                </div>
                {lastRunTime && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {new Date(lastRunTime).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default StatusSummaryBar;
