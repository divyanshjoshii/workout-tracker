"use client"

import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
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
        "h-8 w-8 rounded-full transition-all",
        isFavorite ? "text-yellow-400 hover:text-yellow-500 hover:bg-yellow-400/10" : "text-muted-foreground hover:text-foreground"
      )}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Star className={cn("h-5 w-5", isFavorite && "fill-current")} />
    </Button>
  )
}
