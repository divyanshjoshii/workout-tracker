import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dumbbell, LogOut, Settings } from "lucide-react"
import Link from "next/link"
import { BodyWeightWidget } from "@/components/dashboard/body-weight-widget"
import { LogPastWorkout } from "@/components/dashboard/log-past-workout"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // 1. Fetch Profile Name
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single()

  const displayName = profile?.display_name || user.email?.split("@")[0] || "Athlete"

  // 2. Fetch Last Workout
  const { data: lastWorkout } = await supabase
    .from("workout_sessions")
    .select("name, created_at, duration_seconds")
    .eq("user_id", user.id)
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

  // 4. Fetch Latest Body Weight
  const { data: latestWeight } = await supabase
    .from("body_weight_entries")
    .select("weight")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(1)
    .single()

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

      {/* Main Call to Action */}
      <div className="space-y-3">
        <Link href="/workout" className="block">
          <Button className="w-full h-14 text-lg font-semibold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground">
            <Dumbbell className="mr-2 h-5 w-5" />
            Start Live Workout
          </Button>
        </Link>
        <LogPastWorkout />
      </div>

      <div className="space-y-4">
        {/* Last Workout */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Last Workout</h2>
          <Card className="border-border bg-card/50">
            <CardContent className="p-4">
              {lastWorkout ? (
                <>
                  <div className="font-bold text-lg">{lastWorkout.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {new Date(lastWorkout.created_at).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                    {lastWorkout.duration_seconds ? ` • ${Math.round(lastWorkout.duration_seconds / 60)} min` : ""}
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground py-2">No workouts completed yet. Time to hit the gym!</div>
              )}
            </CardContent>
          </Card>
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
