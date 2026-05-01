import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dumbbell, Plus, Copy } from "lucide-react"
import Link from "next/link"
import { startWorkout, startWorkoutFromTemplate } from "./actions"
import { ClientDateInput } from "./client-date-input"

export default async function WorkoutStartPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch active split
  const { data: activeSplit } = await supabase
    .from("splits")
    .select(`
      *,
      split_days (*)
    `)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()

  // Fetch all templates
  const { data: templates } = await supabase
    .from("workout_templates")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // We need an array of split_days sorted by order
  const splitDays = activeSplit?.split_days?.sort((a: any, b: any) => a.day_order - b.day_order) || []

  return (
    <div className="flex flex-col p-4 space-y-6 max-w-lg mx-auto pb-24">
      <header className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Start Workout</h1>
          <p className="text-muted-foreground text-sm">Choose a routine to begin</p>
        </div>
      </header>

      {activeSplit ? (
        <Card className="border-border bg-card shadow-sm border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary flex items-center">
              <Dumbbell className="mr-2 h-5 w-5" />
              {activeSplit.name}
            </CardTitle>
            <CardDescription>Your currently active split</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {splitDays.map((day: any) => (
              <form key={day.id} action={startWorkout.bind(null, day.id)}>
                <ClientDateInput />
                <Button type="submit" variant="outline" className="w-full justify-between h-14 text-lg font-medium border-border hover:bg-primary hover:text-primary-foreground hover:border-primary">
                  <span>Day {day.day_order}: {day.name}</span>
                  <Plus className="h-5 w-5 opacity-50" />
                </Button>
              </form>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-border bg-card/50">
          <CardHeader>
            <CardTitle>No Active Split</CardTitle>
            <CardDescription>You haven't set an active split yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/splits">
              <Button className="w-full">Go to Splits</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {templates && templates.length > 0 && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Your Templates</span>
            </div>
          </div>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-primary flex items-center">
                <Copy className="mr-2 h-5 w-5" />
                Saved Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.map((template: any) => (
                <form key={template.id} action={startWorkoutFromTemplate.bind(null, template.id)}>
                  <ClientDateInput />
                  <Button type="submit" variant="outline" className="w-full justify-between h-14 text-lg font-medium border-border hover:bg-primary hover:text-primary-foreground hover:border-primary">
                    <span>{template.name}</span>
                    <Plus className="h-5 w-5 opacity-50" />
                  </Button>
                </form>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      <div className="relative mt-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <form action={startWorkout.bind(null, null)}>
        <ClientDateInput />
        <Button type="submit" size="lg" variant="secondary" className="w-full text-lg h-14 font-semibold">
          Freestyle Workout
        </Button>
      </form>
    </div>
  )
}
