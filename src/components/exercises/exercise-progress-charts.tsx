"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"

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

      // Find PR and Process data for charts
      let maxE1RM = 0
      let prSet: { weight: number, reps: number, e1rm: number } | null = null
      const chartDataMap = new Map<string, { e1rm: number, weight: number, reps: number }>()
      
      setsData.forEach(s => {
        if (s.weight && s.reps) {
          const e1rm = Math.round(s.weight * (1 + s.reps / 30))
          
          if (e1rm > maxE1RM) {
            maxE1RM = e1rm
            prSet = { weight: s.weight, reps: s.reps, e1rm }
          } else if (e1rm === maxE1RM && s.weight > (prSet?.weight || 0)) {
            // Tie-breaker: heavier weight wins
            prSet = { weight: s.weight, reps: s.reps, e1rm }
          }

          const we = weData.find(w => w.id === s.workout_exercise_id)
          if (we) {
            const dateStr = new Date((we as any).workout_sessions.created_at).toISOString().split('T')[0]
            const existing = chartDataMap.get(dateStr)
            if (!existing || e1rm > existing.e1rm) {
              chartDataMap.set(dateStr, { e1rm, weight: s.weight, reps: s.reps })
            }
          }
        }
      })
      if (prSet) setPr(prSet)

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
      <Card className="border-border bg-card mt-6">
        <CardContent className="p-6 text-center text-muted-foreground">
          No data logged for this exercise yet. Add it to a workout to track progress!
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 mt-6">
      {pr && (
        <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-transparent">
          <CardContent className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <span className="font-bold text-sm text-yellow-600 dark:text-yellow-500 uppercase tracking-wider">All-Time PR <span className="text-muted-foreground font-normal normal-case text-xs">(Est. 1RM)</span></span>
            <span className="font-mono font-bold text-xl text-primary">{pr.weight}kg <span className="text-muted-foreground font-sans text-sm font-normal">x{pr.reps}</span> <span className="text-sm font-normal text-muted-foreground ml-1">({pr.e1rm}kg e1RM)</span></span>
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex justify-between items-center">
            <span>Strength Progression <span className="text-xs font-normal text-muted-foreground ml-2">(Est. 1RM)</span></span>
          </CardTitle>
          <div className="flex gap-2 mt-2">
            {(["week", "month", "year", "all"] as const).map(range => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={() => setTimeRange(range)}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-4 pb-2 px-0 h-64">
          {filteredData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="date" stroke="#666" fontSize={12} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                  itemStyle={{ color: '#38bdf8' }}
                  labelFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  formatter={(value: any, name: any, props: any) => {
                     if (name === "Estimated 1RM (kg)") {
                       return [`${value}kg (${props.payload.weight}kg x ${props.payload.reps})`, name]
                     }
                     return [value, name]
                  }}
                />
                <Line type="monotone" dataKey="e1rm" name="Estimated 1RM (kg)" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, fill: '#38bdf8', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              No data in this time range.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
