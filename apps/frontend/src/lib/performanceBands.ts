/** Success-rate bands from DESIGN.md → semantic performance token classes. */
export type PerformanceBand = "low" | "medium" | "high" | "top" | "empty"

export function performanceBandForRate(ratePercent: number | null | undefined): PerformanceBand {
  if (ratePercent == null || Number.isNaN(ratePercent)) return "empty"
  if (ratePercent < 50) return "low"
  if (ratePercent < 65) return "medium"
  if (ratePercent < 80) return "high"
  return "top"
}

const BAND_BG: Record<PerformanceBand, string> = {
  low: "bg-performance-low",
  medium: "bg-performance-medium",
  high: "bg-performance-high",
  top: "bg-performance-top",
  empty: "bg-performance-empty",
}

export function performanceBandClass(band: PerformanceBand): string {
  return BAND_BG[band]
}

export const PERFORMANCE_LEGEND_ITEMS: readonly {
  band: Exclude<PerformanceBand, "empty">
  label: string
}[] = [
  { band: "low", label: "pod 50 %" },
  { band: "medium", label: "50–65 %" },
  { band: "high", label: "65–80 %" },
  { band: "top", label: "80 % a víc" },
]
