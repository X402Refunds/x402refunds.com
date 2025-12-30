"use client"

import * as React from "react"

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) return

    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onChange = () => setPrefersReducedMotion(media.matches)

    onChange()
    media.addEventListener?.("change", onChange)
    return () => media.removeEventListener?.("change", onChange)
  }, [])

  return prefersReducedMotion
}

export function TypewriterText({
  text,
  speedMs = 55,
  startDelayMs = 0,
  loop = false,
  loopDelayMs = 1200,
  showCursor = true,
  cursorClassName,
  className,
}: {
  text: string
  speedMs?: number
  startDelayMs?: number
  loop?: boolean
  loopDelayMs?: number
  showCursor?: boolean
  cursorClassName?: string
  className?: string
}) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [visibleText, setVisibleText] = React.useState(prefersReducedMotion ? text : "")

  React.useEffect(() => {
    if (prefersReducedMotion) {
      setVisibleText(text)
      return
    }

    let cancelled = false
    let intervalId: number | undefined
    let startTimeoutId: number | undefined
    let loopTimeoutId: number | undefined

    const clearTimers = () => {
      if (startTimeoutId !== undefined) window.clearTimeout(startTimeoutId)
      if (loopTimeoutId !== undefined) window.clearTimeout(loopTimeoutId)
      if (intervalId !== undefined) window.clearInterval(intervalId)
    }

    const runOnce = () => {
      clearTimers()
      setVisibleText("")
      let i = 0

      startTimeoutId = window.setTimeout(() => {
        intervalId = window.setInterval(() => {
          if (cancelled) return

          i += 1
          setVisibleText(text.slice(0, i))

          if (i >= text.length) {
            if (intervalId !== undefined) window.clearInterval(intervalId)
            if (loop) {
              loopTimeoutId = window.setTimeout(runOnce, Math.max(0, loopDelayMs))
            }
          }
        }, Math.max(10, speedMs))
      }, Math.max(0, startDelayMs))
    }

    runOnce()

    return () => {
      cancelled = true
      clearTimers()
    }
  }, [prefersReducedMotion, speedMs, startDelayMs, loop, loopDelayMs, text])

  return (
    <span className={className}>
      {visibleText}
      {showCursor ? (
        <span
          aria-hidden="true"
          className={[
            "ml-[0.08em] inline-block h-[0.95em] w-[0.08em] translate-y-[0.06em] bg-current align-middle",
            "animate-pulse",
            cursorClassName || "",
          ].join(" ")}
        />
      ) : null}
    </span>
  )
}

