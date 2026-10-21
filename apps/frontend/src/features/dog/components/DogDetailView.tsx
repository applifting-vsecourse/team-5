import { Link } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"

import type { Dog } from "@/features/dog/api/dogSchemas"

import { DogActivitiesSection } from "./DogActivitiesSection"
import { DogGoalsSection } from "./DogGoalsSection"
import { PesAvatar } from "./PesAvatar"

type DogDetailViewProps = {
  dog: Dog
}

export function DogDetailView({ dog }: DogDetailViewProps) {
  const disciplinesText =
    dog.disciplines && dog.disciplines.length > 0 ? dog.disciplines.join(", ") : undefined

  const subtitle = [dog.breed, disciplinesText].filter(Boolean).join(" · ")

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 md:py-8">
      {/* Back button link to /dogs */}
      <nav aria-label="Navigace zpět">
        <Link
          to="/dogs"
          className="group mb-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground outline-hidden transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Zpět na seznam psů"
        >
          <ChevronLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
          <span>Psi</span>
        </Link>
      </nav>

      {/* Dog profile matching Figma node 51-386 */}
      <header className="mb-8 flex items-center gap-4">
        {/* 56px PesAvatar */}
        <PesAvatar
          name={dog.name}
          color={dog.color}
          size="lg"
        />

        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">{dog.name}</h1>
          {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </header>

      {/* Sections: Aktivní cíle + Aktivity */}
      <div className="space-y-8">
        <DogGoalsSection
          dogId={dog.id}
          dogName={dog.name}
        />
        <DogActivitiesSection
          dogId={dog.id}
          dogName={dog.name}
        />
      </div>
    </div>
  )
}
