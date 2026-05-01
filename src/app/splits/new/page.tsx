"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Plus, Trash2, Check } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"
import { createSplit } from "../actions"

const MUSCLE_GROUPS = [
  "Abdominals", "Abductors", "Adductors", "Biceps", "Calves", 
  "Chest", "Forearms", "Glutes", "Hamstrings", "Lats", 
  "Lower Back", "Middle Back", "Neck", "Quadriceps", 
  "Shoulders", "Traps", "Triceps"
]

export default function NewSplitPage() {
  const [days, setDays] = useState<{name: string, targets: string[]}[]>([
    { name: "Push", targets: ["Chest", "Shoulders", "Triceps"] },
    { name: "Pull", targets: ["Back", "Biceps"] },
    { name: "Legs", targets: ["Quadriceps", "Hamstrings", "Calves", "Glutes"] }
  ])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function addDay() {
    setDays([...days, { name: "", targets: [] }])
  }

  function updateDayName(index: number, value: string) {
    const newDays = [...days]
    newDays[index].name = value
    setDays(newDays)
  }

  function toggleTargetMuscle(dayIndex: number, muscle: string) {
    const newDays = [...days]
    const currentTargets = newDays[dayIndex].targets
    
    if (currentTargets.includes(muscle)) {
      newDays[dayIndex].targets = currentTargets.filter(m => m !== muscle)
    } else {
      newDays[dayIndex].targets = [...currentTargets, muscle]
    }
    setDays(newDays)
  }

  function removeDay(index: number) {
    if (days.length <= 1) return
    const newDays = [...days]
    newDays.splice(index, 1)
    setDays(newDays)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    
    if (days.some(d => d.name.trim() === "")) {
      setError("Please fill in all day names or remove empty ones.")
      return
    }

    const formData = new FormData(event.currentTarget)
    // Send days as a JSON string to parse safely on the server
    formData.set("days_json", JSON.stringify(days))

    startTransition(async () => {
      try {
        await createSplit(formData)
      } catch (err: any) {
        setError(err.message || "Something went wrong")
      }
    })
  }

  return (
    <div className="flex flex-col p-4 space-y-6 max-w-lg mx-auto pb-24">
      <header className="flex items-center mt-4">
        <Link href="/splits">
          <Button variant="ghost" size="icon" className="-ml-2 mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Create Split</h1>
      </header>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Split Details</CardTitle>
          <CardDescription>Name your routine and define the targeted muscles for each day.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Split Name</Label>
              <Input 
                id="name" 
                name="name" 
                placeholder="e.g., Bro Split, PPL" 
                required 
                className="bg-background"
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <Label>Workout Days</Label>
                <Button type="button" variant="outline" size="sm" onClick={addDay}>
                  <Plus className="h-4 w-4 mr-1" /> Add Day
                </Button>
              </div>
              
              <div className="space-y-6">
                {days.map((day, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg bg-background/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/20 text-secondary text-sm font-bold shrink-0">
                        {index + 1}
                      </div>
                      <Input
                        value={day.name}
                        onChange={(e) => updateDayName(index, e.target.value)}
                        placeholder="Day Name (e.g., Pull Day)"
                        required
                        className="bg-card font-medium"
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeDay(index)}
                        disabled={days.length <= 1}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Target Muscle Groups (Filters Exercises)</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {MUSCLE_GROUPS.map(m => {
                          const isSelected = day.targets.includes(m)
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => toggleTargetMuscle(index, m)}
                              className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                                isSelected 
                                  ? "bg-primary text-primary-foreground border-primary" 
                                  : "bg-card text-muted-foreground border-border hover:border-primary/50"
                              }`}
                            >
                              {m}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive font-medium p-3 bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isPending}>
              {isPending ? "Saving..." : "Save Split"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
