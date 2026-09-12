"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"
import { Trophy } from "lucide-react"
import { KittyLoaf } from "@/components/kitty/kitty"
import { bestSet, e1rm } from "@/lib/e1rm"

interface ExerciseProgressChartsProps {
  exerciseId: string
  userId: string
}

export function ExerciseProgressCharts({ exerciseId, userId }: ExerciseProgressChartsProps) {
  const [data, setData] = useState<any[]>([])
  const [pr, setPr] = useState<{ weight: number, reps: number, e1rm: number } | null>(null)
  const [timeRange, setTimeRange] = useState<"all" | "year" | "month" | "week">("all")
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      // Fetch workout sets for this exercise
      const { data: weData } = await supabase
        .from("workout_exercises")
        .select(`
          id,
          workout_sessions!inner(created_at)
        `)
        .eq("exercise_id", exerciseId)
        .eq("workout_sessions.user_id", userId)

      if (!weData || weData.length === 0) return

      const weIds = weData.map(w => w.id)

      const { data: setsData } = await supabase
        .from("workout_sets")
        .select("weight, reps, workout_exercise_id")
        .in("workout_exercise_id", weIds)
        .not("weight", "is", null)

      if (!setsData || setsData.length === 0) return

      setPr(bestSet(setsData))

      // Best estimated 1RM per day, for the progression line.
      const chartDataMap = new Map<string, { e1rm: number, weight: number, reps: number }>()
      setsData.forEach(s => {
        if (!s.weight || !s.reps) return
        const we = weData.find(w => w.id === s.workout_exercise_id)
        if (!we) return
        const score = e1rm(s.weight, s.reps)
        const dateStr = new Date((we as any).workout_sessions.created_at).toISOString().split('T')[0]
        const existing = chartDataMap.get(dateStr)
        if (!existing || score > existing.e1rm) {
          chartDataMap.set(dateStr, { e1rm: score, weight: s.weight, reps: s.reps })
        }
      })

      const rawChartData = Array.from(chartDataMap.entries()).map(([date, data]) => ({ date, ...data }))
      rawChartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setData(rawChartData)
    }
    fetchData()
  }, [exerciseId, userId, supabase])

  const filteredData = data.filter(d => {
    if (timeRange === "all") return true
    const date = new Date(d.date).getTime()
    const now = new Date().getTime()
    if (timeRange === "year") return now - date <= 365 * 24 * 60 * 60 * 1000
    if (timeRange === "month") return now - date <= 30 * 24 * 60 * 60 * 1000
    if (timeRange === "week") return now - date <= 7 * 24 * 60 * 60 * 1000
    return true
  })

  if (data.length === 0) {
    return (
      <section className="tile flex flex-col items-center gap-2 p-6 text-center">
        <KittyLoaf className="w-28" />
        <p className="font-display text-heading">No progress yet</p>
        <p className="text-sm font-bold text-muted-foreground">Add this exercise to a workout and your progress shows up here.</p>
      </section>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {pr && (
        <section className="tile flex items-center gap-3 bg-butter p-4 text-butter-foreground">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-card text-butter-foreground">
            <Trophy className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-base">All-time best</h2>
            <p className="text-xs font-bold opacity-80">{pr.e1rm} kg estimated 1RM</p>
          </div>
          <p className="shrink-0 font-display text-2xl tabular-nums">
            {pr.weight}<span className="font-sans text-sm font-bold"> kg × {pr.reps}</span>
          </p>
        </section>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Strength progression</CardTitle>
          <p className="text-sm font-bold text-muted-foreground">Best estimated 1RM each day</p>
          <div className="mt-2 grid grid-cols-4 gap-1 rounded-2xl border-2 bg-muted p-1">
            {(["week", "month", "year", "all"] as const).map(range => (
              <Button
                key={range}
                variant={timeRange === range ? "outline" : "ghost"}
                size="sm"
                aria-pressed={timeRange === range}
                className={timeRange === range ? "text-foreground" : "text-muted-foreground"}
                onClick={() => setTimeRange(range)}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="h-64 px-2 pb-1">
          {filteredData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="4 6" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ stroke: 'var(--input)', strokeWidth: 2 }}
                  contentStyle={{ backgroundColor: 'var(--popover)', border: '2px solid var(--border)', borderRadius: '16px', color: 'var(--foreground)', fontWeight: 700 }}
                  itemStyle={{ color: 'var(--strawberry)' }}
                  labelFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  formatter={(value: any, name: any, props: any) => {
                     if (name === "Estimated 1RM (kg)") {
                       return [`${value}kg (${props.payload.weight}kg x ${props.payload.reps})`, name]
                     }
                     return [value, name]
                  }}
                />
                <Line type="monotone" dataKey="e1rm" name="Estimated 1RM (kg)" stroke="var(--chart-1)" strokeWidth={3.5} strokeLinecap="round" dot={{ r: 4.5, fill: 'var(--card)', stroke: 'var(--chart-1)', strokeWidth: 2.5 }} activeDot={{ r: 7, fill: 'var(--primary)', stroke: 'var(--card)', strokeWidth: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex size-full items-center justify-center text-sm font-bold text-muted-foreground">
              No data in this time range.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
