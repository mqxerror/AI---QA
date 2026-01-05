import { motion } from 'framer-motion';
import './EmptyState.css';

/**
 * Premium Empty State Component
 * Provides engaging visuals when there's no data to display
 */

// SVG Illustrations for different contexts
const illustrations = {
  // No test runs
  noTests: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="empty-illustration">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      {/* Background circle */}
      <circle cx="100" cy="80" r="60" fill="url(#grad1)" />
      {/* Flask/beaker shape */}
      <path d="M80 40 L80 70 L60 110 Q55 120 65 125 L135 125 Q145 120 140 110 L120 70 L120 40"
            stroke="url(#grad2)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Flask neck */}
      <rect x="75" y="30" width="50" height="15" rx="3" stroke="url(#grad2)" strokeWidth="2" fill="none" />
      {/* Bubbles */}
      <circle cx="85" cy="95" r="5" fill="#6366f1" opacity="0.6">
        <animate attributeName="cy" values="95;85;95" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="100" cy="100" r="4" fill="#8b5cf6" opacity="0.5">
        <animate attributeName="cy" values="100;88;100" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="115" cy="98" r="3" fill="#a78bfa" opacity="0.4">
        <animate attributeName="cy" values="98;90;98" dur="1.8s" repeatCount="indefinite" />
      </circle>
      {/* Plus sign */}
      <line x1="165" y1="35" x2="165" y2="55" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
      <line x1="155" y1="45" x2="175" y2="45" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),

  // No websites
  noWebsites: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="empty-illustration">
      <defs>
        <linearGradient id="webGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="webGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      {/* Background */}
      <circle cx="100" cy="80" r="60" fill="url(#webGrad1)" />
      {/* Globe */}
      <circle cx="100" cy="80" r="45" stroke="url(#webGrad2)" strokeWidth="2.5" fill="none" />
      {/* Latitude lines */}
      <ellipse cx="100" cy="80" rx="45" ry="18" stroke="url(#webGrad2)" strokeWidth="1.5" fill="none" opacity="0.6" />
      <ellipse cx="100" cy="80" rx="45" ry="35" stroke="url(#webGrad2)" strokeWidth="1.5" fill="none" opacity="0.4" />
      {/* Longitude line */}
      <ellipse cx="100" cy="80" rx="18" ry="45" stroke="url(#webGrad2)" strokeWidth="1.5" fill="none" opacity="0.6" />
      {/* Cursor pointer */}
      <path d="M140 105 L140 130 L148 122 L155 135 L160 132 L153 119 L163 119 Z"
            fill="#3b82f6" stroke="#1e40af" strokeWidth="1.5" />
      {/* Plus */}
      <circle cx="160" cy="40" r="15" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2" />
      <line x1="160" y1="33" x2="160" y2="47" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
      <line x1="153" y1="40" x2="167" y2="40" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),

  // No results/data
  noData: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="empty-illustration">
      <defs>
        <linearGradient id="dataGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="dataGrad2" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      {/* Background */}
      <circle cx="100" cy="80" r="60" fill="url(#dataGrad1)" />
      {/* Chart bars */}
      <rect x="55" y="90" width="20" height="35" rx="4" fill="url(#dataGrad2)" opacity="0.4" />
      <rect x="80" y="70" width="20" height="55" rx="4" fill="url(#dataGrad2)" opacity="0.6" />
      <rect x="105" y="85" width="20" height="40" rx="4" fill="url(#dataGrad2)" opacity="0.5" />
      <rect x="130" y="60" width="20" height="65" rx="4" fill="url(#dataGrad2)" opacity="0.7" />
      {/* Dashed line through bars */}
      <line x1="50" y1="80" x2="160" y2="80" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" />
      {/* Question mark */}
      <circle cx="160" cy="35" r="18" fill="none" stroke="#f59e0b" strokeWidth="2" />
      <text x="160" y="42" textAnchor="middle" fill="#f59e0b" fontSize="20" fontWeight="bold">?</text>
    </svg>
  ),

  // Search no results
  noSearchResults: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="empty-illustration">
      <defs>
        <linearGradient id="searchGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="searchGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      {/* Background */}
      <circle cx="100" cy="80" r="60" fill="url(#searchGrad1)" />
      {/* Magnifying glass */}
      <circle cx="90" cy="75" r="30" stroke="url(#searchGrad2)" strokeWidth="4" fill="none" />
      <line x1="112" y1="98" x2="140" y2="126" stroke="url(#searchGrad2)" strokeWidth="6" strokeLinecap="round" />
      {/* X inside */}
      <line x1="78" y1="63" x2="102" y2="87" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      <line x1="102" y1="63" x2="78" y2="87" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    </svg>
  ),

  // Success/All good
  success: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="empty-illustration">
      <defs>
        <linearGradient id="successGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="successGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
      {/* Background */}
      <circle cx="100" cy="80" r="60" fill="url(#successGrad1)" />
      {/* Shield */}
      <path d="M100 30 L140 50 L140 90 Q140 120 100 140 Q60 120 60 90 L60 50 Z"
            stroke="url(#successGrad2)" strokeWidth="3" fill="none" />
      {/* Checkmark */}
      <path d="M75 80 L95 100 L130 60" stroke="#10b981" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Sparkles */}
      <circle cx="150" cy="50" r="4" fill="#34d399" opacity="0.8">
        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="160" cy="70" r="3" fill="#10b981" opacity="0.6">
        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="45" cy="60" r="3" fill="#34d399" opacity="0.7">
        <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  ),

  // Loading/Processing
  loading: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="empty-illustration">
      <defs>
        <linearGradient id="loadGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {/* Background */}
      <circle cx="100" cy="80" r="60" fill="url(#loadGrad1)" />
      {/* Rotating circles */}
      <g>
        <circle cx="100" cy="50" r="8" fill="#6366f1" opacity="1">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" begin="0s" />
        </circle>
        <circle cx="130" cy="65" r="8" fill="#6366f1" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.2s" repeatCount="indefinite" begin="0.15s" />
        </circle>
        <circle cx="140" cy="95" r="8" fill="#6366f1" opacity="0.6">
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.2s" repeatCount="indefinite" begin="0.3s" />
        </circle>
        <circle cx="115" cy="120" r="8" fill="#6366f1" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.2;0.4" dur="1.2s" repeatCount="indefinite" begin="0.45s" />
        </circle>
        <circle cx="85" cy="120" r="8" fill="#6366f1" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.2;0.3" dur="1.2s" repeatCount="indefinite" begin="0.6s" />
        </circle>
        <circle cx="60" cy="95" r="8" fill="#6366f1" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.2;0.4" dur="1.2s" repeatCount="indefinite" begin="0.75s" />
        </circle>
        <circle cx="70" cy="65" r="8" fill="#6366f1" opacity="0.6">
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.2s" repeatCount="indefinite" begin="0.9s" />
        </circle>
      </g>
    </svg>
  )
};

