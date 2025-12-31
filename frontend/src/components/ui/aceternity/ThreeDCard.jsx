import { cn } from "../../../lib/utils"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { useRef } from "react"

export const CardContainer = ({ children, className, containerClassName }) => {
  const containerRef = useRef(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], ["17.5deg", "-17.5deg"]))
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], ["-17.5deg", "17.5deg"]))

  const handleMouseMove = (e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    mouseX.set(xPct)
    mouseY.set(yPct)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateY,
        rotateX,
        transformStyle: "preserve-3d",
      }}
      className={cn("flex items-center justify-center", containerClassName)}
    >
      <div
        style={{
          transformStyle: "preserve-3d",
        }}
        className={cn("w-full", className)}
      >
        {children}
      </div>
    </motion.div>
  )
}

export const CardBody = ({ children, className }) => {
  return (
    <div
      className={cn(
        "[transform-style:preserve-3d] [&>*]:[transform-style:preserve-3d]",
        className
      )}
    >
      {children}
    </div>
  )
}

export const CardItem = ({ children, className, translateZ = 0 }) => {
  return (
    <div
      style={{
        transform: `translateZ(${translateZ}px)`,
      }}
      className={cn("w-full", className)}
    >
      {children}
    </div>
  )
}
