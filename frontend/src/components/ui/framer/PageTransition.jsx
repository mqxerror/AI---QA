import { motion, AnimatePresence } from "framer-motion"
import { cn } from "../../../lib/utils"

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
}

export const PageTransition = ({ children, className }) => {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className={cn("", className)}
    >
      {children}
    </motion.div>
  )
}

export const PageTransitionWrapper = ({ children }) => {
  return <AnimatePresence mode="wait">{children}</AnimatePresence>
}
