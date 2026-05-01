import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { EditWorkout } from "@/components/workout/edit-workout"

export default async function EditWorkoutPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // 1. Fetch Session
  const { data: session } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (!session) {
    notFound()
  }

  // 2. Fetch Workout Exercises with Sets
  const { data: workoutExercises } = await supabase
    .from("workout_exercises")
    .select(`
      *,
      exercises (*),
      workout_sets (*)
    `)
    .eq("session_id", session.id)
    .order("exercise_order", { ascending: true })

  // 3. Fetch All Exercises for search/add
  const { data: allExercises } = await supabase
    .from("exercises")
    .select("*")
    .order("name")

  return (
    <EditWorkout 
      session={session} 
      initialWorkoutExercises={workoutExercises as any} 
      allExercises={allExercises || []} 
    />
  )
}
