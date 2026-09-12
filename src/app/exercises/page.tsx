import { requireUser } from "@/lib/supabase/server"
import { ExerciseListClient } from "./exercise-list-client"

export default async function ExercisesPage() {
  const { supabase, user } = await requireUser()

  // Fetch all exercises
  const { data: exercises } = await supabase
    .from("exercises")
    // Only what the list shows. select("*") also sent every exercise's
    // instructions, most of the payload, which this screen never displays.
    .select("id, name, muscle_group, category, equipment")
    .order("name")

  // Fetch user's favorite exercises
  const { data: favorites } = await supabase
    .from("favorite_exercises")
    .select("exercise_id")
    .eq("user_id", user.id)

  const favoriteIds = favorites?.map(f => f.exercise_id) || []

  return (
    <div className="flex flex-col p-4 max-w-lg mx-auto">
      <header className="py-4">
        <h1 className="text-2xl font-bold tracking-tight">Exercises</h1>
        <p className="text-muted-foreground text-sm">Browse and manage your exercises</p>
      </header>

      <ExerciseListClient 
        initialExercises={exercises || []} 
        favoriteExerciseIds={favoriteIds}
        userId={user.id}
      />
    </div>
  )
}
