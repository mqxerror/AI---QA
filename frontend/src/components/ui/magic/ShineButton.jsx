import { motion } from "framer-motion"
import { cn } from "../../../lib/utils"

export const ShineButton = ({
  children,
  className,
  onClick,
  ...props
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50",
        className
      )}
      onClick={onClick}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
        <div className="relative h-full w-8 bg-white/20" />
      </div>
    </motion.button>
  )
}
