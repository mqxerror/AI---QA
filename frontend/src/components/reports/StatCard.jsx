import { motion } from 'framer-motion';

/**
 * Stat Card Component for displaying key metrics
 */
export function StatCard({ icon: Icon, label, value, description, variant = 'default', size = 'md' }) {
  const variants = {
    success: 'from-green-500 to-emerald-600',
    warning: 'from-orange-500 to-amber-600',
    error: 'from-red-500 to-rose-600',
    info: 'from-blue-500 to-cyan-600',
    purple: 'from-purple-500 to-violet-600',
    default: 'from-gray-500 to-slate-600'
  };

  const sizes = {
    sm: { container: 'p-4', icon: 'w-8 h-8 p-1.5', value: 'text-2xl', label: 'text-xs' },
    md: { container: 'p-5', icon: 'w-10 h-10 p-2', value: 'text-3xl', label: 'text-sm' },
    lg: { container: 'p-6', icon: 'w-12 h-12 p-2.5', value: 'text-4xl', label: 'text-base' }
  };

  const gradient = variants[variant] || variants.default;
  const sizeConfig = sizes[size] || sizes.md;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden rounded-2xl bg-white border-2 border-gray-100 ${sizeConfig.container} shadow-sm hover:shadow-lg transition-all duration-300`}
    >
      {/* Gradient Background Decoration */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-5 rounded-full -mr-16 -mt-16`}></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className={`font-medium text-gray-600 ${sizeConfig.label} mb-1`}>{label}</p>
            {description && (
              <p className="text-xs text-gray-400">{description}</p>
            )}
          </div>
          {Icon && (
            <div className={`flex-shrink-0 rounded-xl bg-gradient-to-br ${gradient} ${sizeConfig.icon} flex items-center justify-center shadow-sm`}>
              <Icon className="w-full h-full text-white" />
            </div>
          )}
        </div>

        <div className={`font-bold text-gray-900 ${sizeConfig.value}`}>
          {value}
        </div>
      </div>
    </motion.div>
  );
}

export default StatCard;
