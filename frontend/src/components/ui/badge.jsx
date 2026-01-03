import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * Badge Component - Standardized status and severity badges
 *
 * Design Principles:
 * - Explicit states: Pass, Fail, Error, Skipped, Warning, Running, Info
 * - Consistent sizing: sm (default), md, lg
 * - High contrast for accessibility
 * - Icon support for visual clarity
 */

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 font-semibold whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        // Status badges
        pass: "bg-emerald-500 text-white",
        fail: "bg-red-600 text-white",
        error: "bg-purple-600 text-white",
        skipped: "bg-gray-400 text-white",
        warning: "bg-amber-500 text-white",
        running: "bg-blue-500 text-white animate-pulse",

        // Severity badges
        critical: "bg-red-600 text-white",
        high: "bg-orange-500 text-white",
        serious: "bg-orange-600 text-white",
        medium: "bg-amber-500 text-white",
        moderate: "bg-yellow-500 text-white",
        low: "bg-blue-500 text-white",
        minor: "bg-gray-500 text-white",
        info: "bg-blue-400 text-white",

        // Outline variants (less intrusive)
        passOutline: "border-2 border-emerald-500 text-emerald-700 bg-emerald-50",
        failOutline: "border-2 border-red-600 text-red-700 bg-red-50",
        errorOutline: "border-2 border-purple-600 text-purple-700 bg-purple-50",
        skippedOutline: "border-2 border-gray-400 text-gray-700 bg-gray-50",
        warningOutline: "border-2 border-amber-500 text-amber-700 bg-amber-50",
      },
      size: {
        sm: "px-2 py-0.5 text-xs rounded",
        md: "px-2.5 py-1 text-sm rounded-md",
        lg: "px-3 py-1.5 text-base rounded-lg",
      },
    },
    defaultVariants: {
      variant: "info",
      size: "sm",
    },
  }
);

export function Badge({
  variant,
  size,
  className,
  children,
  icon: Icon,
  ...props
}) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
}

/**
 * Status Badge - Semantic wrapper for test run statuses
 */
export function StatusBadge({ status, size = "sm", showIcon = true, className }) {
  const statusConfig = {
    Pass: { variant: 'pass', label: 'Pass' },
    Fail: { variant: 'fail', label: 'Fail' },
    Error: { variant: 'error', label: 'Error' },
    Skipped: { variant: 'skipped', label: 'Skipped' },
    'Not Run': { variant: 'skipped', label: 'Not Run' },
    Running: { variant: 'running', label: 'Running' },
    Warning: { variant: 'warning', label: 'Warning' },
  };

  const config = statusConfig[status] || { variant: 'info', label: status || 'Unknown' };

  return (
    <Badge variant={config.variant} size={size} className={className}>
      {config.label}
    </Badge>
  );
}

/**
 * Severity Badge - For violations and issues
 */
export function SeverityBadge({ severity, count, size = "sm", className }) {
  const severityMap = {
    critical: 'critical',
    high: 'high',
    serious: 'serious',
    medium: 'medium',
    moderate: 'moderate',
    low: 'low',
    minor: 'minor',
    info: 'info',
  };

  const variant = severityMap[severity?.toLowerCase()] || 'info';
  const label = count !== undefined ? `${count} ${severity}` : severity;

  return (
    <Badge variant={variant} size={size} className={className}>
      {label}
    </Badge>
  );
}

export default Badge;
