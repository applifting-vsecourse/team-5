import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { ChevronLeft, Pencil } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { Dog } from "@/features/dog/api/dogSchemas"

import { DogActivitiesSection } from "./DogActivitiesSection"
import { DogGoalsSection } from "./DogGoalsSection"
import { EditDogDialog } from "./EditDogDialog"
import { DOG_COLOR_CLASSES, PesAvatar } from "./PesAvatar"

type DogDetailViewProps = {
  dog: Dog
  isOwner?: boolean
}

export function DogDetailView({ dog, isOwner = true }: DogDetailViewProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)

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
            <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">
              {dog.name}
            </h1>
            <span
              aria-hidden="true"
              className={cn(
                "size-3.5 shrink-0 rounded-full shadow-2xs ring-2 ring-background",
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
                <Badge
                  key={discipline}
                  variant="secondary"
                >
                  {discipline}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </header>

      {isOwner && (
        <EditDogDialog
          dog={dog}
          isOpen={isEditOpen}
          onOpenChange={setIsEditOpen}
        />
      )}

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
