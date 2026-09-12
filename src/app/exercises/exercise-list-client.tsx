"use client"

import { useState } from "react"
import { Database } from "@/types/database"
import { ExerciseCard } from "@/components/exercises/exercise-card"
import { FavoriteButton } from "@/components/exercises/favorite-button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { KittyLoaf } from "@/components/kitty/kitty"
import { cn } from "@/lib/utils"

type Exercise = Pick<Database["public"]["Tables"]["exercises"]["Row"], "id" | "name" | "muscle_group" | "category" | "equipment">

interface ExerciseListClientProps {
  initialExercises: Exercise[]
  favoriteExerciseIds: string[]
  userId: string
}

const CATEGORIES = ["All", "Push", "Pull", "Legs", "Core", "Cardio"]

export function ExerciseListClient({ initialExercises, favoriteExerciseIds, userId }: ExerciseListClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  const filteredExercises = initialExercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || exercise.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Sort favorites to the top
  const sortedExercises = [...filteredExercises].sort((a, b) => {
    const aIsFav = favoriteExerciseIds.includes(a.id)
    const bIsFav = favoriteExerciseIds.includes(b.id)
    if (aIsFav && !bIsFav) return -1
    if (!aIsFav && bIsFav) return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search exercises..."
          aria-label="Search exercises"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-card pl-10"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pt-1 pb-2 [scrollbar-width:none]" role="group" aria-label="Category">
        {CATEGORIES.map((category) => {
          const selected = selectedCategory === category
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              aria-pressed={selected}
              className={cn(
                "press shrink-0 rounded-full border-2 px-4 py-1.5 text-sm font-bold whitespace-nowrap",
                selected
                  ? "border-transparent bg-primary text-primary-foreground shadow-[inset_0_-3px_0_0_rgb(200_51_111/0.3)]"
                  : "border-border bg-card text-muted-foreground shadow-[inset_0_-3px_0_0_var(--lip)] hover:text-foreground"
              )}
            >
              {category}
            </button>
          )
        })}
      </div>

      <div className="grid gap-2.5">
        {sortedExercises.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-sm font-bold text-muted-foreground">
            <KittyLoaf className="w-28" />
            No exercises found.
          </div>
        ) : (
          sortedExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              actionSlot={
                <FavoriteButton
                  exerciseId={exercise.id}
                  userId={userId}
                  initialIsFavorite={favoriteExerciseIds.includes(exercise.id)}
                />
              }
            />
          ))
        )}
      </div>
    </div>
  )
}
