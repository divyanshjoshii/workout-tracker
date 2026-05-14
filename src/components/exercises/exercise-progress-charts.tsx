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
  const [pr, setPr] = useState<{ weight: number, reps: number } | null>(null)
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

      // Find PR
      let maxWeight = 0
      let maxReps = 0
      setsData.forEach(s => {
        if (s.weight && s.weight > maxWeight) {
          maxWeight = s.weight
          maxReps = s.reps
        } else if (s.weight === maxWeight && s.reps > maxReps) {
          maxReps = s.reps
        }
      })
      if (maxWeight > 0) setPr({ weight: maxWeight, reps: maxReps })

      // Process data for charts
      const chartDataMap = new Map<string, number>()
      
      setsData.forEach(s => {
        const we = weData.find(w => w.id === s.workout_exercise_id)
        if (we && s.weight) {
          const dateStr = new Date((we as any).workout_sessions.created_at).toISOString().split('T')[0]
          // Store max weight per day
          const existing = chartDataMap.get(dateStr) || 0
          if (s.weight > existing) {
            chartDataMap.set(dateStr, s.weight)
          }
        }
      })

      const rawChartData = Array.from(chartDataMap.entries()).map(([date, weight]) => ({ date, weight }))
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
          <CardContent className="p-4 flex justify-between items-center">
            <span className="font-bold text-sm text-yellow-600 dark:text-yellow-500 uppercase tracking-wider">All-Time PR</span>
            <span className="font-mono font-bold text-xl text-primary">{pr.weight}kg <span className="text-muted-foreground font-sans text-sm font-normal">x{pr.reps}</span></span>
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex justify-between items-center">
            <span>Weight Progression</span>
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
                />
                <Line type="monotone" dataKey="weight" name="Max Weight (kg)" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, fill: '#38bdf8', strokeWidth: 0 }} activeDot={{ r: 6 }} />
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
