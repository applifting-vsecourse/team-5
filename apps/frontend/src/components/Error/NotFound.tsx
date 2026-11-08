import { Link } from "@tanstack/react-router"

import { DesignIcon } from "@/components/DesignIcon"
import { Button } from "@/components/ui/button"

import { ErrorLayout } from "./ErrorLayout"

export function NotFound() {
  return (
    <ErrorLayout
      chip="404"
      title="Tuhle stránku jsme nenašli"
      description="Odkaz je možná starý nebo neúplný. Tvoje tréninky jsou pořád na svém místě."
      action={
        <Button
          asChild
          size="lg"
        >
          <Link to="/">
            <DesignIcon name="auth-222-835-IconHome" />
            Zpět do aplikace
          </Link>
        </Button>
      }
    />
  )
}
