import { requireUser } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { EditWorkout } from "@/components/workout/edit-workout"

export default async function EditWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user } = await requireUser()

  // Same shape as the active workout page: both queries need only the id, and
  // RLS keeps the exercise rows empty for anyone who doesn't own the session.
  const [{ data: row }, { data: workoutExercises }] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("*, split_days(target_muscles)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("workout_exercises")
      .select("*, exercises(*), workout_sets(*)")
      .eq("session_id", id)
      .order("exercise_order", { ascending: true }),
  ])

  if (!row) {
    notFound()
  }

  const { split_days, ...session } = row

  return (
    <EditWorkout
      session={session}
      initialWorkoutExercises={(workoutExercises as any) || []}
      targetMuscles={split_days?.target_muscles ?? []}
    />
  )
}
