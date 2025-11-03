"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

interface AnimatedSectionProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: "up" | "down" | "left" | "right"
}

/**
 * Professional scroll-triggered animation component
 * Subtle fade + slide animation that respects user preferences
 */
export function AnimatedSection({ 
  children, 
  className = "",
  delay = 0,
  direction = "up"
}: AnimatedSectionProps) {
  const directionVariants = {
    up: { y: 40, opacity: 0 },
    down: { y: -40, opacity: 0 },
    left: { x: 40, opacity: 0 },
    right: { x: -40, opacity: 0 },
  }

  return (
    <motion.div
      initial={directionVariants[direction]}
      whileInView={{ y: 0, x: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1], // Professional easing curve
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Staggered list animation for professional reveal effects
 */
interface AnimatedListProps {
  children: ReactNode[]
  className?: string
  staggerDelay?: number
}

export function AnimatedList({ 
  children, 
  className = "",
  staggerDelay = 0.1 
}: AnimatedListProps) {
  // Convert children to array if it's not already
  const childrenArray = Array.isArray(children) ? children : [children]
  
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {childrenArray.map((child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
              },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

