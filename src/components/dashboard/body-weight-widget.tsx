"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useTransition } from "react"
import { logBodyWeight } from "@/app/actions"

interface BodyWeightWidgetProps {
  latestWeight: number | null
}

export function BodyWeightWidget({ latestWeight }: BodyWeightWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      try {
        await logBodyWeight(formData)
        setIsOpen(false)
      } catch (err: any) {
        setError(err.message || "Failed to log weight")
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="text-left">
        <Card className="border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer h-full">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="text-sm font-medium text-muted-foreground mb-4">Body Weight</div>
            <div>
              <div className="text-2xl font-bold text-secondary">
                {latestWeight ? `${latestWeight} kg` : "--"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {latestWeight ? "Latest entry" : "Tap to log"}
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="max-w-xs rounded-xl bg-background border-border">
        <DialogHeader>
          <DialogTitle>Log Body Weight</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input 
              id="weight" 
              name="weight" 
              type="number" 
              step="0.1"
              placeholder="e.g. 75.5" 
              required 
              defaultValue={latestWeight || ""}
              className="bg-card border-border"
              autoFocus
            />
          </div>
          
          {error && <div className="text-sm text-destructive">{error}</div>}
          
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Saving..." : "Save Entry"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
