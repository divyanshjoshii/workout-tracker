import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ActiveWorkout } from "@/components/workout/active-workout"

export default async function WorkoutSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch the session
  const { data: session } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("id", resolvedParams.id)
    .eq("user_id", user.id)
    .single()

  if (!session) {
    redirect("/workout")
  }

  // Fetch existing workout exercises with their sets
  const { data: workoutExercises } = await supabase
    .from("workout_exercises")
    .select(`
      *,
      exercises (*),
      workout_sets (*)
    `)
    .eq("session_id", session.id)
    .order("exercise_order", { ascending: true })

  // Fetch all exercises for the selection dialog
  const { data: allExercises } = await supabase
    .from("exercises")
    .select("*")
    .order("name", { ascending: true })

  return (
    <ActiveWorkout 
      session={session} 
      initialWorkoutExercises={(workoutExercises as any) || []} 
      allExercises={allExercises || []} 
    />
  )
}
