import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { cn } from "../../../lib/utils"

export const ScrollReveal = ({
  children,
  className,
  delay = 0,
  duration = 0.5,
  direction = "up",
  distance = 50,
}) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const directionVariants = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  }

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        ...directionVariants[direction],
      }}
      animate={
        isInView
          ? {
              opacity: 1,
              x: 0,
              y: 0,
            }
          : {}
      }
      transition={{
        duration,
        delay,
        ease: "easeOut",
      }}
      className={cn("", className)}
    >
      {children}
    </motion.div>
  )
}
