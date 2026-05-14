"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { Database } from "@/types/database"
import { Activity, Calendar, Search, Dumbbell } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

type Session = Database["public"]["Tables"]["workout_sessions"]["Row"]
type WeightEntry = Database["public"]["Tables"]["body_weight_entries"]["Row"]

interface ProgressClientProps {
  sessions: Session[]
  weightEntries: WeightEntry[]
  weeklyExercises: any[]
}

export function ProgressClient({ sessions, weightEntries, weeklyExercises }: ProgressClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [allExercises, setAllExercises] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function fetchExercises() {
      const { data } = await supabase.from("exercises").select("id, name, muscle_group, image_url").order("name")
      if (data) setAllExercises(data)
    }
    fetchExercises()
  }, [supabase])

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

  const searchedExercises = searchQuery.trim().length > 0 
    ? allExercises.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : []

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="exercises">Exercises</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        {/* Body Weight Chart */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Body Weight History</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 1 ? (
              <div className="h-48 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip contentStyle={{ backgroundColor: '#0B0F14', borderColor: '#1F2937', borderRadius: '8px' }} itemStyle={{ color: '#22C55E' }} />
                    <Line type="monotone" dataKey="weight" stroke="#22C55E" strokeWidth={3} dot={{ r: 4, fill: "#22C55E", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#38BDF8" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-8 text-center">
                Log your body weight at least twice to see your progress chart.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workout History */}
        <div>
          <h2 className="text-lg font-semibold tracking-tight mb-3">Recent Workouts</h2>
          <div className="space-y-3">
            {sessions.length > 0 ? (
              sessions.map(session => (
                <Link key={session.id} href={`/progress/session/${session.id}`} className="block">
                  <Card className="border-border bg-card/50 hover:bg-card transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-foreground">{session.name}</div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(session.date + 'T12:00:00Z').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <div className="text-right">
                        {session.feeling && (
                          <div className={`text-xs font-medium px-2 py-1 rounded-md inline-block ${
                            session.feeling === 'Easy' ? 'bg-primary/20 text-primary' :
                            session.feeling === 'Hard' ? 'bg-destructive/20 text-destructive' :
                            'bg-secondary/20 text-secondary'
                          }`}>
                            {session.feeling}
                          </div>
                        )}
                        {session.duration_seconds && (
                          <div className="text-xs text-muted-foreground mt-1 flex items-center justify-end">
                            <Activity className="w-3 h-3 mr-1" />
                            {Math.round(session.duration_seconds / 60)} min
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border rounded-lg">
                No workouts recorded yet.
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="exercises" className="space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search all exercises..." 
            className="pl-9 bg-card border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {searchQuery.trim().length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Search Results</h3>
            {searchedExercises.map(ex => (
              <Link key={ex.id} href={`/exercises/${ex.id}`} className="block">
                <Card className="border-border bg-card/50 hover:bg-card transition-colors">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                      {ex.image_url ? (
                        <img src={ex.image_url} alt={ex.name} className="object-cover w-full h-full mix-blend-screen" />
                      ) : (
                        <Dumbbell className="w-5 h-5 text-muted-foreground opacity-50" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{ex.name}</div>
                      <div className="text-xs text-muted-foreground">{ex.muscle_group}</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {searchedExercises.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8">No exercises found.</div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Performed This Week</h3>
            {uniqueWeekly.length > 0 ? (
              uniqueWeekly.map(item => (
                <Link key={item.exercise.id} href={`/exercises/${item.exercise.id}`} className="block">
                  <Card className="border-border bg-card/50 hover:bg-card transition-colors">
                    <CardContent className="p-3 flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                          {item.exercise.image_url ? (
                            <img src={item.exercise.image_url} alt={item.exercise.name} className="object-cover w-full h-full mix-blend-screen" />
                          ) : (
                            <Dumbbell className="w-5 h-5 text-muted-foreground opacity-50" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.exercise.name}</div>
                          <div className="text-xs text-muted-foreground">{item.exercise.muscle_group}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1 pl-13">
                        {Array.from(item.splitDayNames as Set<string>).map(splitName => (
                          <span key={splitName} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {splitName}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border rounded-lg bg-card/50">
                You haven't performed any exercises in the last 7 days.
              </div>
            )}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
