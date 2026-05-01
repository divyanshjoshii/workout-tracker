"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"
import { createSplit } from "../actions"

export default function NewSplitPage() {
  const [days, setDays] = useState(["Push", "Pull", "Legs"])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function addDay() {
    setDays([...days, ""])
  }

  function updateDay(index: number, value: string) {
    const newDays = [...days]
    newDays[index] = value
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
    
    // Validate empty days
    if (days.some(d => d.trim() === "")) {
      setError("Please fill in all day names or remove empty ones.")
      return
    }

    const formData = new FormData(event.currentTarget)
    // Add days manually since they might not all be captured properly if names are identical
    days.forEach(day => formData.append("days[]", day))

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
          <CardDescription>Name your routine and define the days.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Split Name</Label>
              <Input 
                id="name" 
                name="name" 
                placeholder="e.g., Push Pull Legs" 
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
              
              <div className="space-y-3">
                {days.map((day, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/20 text-secondary text-sm font-bold shrink-0">
                      {index + 1}
                    </div>
                    <Input
                      value={day}
                      onChange={(e) => updateDay(index, e.target.value)}
                      placeholder="e.g., Upper Body"
                      required
                      className="bg-background"
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
                ))}
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive font-medium p-3 bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Saving..." : "Save Split"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
