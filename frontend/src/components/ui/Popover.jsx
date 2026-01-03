import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Popover Component - Proper popover with positioning
 *
 * Design Principles:
 * - Clear visual hierarchy
 * - Structured sections
 * - Apply/Reset actions
 * - Proper z-index layering
 */

export function Popover({
  trigger,
  children,
  open,
  onOpenChange,
  align = 'start', // 'start' | 'center' | 'end'
  side = 'bottom', // 'top' | 'bottom' | 'left' | 'right'
  className
}) {
  const [isOpen, setIsOpen] = useState(open || false);
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    onOpenChange?.(false);
  };

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onOpenChange?.(newState);
  };

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0'
  };

  const sideClasses = {
    bottom: 'top-full mt-2',
    top: 'bottom-full mb-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  };

  return (
    <div className="relative inline-block">
      <div ref={triggerRef} onClick={handleToggle}>
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 bg-white rounded-lg shadow-xl border-2 border-gray-200",
              sideClasses[side],
              alignmentClasses[align],
              className
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Popover Content - Structured content with sections
 */
export function PopoverContent({ children, className }) {
  return (
    <div className={cn("p-4 min-w-[320px]", className)}>
      {children}
    </div>
  );
}

/**
 * Popover Section - Labeled section within popover
 */
export function PopoverSection({ title, children, className }) {
  return (
    <div className={cn("mb-4 last:mb-0", className)}>
      {title && (
        <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
          {title}
        </div>
      )}
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

/**
 * Popover Footer - Actions area
 */
export function PopoverFooter({ children, className }) {
  return (
    <div className={cn("flex items-center justify-between gap-2 pt-3 border-t border-gray-200 mt-4", className)}>
      {children}
    </div>
  );
}

/**
 * Filter Chip - Removable filter tag
 */
export function FilterChip({ label, onRemove, className }) {
  return (
    <motion.button
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      onClick={onRemove}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
        "bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors",
        className
      )}
    >
      {label}
      <X className="w-3 h-3" />
    </motion.button>
  );
}

export default Popover;
