import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, Lightbulb, ExternalLink } from 'lucide-react';

/**
 * Beautiful Issue Card Component for displaying violations, warnings, and recommendations
 */
export function IssueCard({ severity, title, description, recommendation, learnMoreUrl, affectedCount }) {
  const severityConfig = {
    critical: {
      bg: 'bg-gradient-to-r from-red-50 to-rose-50',
      border: 'border-red-500',
      badge: 'bg-red-500 text-white',
      icon: AlertTriangle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600'
    },
    high: {
      bg: 'bg-gradient-to-r from-red-50 to-orange-50',
      border: 'border-red-400',
      badge: 'bg-red-400 text-white',
      icon: AlertTriangle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-500'
    },
    serious: {
      bg: 'bg-gradient-to-r from-orange-50 to-amber-50',
      border: 'border-orange-500',
      badge: 'bg-orange-500 text-white',
      icon: AlertCircle,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    medium: {
      bg: 'bg-gradient-to-r from-orange-50 to-yellow-50',
      border: 'border-orange-400',
      badge: 'bg-orange-400 text-white',
      icon: AlertCircle,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-500'
    },
    moderate: {
      bg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
      border: 'border-yellow-500',
      badge: 'bg-yellow-500 text-white',
      icon: AlertCircle,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    warning: {
      bg: 'bg-gradient-to-r from-yellow-50 to-orange-50',
      border: 'border-yellow-400',
      badge: 'bg-yellow-400 text-gray-900',
      icon: AlertCircle,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    low: {
      bg: 'bg-gradient-to-r from-blue-50 to-cyan-50',
      border: 'border-blue-400',
      badge: 'bg-blue-400 text-white',
      icon: Info,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    minor: {
      bg: 'bg-gradient-to-r from-blue-50 to-sky-50',
      border: 'border-blue-300',
      badge: 'bg-blue-300 text-gray-900',
      icon: Info,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-500'
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
      border: 'border-blue-400',
      badge: 'bg-blue-400 text-white',
      icon: Info,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    }
  };

  const config = severityConfig[severity?.toLowerCase()] || severityConfig.info;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-xl border-l-4 ${config.border} ${config.bg} p-5 shadow-sm hover:shadow-md transition-all duration-200`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 p-2.5 rounded-lg ${config.iconBg}`}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${config.badge}`}>
                {severity}
              </span>
              <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
            </div>
            {affectedCount !== undefined && (
              <span className="flex-shrink-0 text-xs text-gray-600 bg-white/60 px-2 py-1 rounded-full">
                {affectedCount} {affectedCount === 1 ? 'element' : 'elements'} affected
              </span>
            )}
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
              {description}
            </p>
          )}

          {/* Recommendation */}
          {recommendation && (
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 mb-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600 mb-1">Recommendation</p>
                  <p className="text-sm text-gray-800">{recommendation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Learn More Link */}
          {learnMoreUrl && (
            <a
              href={learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
            >
              <span>Learn more</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default IssueCard;
