export function ProgressRing({
  value,
  target,
  label,
}: {
  value: number
  target: number
  label: string
}) {
  const percent = target > 0 ? Math.min(100, Math.max(0, (value / target) * 100)) : 0
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.max(1, target)}
      aria-valuenow={Math.min(value, target)}
      className="flex size-12 items-center justify-center rounded-full p-1"
      style={{ background: `conic-gradient(var(--primary) ${percent}%, var(--secondary) 0)` }}
    >
      <span className="flex size-full items-center justify-center rounded-full bg-card text-sm font-extrabold tabular-nums">
        {target > 0 ? `${value}/${target}` : "—"}
      </span>
    </div>
  )
}
