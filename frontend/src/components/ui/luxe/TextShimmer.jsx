import { motion } from "framer-motion"
import { cn } from "../../../lib/utils"

export const TextShimmer = ({
  children,
  className,
  shimmerWidth = 100,
  ...props
}) => {
  return (
    <motion.div
      className={cn("relative inline-block overflow-hidden", className)}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <motion.div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/80 to-transparent"
        style={{ width: `${shimmerWidth}%` }}
        animate={{
          x: ["-100%", "200%"],
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: "linear",
        }}
      />
    </motion.div>
  )
}
