"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  className?: string
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
}

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const [logoUrl, setLogoUrl] = useState("/images/armarzen-logo.png")

  useEffect(() => {
    fetchLogoUrl()
  }, [])

  const fetchLogoUrl = async () => {
    try {
      const response = await fetch("/api/settings")
      const settings = await response.json()
      if (settings.store_logo) {
        setLogoUrl(settings.store_logo)
      }
    } catch (error) {
      console.error("Error fetching logo:", error)
    }
  }

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <div className={cn("relative flex-shrink-0", sizeClasses[size])}>
        <Image
          src={logoUrl || "/placeholder.svg"}
          alt="ArMarZen Logo"
          fill
          className="object-contain"
          onError={() => setLogoUrl("/images/armarzen-logo.png")}
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          
          
        </div>
      )}
    </div>
  )
}
