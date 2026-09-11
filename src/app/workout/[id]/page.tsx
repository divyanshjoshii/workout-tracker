import { requireUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ActiveWorkout } from "@/components/workout/active-workout"

export default async function WorkoutSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user } = await requireUser()

  // Both queries need only the id from the URL, so they run together. The
  // exercise rows are safe to start before ownership is confirmed: RLS on
  // workout_exercises returns nothing for a session that isn't this user's, and
  // the page bails out below before rendering anything if the session is missing.
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
    redirect("/workout")
  }

  const { split_days, ...session } = row

  return (
    <ActiveWorkout
      session={session}
      initialWorkoutExercises={(workoutExercises as any) || []}
      targetMuscles={split_days?.target_muscles ?? []}
    />
  )
}
