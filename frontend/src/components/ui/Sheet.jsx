import { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * Sheet Component - Right-side drawer panel
 *
 * Design Principles:
 * - Less disruptive than modals
 * - Maintains context of main view
 * - Compact header with actions
 * - Sticky footer for primary actions
 * - Better for routine viewing workflows
 */

export function Sheet({ open, onClose, children, className }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && open) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000
            }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed',
              right: 0,
              top: '60px', // Account for header
              bottom: 0,
              width: '100%',
              maxWidth: '900px',
              backgroundColor: '#fff',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderTopLeftRadius: '16px'
            }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Sheet Header - Compact header with title and close
 */
export function SheetHeader({ children, onClose, className }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-6 py-4 border-b-2 border-gray-200 bg-gray-50", className)}>
      <div className="flex-1 min-w-0">
        {children}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      )}
    </div>
  );
}

/**
 * Sheet Title - Primary title in header
 */
export function SheetTitle({ children, className }) {
  return (
    <h2 className={cn("text-xl font-bold text-gray-900 truncate", className)}>
      {children}
    </h2>
  );
}

/**
 * Sheet Description - Subtitle/metadata in header
 */
export function SheetDescription({ children, className }) {
  return (
    <p className={cn("text-sm text-gray-600 mt-1", className)}>
      {children}
    </p>
  );
}

/**
 * Sheet Content - Scrollable content area
 */
export function SheetContent({ children, className }) {
  return (
    <div className={cn("flex-1 overflow-y-auto px-6 py-6", className)}>
      {children}
    </div>
  );
}

/**
 * Sheet Footer - Sticky footer with actions
 */
export function SheetFooter({ children, className }) {
  return (
    <div className={cn("px-6 py-4 border-t-2 border-gray-200 bg-gray-50 flex items-center justify-between gap-4", className)}>
      {children}
    </div>
  );
}

/**
 * Sheet Section - Organized content section
 */
export function SheetSection({ title, children, className }) {
  return (
    <div className={cn("mb-6 last:mb-0", className)}>
      {title && (
        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

export default Sheet;
