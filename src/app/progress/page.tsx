import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProgressClient } from "./progress-client"

export default async function ProgressPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch workout sessions
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)

  // Fetch body weight entries
  const { data: weightEntries } = await supabase
    .from("body_weight_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(30) // last 30 entries

  // Fetch exercises performed this week
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const { data: weeklyExercises } = await supabase
    .from("workout_exercises")
    .select(`
      id,
      exercise_id,
      exercises (id, name, muscle_group, category, image_url),
      workout_sessions!inner (id, name, split_day_id, created_at, user_id)
    `)
    .eq("workout_sessions.user_id", user.id)
    .gte("workout_sessions.created_at", oneWeekAgo.toISOString())

  return (
    <div className="flex flex-col p-4 space-y-6 max-w-lg mx-auto pb-24">
      <header className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
          <p className="text-muted-foreground text-sm">Track your history and gains</p>
        </div>
      </header>

      <ProgressClient 
        sessions={sessions || []} 
        weightEntries={weightEntries || []} 
        weeklyExercises={weeklyExercises || []}
      />
    </div>
  )
}
