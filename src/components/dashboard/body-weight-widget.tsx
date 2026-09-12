"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useTransition } from "react"
import { Plus } from "lucide-react"
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
      <DialogTrigger className="tile press slide-fill group relative flex h-full flex-col bg-sky p-4 text-left text-sky-foreground [--slide:color-mix(in_oklab,var(--sky),var(--foreground)_6%)]">
        <span className="font-display text-base">Body weight</span>
        <span className="mt-3 flex items-baseline gap-1">
          <span className="font-display text-stat tabular-nums">{latestWeight ?? "--"}</span>
          {latestWeight && <span className="text-sm font-bold">kg</span>}
        </span>
        <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-bold">
          <Plus className="size-3.5 transition-transform duration-500 ease-spring group-hover:rotate-90" />
          Log weight
        </span>
      </DialogTrigger>

      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Log body weight</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              step="0.1"
              placeholder="e.g. 75.5"
              required
              defaultValue={latestWeight || ""}
              autoFocus
            />
          </div>

          {error && <p className="text-sm font-bold text-destructive">{error}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={isPending}>
            {isPending ? "Saving..." : "Save entry"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
