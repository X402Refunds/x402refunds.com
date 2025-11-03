"use client"

import { useEffect, useRef } from "react"

interface MatrixRainProps {
  color?: string
  fontSize?: number
  columns?: number
  speed?: number
}

export function MatrixRain({ 
  color = '#10b981', 
  fontSize = 14,
  columns = 50,
  speed = 1
}: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Matrix characters (mix of katakana, numbers, and symbols)
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&*()_+-=[]{}|;:,.<>?'
    
    // Create columns
    const columnArray: number[] = []
    for (let i = 0; i < columns; i++) {
      columnArray[i] = Math.random() * -100 // Random starting position
    }

    // Parse color to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 16, g: 185, b: 129 } // Default emerald
    }
    const rgb = hexToRgb(color)

    // Animation
    let animationFrameId: number
    
    const animate = () => {
      // Semi-transparent black background for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Set font
      ctx.font = `${fontSize}px monospace`
      ctx.textAlign = 'center'

      // Draw each column
      const columnWidth = canvas.width / columns
      for (let i = 0; i < columns; i++) {
        const x = i * columnWidth + columnWidth / 2
        const y = columnArray[i] * fontSize

        // Random character
        const char = chars[Math.floor(Math.random() * chars.length)]
        
        // Fade effect (brighter at top, darker at bottom)
        const distance = columnArray[i] % 20
        const opacity = Math.max(0.1, 1 - distance / 20)
        
        // Color gradient (brighter green at top)
        const brightness = Math.min(1, opacity + 0.3)
        ctx.fillStyle = `rgba(${Math.floor(rgb.r * brightness)}, ${Math.floor(rgb.g * brightness)}, ${Math.floor(rgb.b * brightness)}, ${opacity})`
        
        ctx.fillText(char, x, y)

        // Move column down
        if (columnArray[i] * fontSize > canvas.height && Math.random() > 0.95) {
          columnArray[i] = 0 // Reset to top
        } else {
          columnArray[i] += speed + Math.random() * 0.5 // Variable speed
        }
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [color, fontSize, columns, speed])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none opacity-30"
      style={{ zIndex: 0 }}
    />
  )
}

