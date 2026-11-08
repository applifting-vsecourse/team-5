import type { ReactNode } from "react"
import { Link } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"
import { DesignIcon } from "@/components/DesignIcon"
import { Button } from "@/components/ui/button"

export function AuthBrand() {
  return (
    <Link
      to={ROUTES.home}
      className="inline-flex min-h-touch items-center gap-2.5 text-brand font-extrabold"
      aria-label="TrainLoop – úvodní stránka"
    >
      <span className="flex size-10 items-center justify-center rounded-brand bg-primary">
        <DesignIcon name="auth-141-1520-IconPaw" />
      </span>
      TrainLoop
    </Link>
  )
}

type AuthLayoutProps = {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
  icon?: string
  hasBrand?: boolean
  shouldHideBack?: boolean
}

export function AuthLayout({
  title,
  description,
  children,
  footer,
  icon,
  hasBrand = false,
  shouldHideBack = false,
}: AuthLayoutProps) {
  return (
    <main className="public-flow min-h-svh bg-background">
      <section className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 pt-3 pb-10 md:pt-12">
        {hasBrand ? (
          <div className="-mb-1 pt-10">
            <AuthBrand />
          </div>
        ) : (
          !shouldHideBack && (
            <Button
              asChild
              variant="outline"
              size="icon"
              className="rounded-field"
            >
              <Link
                to={ROUTES.login}
                aria-label="Zpět"
              >
                <DesignIcon name="auth-235-1019-IconChevL" />
              </Link>
            </Button>
          )
        )}
        {title && (
          <header className={hasBrand ? "space-y-1.5" : "space-y-4"}>
            {icon && (
              <div className="flex size-18 items-center justify-center rounded-hero bg-accent">
                <DesignIcon name={icon} />
              </div>
            )}
            <h1
              className={
                hasBrand
                  ? "text-dog-name font-extrabold tracking-tight"
                  : "text-3xl font-extrabold tracking-tight"
              }
            >
              {title}
            </h1>
            {description && (
              <p className="text-public-body leading-normal font-medium text-muted-foreground">
                {description}
              </p>
            )}
          </header>
        )}
        {children}
        {footer && <div className="text-center text-sm text-muted-foreground">{footer}</div>}
      </section>
    </main>
  )
}
