export function ProgressRing({
  value,
  target,
  label,
  tone = "primary",
  size = "sm",
}: {
  value: number
  target: number
  label: string
  tone?: "primary" | "success"
  size?: "sm" | "lg"
}) {
  const percent = target > 0 ? Math.min(100, Math.max(0, (value / target) * 100)) : 0
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.max(1, target)}
      aria-valuenow={Math.min(value, target)}
      data-size={size}
      className="flex size-12 shrink-0 items-center justify-center rounded-full p-1 data-[size=lg]:size-18 data-[size=lg]:p-2"
      style={{
        background: `conic-gradient(var(--${tone === "success" ? "success-foreground" : "primary"}) ${percent}%, var(--secondary) 0)`,
      }}
    >
      <span className="flex size-full items-center justify-center rounded-full bg-card text-sm font-extrabold tabular-nums">
        {target > 0 ? `${value}/${target}` : "—"}
      </span>
    </div>
  )
}
