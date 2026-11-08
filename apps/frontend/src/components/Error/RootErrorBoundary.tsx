import { Link, useRouter } from "@tanstack/react-router"

import { DesignIcon } from "@/components/DesignIcon"
import { Button } from "@/components/ui/button"

import { ErrorLayout } from "./ErrorLayout"

export function RootErrorBoundary({ reset }: { error: unknown; reset?: () => void }) {
  const router = useRouter()
  return (
    <ErrorLayout
      chip="CHYBA SERVERU"
      isDanger
      icon="auth-222-835-IconCloudOff"
      title="Něco se pokazilo u nás"
      description="Nejde o tvou chybu. Zkus to za chvíli znovu."
      action={
        <>
          <Button
            size="lg"
            onClick={() => {
              void router.invalidate().then(() => reset?.())
            }}
          >
            <DesignIcon name="auth-222-835-IconRefresh" />
            Zkusit znovu
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
          >
            <Link to="/">Zpět do aplikace</Link>
          </Button>
        </>
      }
    />
  )
}
