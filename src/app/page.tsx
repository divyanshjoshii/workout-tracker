import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dumbbell, Plus } from "lucide-react"
import { revalidatePath } from "next/cache"

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  async function signOut() {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath("/")
    redirect("/login")
  }

  return (
    <div className="flex flex-col p-4 space-y-6 max-w-lg mx-auto">
      <header className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back!</p>
        </div>
        <form action={signOut}>
          <Button variant="outline" size="sm" type="submit">Logout</Button>
        </form>
      </header>

      <Button size="lg" className="w-full text-lg h-14 font-semibold shadow-md">
        <Dumbbell className="mr-2 h-6 w-6" /> Start Workout
      </Button>

      <div className="grid gap-4">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Workout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">Push Day</div>
            <p className="text-xs text-muted-foreground mt-1">Bench Press: 45kg × 8</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">3</div>
              <p className="text-xs text-muted-foreground mt-1">Workouts</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Body Weight</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">48.5<span className="text-sm font-normal text-muted-foreground ml-1">kg</span></div>
              <p className="text-xs text-muted-foreground mt-1">Latest entry</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
