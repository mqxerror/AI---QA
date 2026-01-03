import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

/**
 * Beautiful Metric Card Component
 * @param {string} title - Card title
 * @param {string|number} value - Main value to display
 * @param {string} subtitle - Optional subtitle
 * @param {string} icon - Icon component from lucide-react
 * @param {string} variant - Color variant (success, warning, error, info, default)
 * @param {string} trend - Trend direction ('up', 'down', 'neutral')
 * @param {boolean} gradient - Use gradient background
 */
export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
  gradient = false,
  children
}) {
  const variants = {
    success: {
      bg: gradient ? 'bg-gradient-to-br from-green-50 to-emerald-100' : 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      text: 'text-green-900',
      value: 'text-green-600'
    },
    warning: {
      bg: gradient ? 'bg-gradient-to-br from-orange-50 to-amber-100' : 'bg-orange-50',
      border: 'border-orange-200',
      icon: 'text-orange-600',
      text: 'text-orange-900',
      value: 'text-orange-600'
    },
    error: {
      bg: gradient ? 'bg-gradient-to-br from-red-50 to-rose-100' : 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      text: 'text-red-900',
      value: 'text-red-600'
    },
    info: {
      bg: gradient ? 'bg-gradient-to-br from-blue-50 to-cyan-100' : 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      text: 'text-blue-900',
      value: 'text-blue-600'
    },
    purple: {
      bg: gradient ? 'bg-gradient-to-br from-purple-50 to-violet-100' : 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'text-purple-600',
      text: 'text-purple-900',
      value: 'text-purple-600'
    },
    default: {
      bg: gradient ? 'bg-gradient-to-br from-gray-50 to-slate-100' : 'bg-white',
      border: 'border-gray-200',
      icon: 'text-gray-600',
      text: 'text-gray-900',
      value: 'text-gray-900'
    }
  };

  const theme = variants[variant] || variants.default;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-xl border-2 ${theme.border} ${theme.bg} p-6 shadow-sm hover:shadow-md transition-all duration-200`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className={`text-sm font-medium ${theme.text} mb-1`}>{title}</h4>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${theme.bg} bg-opacity-50`}>
            <Icon className={`w-6 h-6 ${theme.icon}`} />
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className={`text-3xl font-bold ${theme.value} mb-1`}>
            {value}
          </div>
          {trend && TrendIcon && (
            <div className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              <TrendIcon className="w-4 h-4" />
              <span>{trend === 'up' ? 'Improving' : 'Declining'}</span>
            </div>
          )}
        </div>
      </div>

      {children && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {children}
        </div>
      )}
    </motion.div>
  );
}

/**
 * Status Badge Component
 */
export function StatusBadge({ status, label }) {
  const statusMap = {
    success: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
    warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertCircle },
    error: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
    info: { bg: 'bg-blue-100', text: 'text-blue-800', icon: AlertCircle }
  };

  const theme = statusMap[status] || statusMap.info;
  const Icon = theme.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${theme.bg} ${theme.text}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

export default MetricCard;
