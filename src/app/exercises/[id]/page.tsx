import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ArrowLeft, Dumbbell, Activity, Target } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FavoriteButton } from "@/components/exercises/favorite-button"

export default async function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: exercise } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", resolvedParams.id)
    .single()

  if (!exercise) {
    redirect("/exercises")
  }

  const { data: favorite } = await supabase
    .from("favorite_exercises")
    .select("*")
    .eq("user_id", user.id)
    .eq("exercise_id", exercise.id)
    .single()

  const isFavorite = !!favorite

  return (
    <div className="flex flex-col bg-background min-h-screen pb-20">
      {/* Header Image Placeholder / Gradient */}
      <div className="h-48 w-full bg-gradient-to-b from-primary/20 to-background flex items-end p-4 relative">
        <Link href="/exercises" className="absolute top-4 left-4">
          <Button variant="secondary" size="icon" className="rounded-full bg-background/50 backdrop-blur-md border-border">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="absolute top-4 right-4 bg-background/50 backdrop-blur-md rounded-full p-1 border border-border">
          <FavoriteButton exerciseId={exercise.id} userId={user.id} initialIsFavorite={isFavorite} />
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto w-full -mt-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{exercise.name}</h1>
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center text-sm font-medium bg-secondary/20 text-secondary px-3 py-1.5 rounded-full border border-secondary/30">
              <Target className="w-4 h-4 mr-2" />
              {exercise.muscle_group}
            </div>
            <div className="flex items-center text-sm font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20">
              <Activity className="w-4 h-4 mr-2" />
              {exercise.category}
            </div>
            {exercise.equipment && (
              <div className="flex items-center text-sm font-medium bg-accent text-accent-foreground px-3 py-1.5 rounded-full border border-border">
                <Dumbbell className="w-4 h-4 mr-2" />
                {exercise.equipment}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-border">
          <h2 className="text-lg font-semibold text-foreground">Instructions</h2>
          <p className="text-muted-foreground leading-relaxed">
            {exercise.instructions || "No instructions provided for this exercise."}
          </p>
        </div>
        
        <div className="pt-6">
          <Button className="w-full h-12 text-base font-semibold shadow-md">
            Add to Workout
          </Button>
        </div>
      </div>
    </div>
  )
}
