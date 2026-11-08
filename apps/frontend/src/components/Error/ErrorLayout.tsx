import type { ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouterState } from "@tanstack/react-router"

import { AppSidebar } from "@/components/AppSidebar"
import { AuthBrand } from "@/components/AuthLayout"
import { BottomNav } from "@/components/BottomNav/BottomNav"
import { DesignIcon } from "@/components/DesignIcon"
import { authKeys } from "@/lib/auth-keys"

type Props = {
  title: string
  description?: ReactNode
  action?: ReactNode
  chip?: string
  icon?: string
  isDanger?: boolean
}
export function ErrorLayout({
  title,
  description,
  action,
  chip,
  icon = "auth-222-835-IconCompass",
  isDanger = false,
}: Props) {
  const { data: session } = useQuery<{ user: { name: string; role?: string } } | null>({
    queryKey: authKeys.session(),
    enabled: false,
  })
  const user = session?.user
  const hasProtectedLayout = useRouterState({
    select: (state) =>
      state.matches.some(
        (match) => match.routeId === "/_ProtectedPages" && match.status === "success",
      ),
  })
  const isTrainer = user?.role === "trainer" || user?.role === "admin"
  const content = (
    <div className="public-flow mx-auto w-full max-w-md px-5 py-6">
      <section className="flex flex-col items-center gap-3.5 rounded-hero border border-border bg-card p-6 text-center">
        {chip && (
          <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-extrabold">
            {chip}
          </span>
        )}
        <span
          className={`flex size-24 items-center justify-center rounded-full ${isDanger ? "bg-danger-surface" : "bg-accent"}`}
        >
          <span
            className={`flex size-15 items-center justify-center rounded-full ${isDanger ? "bg-destructive" : "bg-primary"}`}
          >
            <DesignIcon name={icon} />
          </span>
        </span>
        <h1 className="text-brand font-extrabold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
        {action && <div className="flex w-full flex-col gap-2.5">{action}</div>}
      </section>
    </div>
  )
  if (hasProtectedLayout) return content
  return (
    <div className="min-h-svh md:flex">
      {user ? (
        <AppSidebar
          user={{ name: user.name }}
          isTrainer={isTrainer}
        />
      ) : null}
      <main className="min-w-0 flex-1 pb-24">
        {!user && (
          <div className="mx-auto max-w-md px-5 pt-6">
            <AuthBrand />
          </div>
        )}
        {content}
      </main>
      {user && <BottomNav isTrainer={isTrainer} />}
    </div>
  )
}
