import { motion } from 'framer-motion';
import './GlowingText.css';

export const GlowingText = ({ children, className = '' }) => {
  return (
    <motion.div
      className={`glowing-text ${className}`}
      animate={{
        textShadow: [
          '0 0 20px rgba(16, 185, 129, 0.5), 0 0 40px rgba(16, 185, 129, 0.3)',
          '0 0 40px rgba(16, 185, 129, 0.8), 0 0 80px rgba(16, 185, 129, 0.4)',
          '0 0 20px rgba(16, 185, 129, 0.5), 0 0 40px rgba(16, 185, 129, 0.3)',
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
};
