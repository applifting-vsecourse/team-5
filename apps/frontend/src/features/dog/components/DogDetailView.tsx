import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ChevronLeft, Pencil } from "lucide-react"

import { HeroCard } from "@/components/HeroCard"
import { Metric } from "@/components/Metric"
import { StatusChip } from "@/components/StatusChip"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import type { Dog } from "@/features/dog/api/dogSchemas"
import { dogMetricsQueryOptions } from "@/features/dog/api/dogsQueryOptions"

import { DogActivitiesSection } from "./DogActivitiesSection"
import { DogGoalsSection } from "./DogGoalsSection"
import { DogNotesSection } from "./DogNotesSection"
import { EditDogDialog } from "./EditDogDialog"
import { DOG_COLOR_CLASSES, PesAvatar } from "./PesAvatar"
import { PlannedTrainingsList } from "./PlannedTrainingsList"

type DogDetailViewProps = {
  dog: Dog
  isOwner?: boolean
}

export function DogDetailView({ dog, isOwner = true }: DogDetailViewProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const metricsQuery = useQuery(dogMetricsQueryOptions(dog.id))

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 md:py-8">
      {/* Back button link */}
      <nav aria-label="Navigace zpět">
        {isOwner ? (
          <Link
            to="/dogs"
            className="group mb-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground outline-hidden transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Zpět na seznam psů"
          >
            <ChevronLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
            <span>Psi</span>
          </Link>
        ) : (
          <Link
            to="/clients/$clientId"
            params={{ clientId: dog.ownerId }}
            className="group mb-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground outline-hidden transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Zpět na detail klienta"
          >
            <ChevronLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
            <span>Klient</span>
          </Link>
        )}
      </nav>

      {/* Dog profile matching Figma node 51-386 */}
      <header className="mb-8 flex items-start gap-4">
        {/* 56px PesAvatar */}
        <PesAvatar
          name={dog.name}
          color={dog.color}
          size="lg"
          photoUrl={dog.photoUrl}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-page font-extrabold tracking-tight text-foreground">
              {dog.name}
            </h1>
            <span
              aria-hidden="true"
              className={cn(
                "size-3.5 shrink-0 rounded-full ring-2 ring-background",
                DOG_COLOR_CLASSES[dog.color] ?? "bg-dog-1",
              )}
            />
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Upravit psa"
                className="min-h-11 min-w-11 shrink-0"
                onClick={() => setIsEditOpen(true)}
              >
                <Pencil className="size-4" />
              </Button>
            )}
          </div>
          {dog.breed && <p className="truncate text-sm text-muted-foreground">{dog.breed}</p>}

          {dog.disciplines && dog.disciplines.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {dog.disciplines.map((discipline) => (
                <StatusChip
                  key={discipline}
                  tone="muted"
                >
                  {discipline}
                </StatusChip>
              ))}
            </div>
          )}
        </div>
      </header>

      {metricsQuery.isLoading ? (
        <Skeleton
          className="mb-8 h-28 w-full rounded-hero"
          aria-label="Načítání metrik"
        />
      ) : metricsQuery.isError ? (
        <div className="mb-8 space-y-2">
          <p className="text-sm text-muted-foreground">Týdenní metriky se nepodařilo načíst.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={() => void metricsQuery.refetch()}
          >
            Zkusit znovu
          </Button>
        </div>
      ) : metricsQuery.isSuccess ? (
        <HeroCard
          className="mb-8"
          eyebrow="Tento týden"
        >
          <div
            className={cn(
              "grid gap-3",
              metricsQuery.data.successRate !== null ? "grid-cols-3" : "grid-cols-2",
            )}
          >
            <Metric
              isOnHero
              value={`${metricsQuery.data.weeklyTrainedDays}/${metricsQuery.data.weeklyTarget}`}
              label="dní tento týden"
            />
            <Metric
              isOnHero
              value={metricsQuery.data.streak}
              label="série"
            />
            {metricsQuery.data.successRate !== null ? (
              <Metric
                isOnHero
                value={`${metricsQuery.data.successRate} %`}
                label="% úspěšnost"
              />
            ) : null}
          </div>
        </HeroCard>
      ) : null}

      {isOwner && (
        <EditDogDialog
          dog={dog}
          isOpen={isEditOpen}
          onOpenChange={setIsEditOpen}
        />
      )}

      {/* Sections: cíle, naplánováno, aktivity; notes only for the owner (#70) */}
      <div className="space-y-8">
        <DogGoalsSection
          dogId={dog.id}
          dogName={dog.name}
        />
        <Button
          asChild
          variant="outline"
          className="w-full"
        >
          <Link
            to="/dogs/$dogId/goals"
            params={{ dogId: dog.id }}
          >
            Všechny cíle
          </Link>
        </Button>
        <PlannedTrainingsList
          dogId={dog.id}
          dogName={dog.name}
        />
        <DogActivitiesSection
          dogId={dog.id}
          dogName={dog.name}
          isCompact
        />
        {isOwner ? (
          <DogNotesSection
            dogId={dog.id}
            dogName={dog.name}
          />
        ) : null}
      </div>
    </div>
  )
}
