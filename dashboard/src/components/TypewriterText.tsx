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
  showCursor = true,
  cursorClassName,
  className,
}: {
  text: string
  speedMs?: number
  startDelayMs?: number
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

    setVisibleText("")

    let i = 0
    let intervalId: number | undefined
    const timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        i += 1
        setVisibleText(text.slice(0, i))
        if (i >= text.length) {
          if (intervalId !== undefined) window.clearInterval(intervalId)
        }
      }, Math.max(10, speedMs))
    }, Math.max(0, startDelayMs))

    return () => {
      window.clearTimeout(timeoutId)
      if (intervalId !== undefined) window.clearInterval(intervalId)
    }
  }, [prefersReducedMotion, speedMs, startDelayMs, text])

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