export default function EmptyState({
  type = 'noData',
  title,
  description,
  action,
  actionLabel,
  className = ''
}) {
  const defaultContent = {
    noTests: {
      title: 'No Test Runs Yet',
      description: 'Run your first test to see results here. Choose a website and select a test type to get started.'
    },
    noWebsites: {
      title: 'No Websites Added',
      description: 'Add your first website to start monitoring. Click the button below to begin.'
    },
    noData: {
      title: 'No Data Available',
      description: 'There\'s nothing to display right now. Check back later or adjust your filters.'
    },
    noSearchResults: {
      title: 'No Results Found',
      description: 'Try adjusting your search terms or filters to find what you\'re looking for.'
    },
    success: {
      title: 'All Systems Operational',
      description: 'Everything is running smoothly. No issues detected.'
    },
    loading: {
      title: 'Processing...',
      description: 'Please wait while we fetch the latest data.'
    }
  };

  const content = defaultContent[type] || defaultContent.noData;
  const illustration = illustrations[type] || illustrations.noData;

  return (
    <motion.div
      className={`empty-state ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="empty-state-illustration">
        {illustration}
      </div>
      <h3 className="empty-state-title">{title || content.title}</h3>
      <p className="empty-state-description">{description || content.description}</p>
      {action && actionLabel && (
        <motion.button
          className="empty-state-action"
          onClick={action}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}

// Export individual illustrations for custom use
export { illustrations };
