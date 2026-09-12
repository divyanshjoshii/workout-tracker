"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useTransition } from "react"
import { createPastWorkout } from "@/app/actions"
import { useRouter } from "next/navigation"
import { History } from "lucide-react"
import { AppIconFace, appIconClass } from "./app-icon"

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
      <DialogTrigger className={appIconClass}>
        <AppIconFace icon={History} tone="bg-butter text-butter-foreground" />
        Past workout
      </DialogTrigger>

      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Log a past workout</DialogTitle>
          <DialogDescription>Add it now and fill in the sets next.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Workout name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Pull Day"
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={today}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              name="duration"
              type="number"
              placeholder="Optional"
            />
          </div>

          {error && <p className="text-sm font-bold text-destructive">{error}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={isPending}>
            {isPending ? "Creating..." : "Create & add sets"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
