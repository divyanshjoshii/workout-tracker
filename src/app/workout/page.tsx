import { requireUser } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Play, Sparkles } from "lucide-react"
import Link from "next/link"
import { startWorkout } from "./actions"
import { ClientDateInput } from "./client-date-input"
import { TemplateList } from "@/components/workout/template-list"
import { PageHeader } from "@/components/layout/page-header"
import { KittyLift, KittyLoaf } from "@/components/kitty/kitty"
import { Watchful } from "@/components/kitty/watchful"

export default async function WorkoutStartPage() {
  const { supabase, user } = await requireUser()

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
    .order("template_order", { ascending: true })

  // We need an array of split_days sorted by order
  const splitDays = activeSplit?.split_days?.sort((a: any, b: any) => a.day_order - b.day_order) || []

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 px-4 pb-6">
      <PageHeader
        title="Start a workout"
        description="Choose a routine to begin."
        aside={
          <Watchful eyeLevel={0.5} className="w-24 shrink-0">
            <KittyLift className="w-full" />
          </Watchful>
        }
      />

      {activeSplit ? (
        <Card>
          <CardHeader>
            <CardTitle>{activeSplit.name}</CardTitle>
            <CardDescription>Your active split</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {splitDays.map((day: any) => (
              <form key={day.id} action={startWorkout.bind(null, day.id)}>
                <ClientDateInput />
                <Button type="submit" variant="outline" className="group h-16 w-full justify-start gap-3 rounded-[1.25rem] px-2.5 text-base [--slide:var(--primary)]">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary font-display text-lg text-primary-foreground">
                    {day.day_order}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-left">{day.name}</span>
                  <Play fill="currentColor" className="mr-2 size-4 text-strawberry transition-transform duration-500 ease-spring group-hover:translate-x-1" />
                </Button>
              </form>
            ))}
          </CardContent>
        </Card>
      ) : (
        <section className="tile flex items-center gap-4 p-5">
          <KittyLoaf className="w-24 shrink-0" />
          <div className="min-w-0">
            <h2 className="font-display text-heading">No active split</h2>
            <p className="mt-1 text-sm font-bold text-muted-foreground">Set one up and your days show here.</p>
            <Link href="/splits" className={buttonVariants({ size: "sm", className: "mt-3" })}>
              Go to splits
            </Link>
          </div>
        </section>
      )}

      {templates && templates.length > 0 && (
        <TemplateList initialTemplates={templates} />
      )}

      <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground" aria-hidden="true">
        <span className="h-0.5 flex-1 rounded-full bg-border" />
        or
        <span className="h-0.5 flex-1 rounded-full bg-border" />
      </div>

      <form action={startWorkout.bind(null, null)}>
        <ClientDateInput />
        <Button type="submit" size="lg" variant="secondary" className="h-16 w-full rounded-[1.25rem] text-lg">
          <Sparkles className="transition-transform duration-500 ease-spring group-hover/button:rotate-12 group-hover/button:scale-110" />
          Freestyle workout
        </Button>
      </form>
    </div>
  )
}
