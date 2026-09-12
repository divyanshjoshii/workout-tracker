import { requireUser } from "@/lib/supabase/server"
import { ExerciseListClient } from "./exercise-list-client"
import { PageHeader } from "@/components/layout/page-header"
import { KittyFace } from "@/components/kitty/kitty"
import { Watchful } from "@/components/kitty/watchful"

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
    <div className="mx-auto flex max-w-md flex-col gap-5 px-4 pb-6">
      <PageHeader
        title="Exercises"
        description="Browse and manage your exercises."
        aside={
          <Watchful eyeLevel={0.6} className="w-16 shrink-0">
            <KittyFace blink className="w-full" />
          </Watchful>
        }
      />

      <ExerciseListClient
        initialExercises={exercises || []}
        favoriteExerciseIds={favoriteIds}
        userId={user.id}
      />
    </div>
  )
}
