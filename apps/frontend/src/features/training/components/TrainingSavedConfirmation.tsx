import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Check } from "lucide-react"

import { Metric } from "@/components/Metric"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { dogMetricsQueryOptions } from "@/lib/dogMetrics"

import { trainingDetailQueryOptions } from "@/features/training/api/trainingsQueryOptions"

type TrainingSavedConfirmationProps = {
  trainingId: string
}

export function TrainingSavedConfirmation({ trainingId }: TrainingSavedConfirmationProps) {
  const trainingQuery = useQuery(trainingDetailQueryOptions(trainingId))
  const dogId = trainingQuery.data?.dog.id ?? ""
  const metricsQuery = useQuery({
    ...dogMetricsQueryOptions(dogId),
    enabled: Boolean(dogId),
  })

  if (trainingQuery.isLoading) {
    return (
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-2xl flex-col gap-6 bg-background px-4 py-8">
        <Skeleton className="mx-auto size-14 rounded-full" />
        <Skeleton className="mx-auto h-8 w-56" />
        <Skeleton className="mx-auto h-5 w-40" />
        <Skeleton className="h-24 w-full rounded-card" />
        <Skeleton className="mt-auto h-11 w-full rounded-md" />
      </div>
    )
  }

  const dogName = trainingQuery.data?.dog.name
  const dogIdForLink = trainingQuery.data?.dog.id
  const metrics = metricsQuery.isSuccess ? metricsQuery.data : undefined

  return (
    <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-2xl flex-col bg-background px-4 py-8">
      <div className="flex flex-1 flex-col items-center gap-6 text-center">
        <div
          className="flex size-14 items-center justify-center rounded-full bg-success text-success-foreground"
          aria-hidden
        >
          <Check className="size-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Záznam byl uložen
          </h1>
          <p className="text-base text-muted-foreground">
            {dogName ? `Trénink u ${dogName} je zaznamenaný.` : "Trénink je zaznamenaný."}
          </p>
        </div>

        {metrics ? (
          <div className="grid w-full grid-cols-2 gap-4 rounded-card border border-border bg-card p-4 text-card-foreground">
            <Metric
              value={`${metrics.weeklyTrainedDays}/${metrics.weeklyTarget}`}
              label="týdenní cíl"
            />
            <Metric
              value={metrics.streak}
              label="série"
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 pt-8">
        <Button
          asChild
          className="min-h-11 w-full text-base"
        >
          <Link to="/week">Zpět na týden</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="min-h-11 w-full text-base"
        >
          <Link to="/dashboard">Na přehled</Link>
        </Button>
        {dogIdForLink ? (
          <Button
            asChild
            variant="ghost"
            className="min-h-11 w-full text-base"
          >
            <Link
              to="/dogs/$dogId"
              params={{ dogId: dogIdForLink }}
            >
              {dogName ? `Profil ${dogName}` : "Profil psa"}
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  )
}
