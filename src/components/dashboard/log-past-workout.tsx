"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useTransition } from "react"
import { createPastWorkout } from "@/app/actions"
import { useRouter } from "next/navigation"
import { History } from "lucide-react"

export function LogPastWorkout() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      try {
        const sessionId = await createPastWorkout(formData)
        setIsOpen(false)
        router.push(`/workout/${sessionId}/edit`)
      } catch (err: any) {
        setError(err.message || "Failed to create workout")
      }
    })
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="w-full h-14 text-base font-semibold border border-border bg-card hover:bg-accent text-foreground flex items-center justify-center rounded-md">
        <History className="mr-2 h-5 w-5" />
        Log Past Workout
      </DialogTrigger>
      
      <DialogContent className="max-w-xs rounded-xl bg-background border-border">
        <DialogHeader>
          <DialogTitle>Log Past Workout</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workout Name</Label>
            <Input 
              id="name" 
              name="name" 
              placeholder="e.g. Pull Day" 
              required 
              className="bg-card border-border"
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input 
              id="date" 
              name="date" 
              type="date"
              defaultValue={today}
              required 
              className="bg-card border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input 
              id="duration" 
              name="duration" 
              type="number"
              placeholder="Optional" 
              className="bg-card border-border"
            />
          </div>
          
          {error && <div className="text-sm text-destructive">{error}</div>}
          
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating..." : "Create & Add Sets"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
