import { Loader2 } from "lucide-react"

export function AppLoadingScreen() {
  return (
    <div
      role="status"
      aria-label="Načítám aplikaci"
      aria-busy="true"
      className="grid min-h-svh place-content-center gap-4 bg-background text-center"
    >
      <Loader2
        aria-hidden="true"
        className="mx-auto size-8 animate-spin text-primary"
      />
      <p className="text-sm text-muted-foreground">Načítám aplikaci…</p>
    </div>
  )
}
