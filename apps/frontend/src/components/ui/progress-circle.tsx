import * as React from "react"

import { cn } from "@/lib/utils"

export type ProgressCircleProps = {
  value: number | null | undefined
  max?: number
  size?: "sm" | "md" | "lg"
  strokeWidth?: number
  showValue?: boolean
  className?: string
  indicatorClassName?: string
  children?: React.ReactNode
}

const SIZE_CONFIG = {
  sm: { dimension: 40, strokeWidth: 4, textSize: "text-[10px]" },
  md: { dimension: 56, strokeWidth: 5, textSize: "text-xs font-semibold" },
  lg: { dimension: 80, strokeWidth: 7, textSize: "text-base font-bold" },
}

export function ProgressCircle({
  value,
  max = 100,
  size = "md",
  strokeWidth,
  showValue = false,
  className,
  indicatorClassName,
  children,
}: ProgressCircleProps) {
  const safeValue = value ?? 0
  const percentage = Math.min(Math.max(0, Math.round((safeValue / max) * 100)), 100)
  const config = SIZE_CONFIG[size]
  const actualStroke = strokeWidth ?? config.strokeWidth
  const radius = (config.dimension - actualStroke) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn("relative inline-flex items-center justify-center select-none", className)}
      style={{ width: config.dimension, height: config.dimension }}
    >
      <svg
        className="size-full -rotate-90 transform"
        viewBox={`0 0 ${config.dimension} ${config.dimension}`}
      >
        {/* Track */}
        <circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={radius}
          className="stroke-muted"
          strokeWidth={actualStroke}
          fill="none"
        />
        {/* Indicator */}
        <circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={radius}
          className={cn("stroke-primary transition-all duration-500 ease-out", indicatorClassName)}
          strokeWidth={actualStroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children ? (
          children
        ) : showValue ? (
          <span className={cn("text-foreground", config.textSize)}>{percentage}%</span>
        ) : null}
      </div>
    </div>
  )
}
