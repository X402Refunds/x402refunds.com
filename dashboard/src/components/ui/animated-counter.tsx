"use client"

import { useEffect, useState } from "react"

interface AnimatedCounterProps {
  value: number
  duration?: number
  suffix?: string
  prefix?: string
  decimals?: number
  className?: string
}

/**
 * Animated counter that counts up from 0 to target value
 * Supports numbers with suffixes like "%" or "m" (millions)
 */
export function AnimatedCounter({ 
  value, 
  duration = 2,
  suffix = "",
  prefix = "",
  decimals = 0,
  className = ""
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)

  // Format the display value based on suffix
  const formatValue = (num: number): string => {
    // Handle percentage
    if (suffix === "%") {
      return num.toFixed(decimals) + "%"
    }
    
    // Handle millions
    if (suffix === "m") {
      return num.toFixed(decimals) + "m"
    }
    
    // Handle thousands
    if (suffix === "k") {
      return num.toFixed(decimals) + "k"
    }
    
    // Regular number
    return num.toFixed(decimals)
  }

  useEffect(() => {
    const startTime = Date.now()
    
    const animate = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / (duration * 1000), 1)
      
      // Easing function for smooth animation (ease-out cubic)
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const currentValue = value * easeOutCubic
      
      setDisplayValue(currentValue)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(value)
      }
    }
    
    // Small delay to ensure visibility before starting animation
    const timeout = setTimeout(() => {
      requestAnimationFrame(animate)
    }, 100)
    
    return () => clearTimeout(timeout)
  }, [value, duration])

  return (
    <span className={className}>
      {prefix}
      {formatValue(displayValue)}
      {suffix && suffix !== "%" && suffix}
    </span>
  )
}

