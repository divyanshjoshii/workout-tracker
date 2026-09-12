"use client"

import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
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
    <div className="mx-auto flex max-w-md flex-col gap-5 px-4 pt-5 pb-6">
      <header className="flex items-center gap-3">
        <Link href="/splits" aria-label="Back to splits" className={buttonVariants({ variant: "outline", size: "icon", className: "rounded-full" })}>
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-display text-title">Create a split</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Split details</CardTitle>
          <CardDescription>Name your routine and pick the muscles each day works.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Split name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Bro Split, PPL"
                required
              />
            </div>

            <div className="flex flex-col gap-3 border-t-2 pt-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base">Workout days</h2>
                <Button type="button" variant="outline" size="sm" className="rounded-full text-strawberry" onClick={addDay}>
                  <Plus /> Add day
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                {days.map((day, index) => (
                  <div key={index} className="flex flex-col gap-3 rounded-[1.25rem] bg-muted/70 p-3">
                    <div className="flex items-center gap-2">
                      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky font-display text-sm text-sky-foreground">
                        {index + 1}
                      </div>
                      <Input
                        value={day.name}
                        onChange={(e) => updateDayName(index, e.target.value)}
                        placeholder="Day name (e.g., Pull Day)"
                        aria-label={`Day ${index + 1} name`}
                        required
                        className="bg-card"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove day ${index + 1}`}
                        onClick={() => removeDay(index)}
                        disabled={days.length <= 1}
                        className="shrink-0 text-muted-foreground hover:text-destructive [--slide:var(--destructive-soft)]"
                      >
                        <Trash2 />
                      </Button>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-bold text-muted-foreground">Target muscles, used to filter exercises</p>
                      <div className="flex flex-wrap gap-1.5">
                        {MUSCLE_GROUPS.map(m => {
                          const isSelected = day.targets.includes(m)
                          return (
                            <button
                              key={m}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() => toggleTargetMuscle(index, m)}
                              className={cn(
                                "press rounded-full border-2 px-2.5 py-1 text-xs font-bold",
                                isSelected
                                  ? "border-transparent bg-primary text-primary-foreground"
                                  : "border-border bg-card text-muted-foreground hover:text-foreground"
                              )}
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
              <div role="alert" className="rounded-2xl bg-destructive-soft p-3 text-sm font-bold text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isPending}>
              {isPending ? "Saving..." : "Save split"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
