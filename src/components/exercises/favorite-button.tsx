"use client"

import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface FavoriteButtonProps {
  exerciseId: string
  userId: string
  initialIsFavorite: boolean
}

export function FavoriteButton({ exerciseId, userId, initialIsFavorite }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  async function toggleFavorite() {
    setIsLoading(true)
    try {
      if (isFavorite) {
        // Remove favorite
        await supabase
          .from("favorite_exercises")
          .delete()
          .match({ user_id: userId, exercise_id: exerciseId })
        setIsFavorite(false)
      } else {
        // Add favorite
        await supabase
          .from("favorite_exercises")
          .insert({ user_id: userId, exercise_id: exerciseId })
        setIsFavorite(true)
      }
    } catch (error) {
      console.error("Error toggling favorite", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleFavorite}
      disabled={isLoading}
      className={cn(
        "rounded-full",
        isFavorite ? "text-strawberry [--slide:var(--accent)]" : "text-muted-foreground hover:text-strawberry"
      )}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isFavorite}
    >
      <Heart key={String(isFavorite)} className={cn("size-5", isFavorite && "animate-hop fill-primary")} />
    </Button>
  )
}
