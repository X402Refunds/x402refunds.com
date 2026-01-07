"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { useEffect } from "react"

interface SuccessCheckmarkProps {
  show: boolean
  onComplete?: () => void
  className?: string
  inline?: boolean // If true, renders inline instead of fixed overlay
}

export function SuccessCheckmark({ show, onComplete, className = "", inline = false }: SuccessCheckmarkProps) {
  useEffect(() => {
    if (show && !inline) {
      // Auto-hide after animation completes (only for fixed overlay mode)
      const timer = setTimeout(() => {
        onComplete?.()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete, inline])

  // For inline mode, don't auto-hide - let parent control visibility
  if (!show) return null

  // Inline mode - positioned relative to parent
  if (inline) {
    return (
      <motion.div
        className={`absolute top-2 right-2 z-50 pointer-events-none ${className}`}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Backdrop circle that expands */}
        <motion.div
          className="absolute w-20 h-20 bg-blue-600 rounded-full -top-1 -right-1"
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        
        {/* Main checkmark container */}
        <motion.div
          className="relative bg-white rounded-full p-3 shadow-xl border-2 border-blue-600"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
            delay: 0.1,
          }}
        >
          {/* Checkmark icon */}
          <motion.div
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              delay: 0.3,
              duration: 0.5,
              ease: "easeOut",
            }}
          >
            <Check className="w-6 h-6 text-blue-600 stroke-[3]" />
          </motion.div>
        </motion.div>
      </motion.div>
    )
  }

  // Fixed overlay mode (original behavior)
  return (
    <motion.div
      className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop circle that expands */}
      <motion.div
        className="absolute w-32 h-32 bg-blue-600 rounded-full"
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
          <Check className="w-12 h-12 text-blue-600 stroke-[3]" />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

