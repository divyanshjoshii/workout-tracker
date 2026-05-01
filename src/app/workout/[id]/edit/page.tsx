import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { EditWorkout } from "@/components/workout/edit-workout"

export default async function EditWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // 1. Fetch Session
  const { data: session } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("id", resolvedParams.id)
    .eq("user_id", user.id)
    .single()

  if (!session) {
    notFound()
  }

  let targetMuscles: string[] = []
  if (session.split_day_id) {
    const { data: splitDay } = await supabase
      .from("split_days")
      .select("target_muscles")
      .eq("id", session.split_day_id)
      .single()
    if (splitDay && splitDay.target_muscles) {
      targetMuscles = splitDay.target_muscles
    }
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
      targetMuscles={targetMuscles}
    />
  )
}
