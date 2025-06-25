"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const glassButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 backdrop-blur-md backdrop-saturate-150",
  {
    variants: {
      variant: {
        default: "bg-blue-500/80 text-white shadow-lg hover:bg-blue-600/90 border border-blue-400/30",
        secondary: "bg-slate-700/60 text-slate-100 hover:bg-slate-600/70 border border-slate-600/40",
        outline: "border border-slate-600/50 bg-slate-800/30 text-slate-200 hover:bg-slate-700/40",
        ghost: "text-slate-300 hover:bg-slate-800/40 hover:text-slate-100",
        destructive: "bg-red-500/80 text-white hover:bg-red-600/90 border border-red-400/30",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-lg px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  asChild?: boolean
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(glassButtonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
GlassButton.displayName = "GlassButton"

export { GlassButton, glassButtonVariants }
