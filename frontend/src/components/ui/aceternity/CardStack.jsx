import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "../../../lib/utils"

export const CardStack = ({ items, offset = 10, scaleFactor = 0.06 }) => {
  const [cards, setCards] = useState(items)

  useEffect(() => {
    const interval = setInterval(() => {
      setCards((prevCards) => {
        const newArray = [...prevCards]
        newArray.unshift(newArray.pop())
        return newArray
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative h-60 w-full">
      {cards.map((card, index) => {
        return (
          <motion.div
            key={card.id}
            className={cn(
              "absolute flex h-60 w-full flex-col justify-between rounded-3xl border border-neutral-200 bg-white p-4 shadow-xl shadow-black/[0.1] dark:border-white/[0.1] dark:bg-black dark:shadow-white/[0.05]",
              "dark:bg-black"
            )}
            style={{
              transformOrigin: "top center",
            }}
            animate={{
              top: index * -offset,
              scale: 1 - index * scaleFactor,
              zIndex: cards.length - index,
            }}
          >
            <div>{card.content}</div>
          </motion.div>
        )
      })}
    </div>
  )
}
