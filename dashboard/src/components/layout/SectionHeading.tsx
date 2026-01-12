import * as React from "react"
import { cn } from "@/lib/utils"

type Size = "lg" | "md" | "sm"

const titleClass: Record<Size, string> = {
  lg: "text-3xl sm:text-4xl font-bold tracking-tight",
  md: "text-2xl sm:text-3xl font-bold tracking-tight",
  sm: "text-xl sm:text-2xl font-semibold tracking-tight",
}

export function SectionHeading({
  title,
  description,
  size = "lg",
  align = "center",
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  size?: Size
  align?: "left" | "center"
  className?: string
}) {
  const alignClass = align === "center" ? "mx-auto text-center" : ""
  return (
    <div className={cn("max-w-3xl", alignClass, className)}>
      <h2 className={cn("text-foreground", titleClass[size])}>{title}</h2>
      {description ? (
        <div className="mt-3 text-sm text-muted-foreground">{description}</div>
      ) : null}
    </div>
  )
}

