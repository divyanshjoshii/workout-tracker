import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dumbbell, LogOut, Settings, Trophy, ChevronRight, Play } from "lucide-react"
import Link from "next/link"
import { BodyWeightWidget } from "@/components/dashboard/body-weight-widget"
import { LogPastWorkout } from "@/components/dashboard/log-past-workout"
import { startWorkout, startWorkoutFromTemplate } from "@/app/workout/actions"
import { HallOfFameEditor } from "@/components/dashboard/hall-of-fame-editor"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // 1. Fetch Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, hall_of_fame")
    .eq("id", user.id)
    .single()

  const displayName = profile?.display_name || user.email?.split("@")[0] || "Athlete"

  // 2. Fetch Last Workout
  const { data: lastWorkout } = await supabase
    .from("workout_sessions")
    .select("id, name, date, created_at, duration_seconds, split_day_id")
    .eq("user_id", user.id)
    .not("duration_seconds", "is", null) // Ensure it's completed
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  // 3. Fetch Workouts This Week
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const { count: weeklyWorkouts } = await supabase
    .from("workout_sessions")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", user.id)
    .gte("created_at", oneWeekAgo.toISOString())
    .not("duration_seconds", "is", null)

  // 4. Fetch Latest Body Weight
  const { data: latestWeight } = await supabase
    .from("body_weight_entries")
    .select("weight")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(1)
    .single()

  // 5. Smart Next Workout Suggestion based on Split Schedule
  let nextSplitDay: any = null
  let matchingTemplate: any = null
  
  const { data: activeSplit } = await supabase
    .from("splits")
    .select("id, name")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()

  if (activeSplit) {
    const { data: splitDays } = await supabase
      .from("split_days")
      .select("*")
      .eq("split_id", activeSplit.id)
      .order("day_order", { ascending: true })

    if (splitDays && splitDays.length > 0) {
      if (lastWorkout && lastWorkout.split_day_id) {
        // Find what was completed last
        const lastIndex = splitDays.findIndex(d => d.id === lastWorkout.split_day_id)
        if (lastIndex !== -1) {
          nextSplitDay = splitDays[(lastIndex + 1) % splitDays.length]
        } else {
          nextSplitDay = splitDays[0] // Fallback
        }
      } else {
        nextSplitDay = splitDays[0] // Start from beginning if no history
      }
    }
  }

  // If the suggested split day has a linked template, fetch it!
  if (nextSplitDay && nextSplitDay.default_template_id) {
    const { data: templateMatch } = await supabase
      .from("workout_templates")
      .select("id, name")
      .eq("id", nextSplitDay.default_template_id)
      .single()

    if (templateMatch) {
      matchingTemplate = templateMatch
    }
  }

  // 6. Hall of Fame (Top PRs for custom selection)
  let hallOfFame: any[] = []
  const hofIds = profile?.hall_of_fame || []
  
  if (hofIds.length > 0) {
    const { data: exercises } = await supabase
      .from("exercises")
      .select("id, name")
      .in("id", hofIds)
      
    if (exercises && exercises.length > 0) {
      for (const ex of exercises) {
        const { data: weData } = await supabase
          .from("workout_exercises")
          .select("id")
          .eq("exercise_id", ex.id)
        
        let pr = { weight: 0, reps: 0 }
        
        if (weData && weData.length > 0) {
          const weIds = weData.map(w => w.id)
          const { data: prData } = await supabase
            .from("workout_sets")
            .select("weight, reps")
            .in("workout_exercise_id", weIds)
            .not("weight", "is", null)
            .order("weight", { ascending: false })
            .limit(1)
          
          if (prData && prData.length > 0) {
            pr = prData[0]
          }
        }
        
        hallOfFame.push({ id: ex.id, name: ex.name, pr: pr })
      }
    }
  }

  // Fetch all exercises for the editor
  const { data: allExercises } = await supabase
    .from("exercises")
    .select("id, name, muscle_group")
    .order("name", { ascending: true })

  return (
    <div className="flex flex-col p-4 space-y-6 max-w-lg mx-auto pb-24">
      {/* Header */}
      <header className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back, {displayName}!</p>
        </div>
        <form action="/auth/signout" method="post">
          <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </form>
      </header>

      {/* Hall of Fame */}
      <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h2 className="font-bold text-sm text-yellow-600 dark:text-yellow-500 uppercase tracking-wider">Hall of Fame</h2>
            </div>
            <HallOfFameEditor allExercises={allExercises || []} currentSelections={hofIds} />
          </div>
          <div className="space-y-2">
            {hallOfFame.length > 0 ? hallOfFame.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-background/50 rounded-md p-2 px-3">
                  <span className="font-medium text-sm truncate pr-2">{item.name}</span>
                  <span className="font-mono font-bold text-primary shrink-0">
                    {item.pr.weight > 0 ? (
                      <>{item.pr.weight}kg <span className="text-muted-foreground font-sans text-xs font-normal">x{item.pr.reps}</span></>
                    ) : (
                      <span className="text-muted-foreground font-sans text-xs font-normal">-</span>
                    )}
                  </span>
                </div>
            )) : (
              <div className="text-sm text-yellow-700/70 dark:text-yellow-500/70 py-2 text-center">
                Click the edit icon to pick your top 3 exercises!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Call to Action */}
      <div className="space-y-4">
        {nextSplitDay && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Suggested</h2>
            <form action={matchingTemplate ? startWorkoutFromTemplate.bind(null, matchingTemplate.id, nextSplitDay.id) : startWorkout.bind(null, nextSplitDay.id)} className="block">
              <Button type="submit" className="w-full h-16 text-lg font-bold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="flex items-center text-sm font-medium opacity-90 uppercase tracking-widest mb-0.5">
                  <Play className="w-3.5 h-3.5 mr-1" fill="currentColor" /> Up Next
                </span>
                <span>{nextSplitDay.name} {matchingTemplate && "(Template)"}</span>
              </Button>
            </form>
          </div>
        )}
        
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Manual</h2>
          <Link href="/workout" className="block">
            <Button variant="outline" className="w-full h-14 text-lg font-semibold shadow-sm border-border bg-card hover:bg-accent">
              <Dumbbell className="mr-2 h-5 w-5 text-primary" />
              Select Template or Freestyle
            </Button>
          </Link>
          <LogPastWorkout />
        </div>
      </div>

      <div className="space-y-4">
        {/* Clickable Last Workout */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Last Workout</h2>
          {lastWorkout ? (
            <Link href={`/workout/${lastWorkout.id}/edit`} className="block group">
              <Card className="border-border bg-card/50 hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-lg group-hover:text-primary transition-colors">{lastWorkout.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {new Date(lastWorkout.date + 'T12:00:00Z').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      {lastWorkout.duration_seconds ? ` • ${Math.round(lastWorkout.duration_seconds / 60)} min` : ""}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
          ) : (
            <Card className="border-border bg-card/50">
              <CardContent className="p-4 text-muted-foreground py-2">
                No workouts completed yet. Time to hit the gym!
              </CardContent>
            </Card>
          )}
        </div>

        {/* Mini Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-border bg-card">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="text-sm font-medium text-muted-foreground mb-4">This Week</div>
              <div>
                <div className="text-3xl font-bold text-primary">{weeklyWorkouts || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Workouts</div>
              </div>
            </CardContent>
          </Card>
          
          <BodyWeightWidget latestWeight={latestWeight?.weight || null} />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <Link href="/splits">
            <Button variant="outline" className="w-full border-border bg-card hover:bg-accent text-foreground">
              <Settings className="w-4 h-4 mr-2 text-muted-foreground" />
              Manage Splits
            </Button>
          </Link>
          <Link href="/progress">
            <Button variant="outline" className="w-full border-border bg-card hover:bg-accent text-foreground">
              View History
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
