import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "../../../lib/utils"

export const AnimatedTabs = ({
  tabs,
  className,
  activeTabClassName,
  tabClassName,
  containerClassName,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState(tabs[0])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (onChange) onChange(tab)
  }

  return (
    <div className={cn("flex flex-col", containerClassName)}>
      <div
        className={cn(
          "flex space-x-1 rounded-xl bg-gray-100 p-1",
          className
        )}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab)}
            className={cn(
              "relative rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              activeTab.id === tab.id
                ? cn("text-white", activeTabClassName)
                : "text-gray-600 hover:text-gray-800",
              tabClassName
            )}
          >
            {activeTab.id === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-lg bg-blue-500"
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tabs.find((tab) => tab.id === activeTab.id)?.content}
      </div>
    </div>
  )
}
