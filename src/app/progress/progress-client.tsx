"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { Database } from "@/types/database"
import { Activity, Calendar } from "lucide-react"
import Link from "next/link"

type Session = Database["public"]["Tables"]["workout_sessions"]["Row"]
type WeightEntry = Database["public"]["Tables"]["body_weight_entries"]["Row"]

interface ProgressClientProps {
  sessions: Session[]
  weightEntries: WeightEntry[]
}

export function ProgressClient({ sessions, weightEntries }: ProgressClientProps) {
  // Format data for chart
  const chartData = weightEntries
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(entry => ({
      date: new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      weight: Number(entry.weight)
    }))

  return (
    <div className="space-y-6">
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
                  <XAxis 
                    dataKey="date" 
                    stroke="#888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    domain={['dataMin - 2', 'dataMax + 2']} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B0F14', borderColor: '#1F2937', borderRadius: '8px' }}
                    itemStyle={{ color: '#22C55E' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#22C55E" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#22C55E", strokeWidth: 0 }} 
                    activeDot={{ r: 6, fill: "#38BDF8" }} 
                  />
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
              <Link key={session.id} href={`/workout/${session.id}/edit`} className="block">
                <Card className="border-border bg-card/50 hover:bg-card transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">{session.name}</div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(session.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
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
    </div>
  )
}
