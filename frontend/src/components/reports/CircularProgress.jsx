import { motion } from 'framer-motion';

/**
 * Circular Progress Component for displaying scores
 * @param {number} value - Score value (0-100)
 * @param {number} size - Size of the circle (default: 120)
 * @param {string} label - Label to display below the value
 * @param {string} color - Color theme (green, orange, red, blue, purple)
 */
export function CircularProgress({ value = 0, size = 120, label, color = 'blue' }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const colorMap = {
    green: { stroke: '#10b981', bg: '#d1fae5', text: 'text-green-600' },
    orange: { stroke: '#f97316', bg: '#fed7aa', text: 'text-orange-600' },
    red: { stroke: '#ef4444', bg: '#fecaca', text: 'text-red-600' },
    blue: { stroke: '#3b82f6', bg: '#bfdbfe', text: 'text-blue-600' },
    purple: { stroke: '#a855f7', bg: '#e9d5ff', text: 'text-purple-600' }
  };

  const getColorByValue = () => {
    if (value >= 90) return colorMap.green;
    if (value >= 70) return colorMap.blue;
    if (value >= 50) return colorMap.orange;
    return colorMap.red;
  };

  const theme = color === 'auto' ? getColorByValue() : colorMap[color] || colorMap.blue;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background Circle */}
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.bg}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress Circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.stroke}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className={`text-3xl font-bold ${theme.text}`}
            >
              {value}
            </motion.div>
            {label && (
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CircularProgress;
