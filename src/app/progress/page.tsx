import { requireUser } from "@/lib/supabase/server"
import { ProgressClient } from "./progress-client"
import { PageHeader } from "@/components/layout/page-header"
import { KittyFace } from "@/components/kitty/kitty"
import { Watchful } from "@/components/kitty/watchful"

export default async function ProgressPage() {
  const { supabase, user } = await requireUser()

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
    <div className="mx-auto flex max-w-md flex-col gap-5 px-4 pb-6">
      <PageHeader
        title="Progress"
        description="Track your history and gains."
        aside={
          <Watchful eyeLevel={0.6} className="w-16 shrink-0">
            <KittyFace blink className="w-full" />
          </Watchful>
        }
      />

      <ProgressClient
        sessions={sessions || []}
        weightEntries={weightEntries || []}
        weeklyExercises={weeklyExercises || []}
      />
    </div>
  )
}
