"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { Database } from "@/types/database"
import { Activity, ChevronRight, Search, Dumbbell } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { KittyLoaf } from "@/components/kitty/kitty"
import { CalendarLeaf } from "@/components/layout/calendar-leaf"
import { cn } from "@/lib/utils"

type Session = Database["public"]["Tables"]["workout_sessions"]["Row"]
type WeightEntry = Database["public"]["Tables"]["body_weight_entries"]["Row"]
type SearchResult = { id: string; name: string; muscle_group: string; image_url: string | null }

interface ProgressClientProps {
  sessions: Session[]
  weightEntries: WeightEntry[]
  weeklyExercises: any[]
}

export function ProgressClient({ sessions, weightEntries, weeklyExercises }: ProgressClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)

  // Searched on the server as you type, 50 rows at a time. This screen used to
  // download all 873 exercises on every visit in case a search happened.
  useEffect(() => {
    const term = searchQuery.trim()
    if (!term) return
    let stale = false
    const timer = setTimeout(async () => {
      setSearching(true)
      const { createClient } = await import("@/lib/supabase/client")
      const { data } = await createClient()
        .from("exercises")
        .select("id, name, muscle_group, image_url")
        .ilike("name", `%${term}%`)
        .order("name")
        .limit(50)
      if (stale) return
      setResults(data ?? [])
      setSearching(false)
    }, 200)
    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [searchQuery])

  // Format data for chart
  const chartData = weightEntries
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(entry => ({
      date: new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      weight: Number(entry.weight)
    }))

  // Unique weekly exercises grouped by split day name
  const weeklyExerciseMap = new Map<string, any>()
  weeklyExercises.forEach(we => {
    if (!we.exercises) return
    const key = we.exercise_id
    if (!weeklyExerciseMap.has(key)) {
      weeklyExerciseMap.set(key, {
        exercise: we.exercises,
        splitDayNames: new Set<string>([we.workout_sessions.name])
      })
    } else {
      weeklyExerciseMap.get(key).splitDayNames.add(we.workout_sessions.name)
    }
  })
  const uniqueWeekly = Array.from(weeklyExerciseMap.values())

  const searchedExercises = searchQuery.trim() ? results : []

  return (
    <Tabs defaultValue="overview" className="gap-5">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="exercises">Exercises</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="flex flex-col gap-6">
        {/* Body Weight Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Body weight</CardTitle>
            <p className="text-sm font-bold text-muted-foreground">Your last 30 entries</p>
          </CardHeader>
          <CardContent className="px-2">
            {chartData.length > 1 ? (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 12, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="4 6" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip
                      cursor={{ stroke: 'var(--input)', strokeWidth: 2 }}
                      contentStyle={{ backgroundColor: 'var(--popover)', border: '2px solid var(--border)', borderRadius: '16px', color: 'var(--foreground)', fontWeight: 700 }}
                      itemStyle={{ color: 'var(--sky-foreground)' }}
                    />
                    <Line type="monotone" dataKey="weight" stroke="var(--chart-2)" strokeWidth={3.5} strokeLinecap="round" dot={{ r: 4.5, fill: "var(--card)", stroke: "var(--chart-2)", strokeWidth: 2.5 }} activeDot={{ r: 7, fill: "var(--sky)", stroke: "var(--chart-2)", strokeWidth: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 px-4 py-6 text-center text-sm font-bold text-muted-foreground">
                <KittyLoaf className="w-24" />
                Log your body weight at least twice to see your progress chart.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workout History */}
        <section>
          <h2 className="font-display text-heading">Recent workouts</h2>
          <div className="mt-3 flex flex-col gap-2.5">
            {sessions.length > 0 ? (
              sessions.map(session => (
                <Link key={session.id} href={`/workout/${session.id}/edit`} className="tile press group flex items-center gap-3 p-3 pr-4">
                  <CalendarLeaf date={session.date} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{session.name}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-muted-foreground">
                      <span>{new Date(session.date + 'T12:00:00Z').toLocaleDateString(undefined, { weekday: 'long', timeZone: 'UTC' })}</span>
                      {session.duration_seconds && (
                        <span className="inline-flex items-center gap-1">
                          <Activity className="size-3.5" />
                          {Math.round(session.duration_seconds / 60)} min
                        </span>
                      )}
                    </div>
                  </div>
                  {session.feeling && (
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold", FEELING_TONE[session.feeling] ?? "bg-muted text-muted-foreground")}>
                      {session.feeling}
                    </span>
                  )}
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform duration-300 ease-spring group-hover:translate-x-1" />
                </Link>
              ))
            ) : (
              <div className="tile flex flex-col items-center gap-2 p-6 text-center text-sm font-bold text-muted-foreground">
                <KittyLoaf className="w-24" />
                No workouts recorded yet.
              </div>
            )}
          </div>
        </section>
      </TabsContent>

      <TabsContent value="exercises" className="flex flex-col gap-5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search all exercises..."
            aria-label="Search all exercises"
            className="bg-card pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {searchQuery.trim().length > 0 ? (
          <section>
            <h2 className="font-display text-heading">Search results</h2>
            <div className="mt-3 flex flex-col gap-2">
              {searchedExercises.map(ex => (
                <Link key={ex.id} href={`/exercises/${ex.id}`} className="tile press group flex items-center gap-3 p-2.5 pr-4">
                  <ExerciseThumb src={ex.image_url} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{ex.name}</div>
                    <div className="text-xs font-bold text-muted-foreground">{ex.muscle_group}</div>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform duration-300 ease-spring group-hover:translate-x-1" />
                </Link>
              ))}
              {searchedExercises.length === 0 && (
                <div className="py-8 text-center text-sm font-bold text-muted-foreground">{searching ? "Searching..." : "No exercises found."}</div>
              )}
            </div>
          </section>
        ) : (
          <section>
            <h2 className="font-display text-heading">Performed this week</h2>
            <div className="mt-3 flex flex-col gap-2">
              {uniqueWeekly.length > 0 ? (
                uniqueWeekly.map(item => (
                  <Link key={item.exercise.id} href={`/exercises/${item.exercise.id}`} className="tile press group flex items-center gap-3 p-2.5 pr-4">
                    <ExerciseThumb src={item.exercise.image_url} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold">{item.exercise.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <span className="text-xs font-bold text-muted-foreground">{item.exercise.muscle_group}</span>
                        {Array.from(item.splitDayNames as Set<string>).map(splitName => (
                          <span key={splitName} className="rounded-full bg-primary px-2 py-0.5 text-[0.6875rem] font-bold text-primary-foreground">
                            {splitName}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform duration-300 ease-spring group-hover:translate-x-1" />
                  </Link>
                ))
              ) : (
                <div className="tile flex flex-col items-center gap-2 p-6 text-center text-sm font-bold text-muted-foreground">
                  <KittyLoaf className="w-24" />
                  You haven&apos;t performed any exercises in the last 7 days.
                </div>
              )}
            </div>
          </section>
        )}
      </TabsContent>
    </Tabs>
  )
}

const FEELING_TONE: Record<string, string> = {
  Easy: "bg-mint text-mint-foreground",
  Medium: "bg-butter text-butter-foreground",
  Hard: "bg-primary text-primary-foreground",
}

function ExerciseThumb({ src }: { src: string | null }) {
  return (
    <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-border bg-white">
      {src ? (
        <img src={src} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
      ) : (
        <Dumbbell className="size-5 text-muted-foreground" />
      )}
    </span>
  )
}
