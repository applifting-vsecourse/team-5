import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { toast } from "sonner"

import { ROUTES } from "@/app/routes"
import { DesignIcon } from "@/components/DesignIcon"
import { QueryState } from "@/components/QueryState"
import { Seo } from "@/components/Seo"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import { DeleteAccountDialog } from "@/features/auth/components/DeleteAccountDialog"
import { EditAccountDialog } from "@/features/auth/components/EditAccountDialog"
import { useSession } from "@/features/auth/hooks/useSession"
import { useSignOut } from "@/features/auth/hooks/useSignOut"
import { ConnectTrainerDialog } from "@/features/client/components/ConnectTrainerDialog"
import { dogsQueryOptions } from "@/features/dog/api/dogsQueryOptions"
import { CreateDogDialog } from "@/features/dog/components/CreateDogDialog"

export const Route = createFileRoute("/_ProtectedPages/account")({ component: AccountPage })
export function AccountPage() {
  const { user } = useSession()
  const signOut = useSignOut()
  const isTrainer = user?.role === "trainer" || user?.role === "admin"
  const dogs = useQuery({ ...dogsQueryOptions(), enabled: Boolean(user) && !isTrainer })
  const ownedDogs = (dogs.data ?? []).filter((dog) => dog.ownerId === user?.id)
  const trainers = [
    ...new Map(
      ownedDogs.flatMap((dog) => dog.trainers ?? []).map((trainer) => [trainer.id, trainer]),
    ).values(),
  ]
  return (
    <>
      <Seo title="Účet" />
      <section className="mx-auto w-full max-w-2xl space-y-6 px-5 pt-6 pb-8 md:pt-8">
        <h1 className="text-2xl font-extrabold tracking-tight">Účet</h1>
        {user && (
          <>
            <section
              className="space-y-4 rounded-card border border-border bg-card p-4"
              aria-label="Profil"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-extrabold text-primary-foreground">
                  {user.name.trim().charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-extrabold break-words">{user.name}</h2>
                  <p className="text-xs break-all text-muted-foreground">{user.email}</p>
                  <p className="mt-1 inline-flex rounded-full bg-accent px-2 py-1 text-xs font-semibold text-primary">
                    {user.role === "trainer"
                      ? "Trenér"
                      : user.role === "admin"
                        ? "Administrátor"
                        : "Psovod"}
                    {!isTrainer && dogs.isSuccess
                      ? ` · ${ownedDogs.length} ${ownedDogs.length === 1 ? "pes" : ownedDogs.length >= 2 && ownedDogs.length <= 4 ? "psi" : "psů"}`
                      : ""}
                  </p>
                </div>
              </div>
              <EditAccountDialog
                mode="name"
                name={user.name}
              />
            </section>
            {!isTrainer && (
              <section
                className="space-y-3"
                aria-labelledby="account-connections"
              >
                <h2
                  id="account-connections"
                  className="text-sm font-bold text-muted-foreground"
                >
                  Propojení s trenérem
                </h2>
                <QueryState
                  isLoading={dogs.isPending}
                  error={dogs.error}
                  onRetry={() => {
                    void dogs.refetch()
                  }}
                  isEmpty={!trainers.length}
                  empty={
                    <p className="text-sm text-muted-foreground">
                      Zatím trénuješ bez trenéra. Propojit se můžeš kódem z pozvánky.
                    </p>
                  }
                >
                  {trainers.map((trainer) => (
                    <div
                      key={trainer.id}
                      className="flex items-center gap-3 rounded-card bg-hero p-5 text-hero-foreground"
                    >
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card font-extrabold text-foreground">
                        {trainer.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-hero-muted">TVŮJ TRENÉR</p>
                        <h3 className="font-extrabold break-words">{trainer.name}</h3>
                        <p className="text-xs text-hero-muted">
                          Sdílení psi:{" "}
                          {ownedDogs
                            .filter((dog) => dog.trainers?.some((item) => item.id === trainer.id))
                            .map((dog) => dog.name)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  ))}
                </QueryState>
                <ConnectTrainerDialog
                  dogs={ownedDogs}
                  email={user.email}
                  isLoading={dogs.isPending}
                  error={dogs.error}
                  onRetry={() => {
                    void dogs.refetch()
                  }}
                  createDogAction={
                    <CreateDogDialog
                      existingDogs={ownedDogs}
                      trigger={<Button variant="outline">Přidat psa</Button>}
                    />
                  }
                />
              </section>
            )}
            <section className="space-y-3 rounded-card border border-border bg-card p-4">
              <h2 className="text-sm font-bold text-muted-foreground">Tréninky</h2>
              <Button
                asChild
                variant="ghost"
                className="w-full justify-start"
              >
                <Link to={ROUTES.week}>
                  <DesignIcon name="auth-120-1291-IconTarget" />
                  Týdenní plán
                  <DesignIcon name="auth-120-1291-IconChevR" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Skutečně naplánované a dokončené tréninky najdeš v týdnu a u každého psa.
              </p>
            </section>
            <section className="space-y-2 rounded-card border border-border bg-card p-4">
              <h2 className="text-sm font-bold text-muted-foreground">Přihlášení</h2>
              <div className="divide-y divide-border">
                <EditAccountDialog
                  mode="email"
                  name={user.name}
                />
                <EditAccountDialog
                  mode="password"
                  name={user.name}
                />
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  disabled={signOut.isPending}
                  onClick={() =>
                    signOut.mutate(undefined, {
                      onError: () =>
                        toast.error("Odhlášení se nezdařilo. Zkontrolujte připojení k síti."),
                    })
                  }
                >
                  <DesignIcon name="auth-120-1291-IconLogout" />
                  {signOut.isPending ? "Odhlašuji…" : "Odhlásit se"}
                </Button>
                <DeleteAccountDialog isTrainer={user.role === "trainer"} />
              </div>
              {signOut.isError && (
                <Alert variant="destructive">
                  <AlertDescription>Odhlášení se nezdařilo. Zkus to prosím znovu.</AlertDescription>
                </Alert>
              )}
            </section>
            <Link
              to={ROUTES.privacy}
              className="inline-flex min-h-touch items-center text-sm font-medium text-primary"
            >
              Zásady zpracování osobních údajů
            </Link>
          </>
        )}
      </section>
    </>
  )
}
