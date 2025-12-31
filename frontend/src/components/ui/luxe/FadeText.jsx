import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { cn } from "../../../lib/utils"

export const FadeText = ({
  children,
  className,
  direction = "up",
  framerProps = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { type: "spring" } },
  },
  ...props
}) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  const directionOffset = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
  }

  const combinedVariants = {
    hidden: {
      ...directionOffset[direction],
      ...framerProps.hidden,
    },
    show: {
      x: 0,
      y: 0,
      ...framerProps.show,
    },
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "show" : "hidden"}
      variants={combinedVariants}
      className={cn("", className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
