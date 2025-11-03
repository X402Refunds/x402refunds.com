"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { useEffect, useState } from "react"

interface SuccessCheckmarkProps {
  show: boolean
  onComplete?: () => void
  className?: string
}

export function SuccessCheckmark({ show, onComplete, className = "" }: SuccessCheckmarkProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      // Auto-hide after animation completes
      const timer = setTimeout(() => {
        setIsVisible(false)
        onComplete?.()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  if (!isVisible) return null

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop circle that expands */}
      <motion.div
        className="absolute w-32 h-32 bg-emerald-500 rounded-full"
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 4, opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      
      {/* Main checkmark container */}
      <motion.div
        className="relative bg-white rounded-full p-6 shadow-2xl"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
      >
        {/* Checkmark icon */}
        <motion.div
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            delay: 0.2,
            duration: 0.4,
            ease: "easeOut",
          }}
        >
          <Check className="w-12 h-12 text-emerald-600 stroke-[3]" />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

