import { requireUser } from "@/lib/supabase/server"
import { Button, buttonVariants } from "@/components/ui/button"
import { BookHeart, CalendarRange, ChevronRight, Dumbbell, Play } from "lucide-react"
import Link from "next/link"
import { BodyWeightWidget } from "@/components/dashboard/body-weight-widget"
import { LogPastWorkout } from "@/components/dashboard/log-past-workout"
import { startWorkout, startWorkoutFromTemplate } from "@/app/workout/actions"
import { HallOfFameEditor } from "@/components/dashboard/hall-of-fame-editor"
import { KittyClock } from "@/components/dashboard/kitty-clock"
import { AppIcon } from "@/components/dashboard/app-icon"
import { Bow, KittyFace, KittyLift, KittyLoaf, Paw } from "@/components/kitty/kitty"
import { Watchful } from "@/components/kitty/watchful"
import { CalendarLeaf } from "@/components/layout/calendar-leaf"
import { cn } from "@/lib/utils"

// One ribbon colour per hall of fame entry.
const RIBBONS = ["var(--kitty-bow)", "#8CC4F2", "#FFD166"]

export default async function DashboardPage() {
  const { supabase, user } = await requireUser()

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  // Round 1. Everything that needs nothing but user.id, so it all goes at once.
  // These were sequential awaits and cost one round trip each.
  const [
    { data: profile },
    { data: lastWorkout },
    { count: weeklyWorkouts },
    { data: latestWeight },
    { data: activeSplit },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, hall_of_fame")
      .eq("id", user.id)
      .single(),
    supabase
      .from("workout_sessions")
      .select("id, name, date, created_at, duration_seconds, split_day_id")
      .eq("user_id", user.id)
      .not("duration_seconds", "is", null) // Ensure it's completed
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("workout_sessions")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", user.id)
      .gte("created_at", oneWeekAgo.toISOString())
      .not("duration_seconds", "is", null),
    supabase
      .from("body_weight_entries")
      .select("weight")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("splits")
      .select("id, name")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single(),
  ])

  const displayName = profile?.display_name || user.email?.split("@")[0] || "Athlete"
  const hofIds: string[] = profile?.hall_of_fame || []

  let nextSplitDay: any = null
  let matchingTemplate: any = null

  // Round 2. Split days and the hall of fame do not depend on each other.
  // Each hall of fame entry asks for its single heaviest set rather than every
  // set ever recorded.
  const [{ data: splitDays }, { data: hofNames }, ...hofPrs] = await Promise.all([
    activeSplit
      ? supabase
          .from("split_days")
          .select("*")
          .eq("split_id", activeSplit.id)
          .order("day_order", { ascending: true })
      : Promise.resolve({ data: null as any }),
    hofIds.length > 0
      ? supabase.from("exercises").select("id, name").in("id", hofIds)
      : Promise.resolve({ data: [] as any[] }),
    ...hofIds.map((id) =>
      supabase
        .from("workout_sets")
        .select("weight, reps, workout_exercises!inner(exercise_id)")
        .eq("workout_exercises.exercise_id", id)
        .not("weight", "is", null)
        .order("weight", { ascending: false })
        .limit(1)
        .maybeSingle()
    ),
  ])

  const hallOfFame = hofIds.map((id, i) => {
    const name = (hofNames ?? []).find((e: any) => e.id === id)?.name ?? ""
    const best = (hofPrs[i] as any)?.data
    return {
      id,
      name,
      pr: best ? { weight: best.weight, reps: best.reps } : { weight: 0, reps: 0 },
    }
  }).filter((x) => x.name)

  if (activeSplit) {
    if (splitDays && splitDays.length > 0) {
      if (lastWorkout && lastWorkout.split_day_id) {
        // Find what was completed last
        const lastIndex = splitDays.findIndex((d: any) => d.id === lastWorkout.split_day_id)
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

  const workoutsThisWeek = weeklyWorkouts || 0

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-4 pb-6">
      {/* The kitty on the clock sits in the header's right-hand space. */}
      <header className="flex h-24 items-end pb-4">
        <h1 className="max-w-[62%] font-display text-title">Hi, {displayName}</h1>
      </header>

      <KittyClock />

      {nextSplitDay ? (
        <section className="tile relative overflow-hidden border-[rgb(200_51_111/0.2)] bg-primary text-primary-foreground shadow-[inset_0_-4px_0_0_rgb(200_51_111/0.28),0_10px_24px_-14px_var(--shadow)]">
          <div className="relative z-10 flex flex-col p-5 pr-36">
            <h2 className="font-display text-title">{nextSplitDay.name}</h2>
            <p className="mt-1 text-sm font-bold opacity-80">
              Up next in {activeSplit?.name}
              {matchingTemplate && <> · {matchingTemplate.name}</>}
            </p>
            <form
              action={matchingTemplate ? startWorkoutFromTemplate.bind(null, matchingTemplate.id, nextSplitDay.id) : startWorkout.bind(null, nextSplitDay.id)}
              className="mt-4"
            >
              <Button type="submit" variant="outline" size="lg" className="rounded-full border-transparent pr-6 pl-5">
                <Play fill="currentColor" className="transition-transform duration-500 ease-spring group-hover/button:scale-125" />
                Start workout
              </Button>
            </form>
          </div>
          <Watchful eyeLevel={0.5} className="absolute right-3 bottom-4 w-32">
            <KittyLift className="w-full" />
          </Watchful>
        </section>
      ) : (
        <section className="tile relative overflow-hidden border-[rgb(200_51_111/0.2)] bg-primary text-primary-foreground shadow-[inset_0_-4px_0_0_rgb(200_51_111/0.28),0_10px_24px_-14px_var(--shadow)]">
          <div className="relative z-10 flex flex-col p-5 pr-36">
            <h2 className="font-display text-title">Ready when you are</h2>
            <p className="mt-1 text-sm font-bold opacity-80">Pick a template or go freestyle.</p>
            <Link href="/workout" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "mt-4 w-fit rounded-full border-transparent pr-6 pl-5")}>
              <Play fill="currentColor" />
              Start a workout
            </Link>
          </div>
          <Watchful eyeLevel={0.5} className="absolute right-3 bottom-4 w-32">
            <KittyLift className="w-full" />
          </Watchful>
        </section>
      )}

      <nav aria-label="Shortcuts" className="grid grid-cols-4 gap-3 px-1 py-1">
        <AppIcon href="/workout" label="Templates" icon={Dumbbell} tone="bg-primary text-primary-foreground" />
        <LogPastWorkout />
        <AppIcon href="/splits" label="Splits" icon={CalendarRange} tone="bg-sky text-sky-foreground" />
        <AppIcon href="/progress" label="History" icon={BookHeart} tone="bg-mint text-mint-foreground" />
      </nav>

      <div className="grid grid-cols-2 gap-4">
        <section className="tile flex flex-col bg-butter p-4 text-butter-foreground">
          <h2 className="font-display text-base">This week</h2>
          <p className="mt-3 flex items-baseline gap-1.5">
            <span className="font-display text-stat tabular-nums">{workoutsThisWeek}</span>
            <span className="text-sm font-bold">{workoutsThisWeek === 1 ? "workout" : "workouts"}</span>
          </p>
          <div aria-hidden="true" className="mt-auto flex gap-0.5 pt-3">
            {Array.from({ length: 7 }, (_, i) => (
              <Paw key={i} filled={i < workoutsThisWeek} className={cn("size-4", i >= workoutsThisWeek && "opacity-40")} />
            ))}
          </div>
        </section>

        <BodyWeightWidget latestWeight={latestWeight?.weight || null} />
      </div>

      <section className="tile p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-heading">Hall of fame</h2>
          <HallOfFameEditor currentSelections={hofIds} />
        </div>
        {hallOfFame.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2">
            {hallOfFame.map((item, idx) => (
              <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-muted/70 py-2.5 pr-4 pl-3">
                <Bow color={RIBBONS[idx % RIBBONS.length]} className="w-8 shrink-0" />
                <span className="min-w-0 flex-1 truncate font-bold">{item.name}</span>
                {item.pr.weight > 0 ? (
                  <span className="shrink-0 font-display tabular-nums">
                    {item.pr.weight}
                    <span className="font-sans text-xs font-bold text-muted-foreground"> kg × {item.pr.reps}</span>
                  </span>
                ) : (
                  <span className="shrink-0 text-xs font-bold text-muted-foreground">No sets yet</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-muted/70 p-3">
            <Watchful eyeLevel={0.6} className="w-14 shrink-0">
              <KittyFace blink className="w-full" />
            </Watchful>
            <p className="text-sm font-bold text-muted-foreground">Pick up to three lifts to show off here.</p>
          </div>
        )}
      </section>

      {lastWorkout ? (
        <Link href={`/workout/${lastWorkout.id}/edit`} className="tile press group flex items-center gap-4 p-4">
          <CalendarLeaf date={lastWorkout.date} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-base">{lastWorkout.name}</h2>
            <span className="mt-0.5 block text-sm font-bold text-muted-foreground">
              Last workout
              {lastWorkout.duration_seconds ? ` · ${Math.round(lastWorkout.duration_seconds / 60)} min` : ""}
            </span>
          </div>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform duration-300 ease-spring group-hover:translate-x-1" />
        </Link>
      ) : (
        <section className="tile flex items-center gap-4 p-4">
          <KittyLoaf className="w-24 shrink-0" />
          <div>
            <h2 className="font-display text-base">No workouts yet</h2>
            <p className="mt-0.5 text-sm font-bold text-muted-foreground">She&apos;s napping until your first session.</p>
          </div>
        </section>
      )}
    </div>
  )
}
