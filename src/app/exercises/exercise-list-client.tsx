"use client"

import { useState } from "react"
import { Database } from "@/types/database"
import { ExerciseCard } from "@/components/exercises/exercise-card"
import { FavoriteButton } from "@/components/exercises/favorite-button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

type Exercise = Database["public"]["Tables"]["exercises"]["Row"]

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
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-card border-border"
        />
      </div>

      <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              selectedCategory === category
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-accent"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid gap-3 pt-2 pb-20">
        {sortedExercises.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
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
