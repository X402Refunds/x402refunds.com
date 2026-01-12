import * as React from "react"
import { cn } from "@/lib/utils"
import { Container } from "@/components/layout/container"

type Spacing = "default" | "tight" | "none"

const spacingClass: Record<Spacing, string> = {
  default: "py-16 sm:py-24",
  tight: "py-12 sm:py-16",
  none: "",
}

export function Section({
  spacing = "default",
  containerClassName,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  spacing?: Spacing
  containerClassName?: string
}) {
  return (
    <section className={className} {...props}>
      <Container className={cn(spacingClass[spacing], containerClassName)}>
        {children}
      </Container>
    </section>
  )
}

