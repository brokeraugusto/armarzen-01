"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "subtle"
  blur?: "sm" | "md" | "lg" | "xl"
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", blur = "md", ...props }, ref) => {
    const variants = {
      default: "bg-slate-800/20 border-slate-700/30",
      elevated: "bg-slate-800/30 border-slate-600/40 shadow-2xl",
      subtle: "bg-slate-800/10 border-slate-700/20",
    }

    const blurClasses = {
      sm: "backdrop-blur-sm",
      md: "backdrop-blur-md",
      lg: "backdrop-blur-lg",
      xl: "backdrop-blur-xl",
    }

    return (
      <div
        ref={ref}
        className={cn("rounded-xl border backdrop-saturate-150", variants[variant], blurClasses[blur], className)}
        {...props}
      />
    )
  },
)
GlassCard.displayName = "GlassCard"

export { GlassCard }
