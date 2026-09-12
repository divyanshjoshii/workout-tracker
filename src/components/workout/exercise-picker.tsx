"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import { KittyLoaf } from "@/components/kitty/kitty"

// The table holds around 870 exercises. The workout pages used to fetch every
// column of every row up front to feed this dialog -- about 840 KB per page
// load, most of it instructions text that is never shown here. Search on the
// server instead and bring back one screenful.
const LIMIT = 50

type PickerExercise = { id: string; name: string; muscle_group: string; image_url: string | null }

interface ExercisePickerProps {
  targetMuscles?: string[]
  onPick: (exerciseId: string) => void | Promise<unknown>
}

export function ExercisePicker({ targetMuscles = [], onPick }: ExercisePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showTargetedOnly, setShowTargetedOnly] = useState(targetMuscles.length > 0)
  const [results, setResults] = useState<PickerExercise[]>([])
  const [loading, setLoading] = useState(false)

  // Keyed on a string, not the array: the parent re-renders every second for
  // the workout clock, and a defaulted [] is a new array each time, which would
  // re-run the search on every tick while the dialog is open.
  const targetKey = targetMuscles.join("|")

  useEffect(() => {
    if (!isOpen) return

    let stale = false
    const timer = setTimeout(async () => {
      setLoading(true)

      let query = createClient()
        .from("exercises")
        .select("id, name, muscle_group, image_url")
        .order("name")
        .limit(LIMIT)

      const term = searchQuery.trim()
      if (term) query = query.ilike("name", `%${term}%`)
      if (showTargetedOnly && targetKey) query = query.in("muscle_group", targetKey.split("|"))

      const { data } = await query
      if (stale) return
      setResults(data ?? [])
      setLoading(false)
    }, 200)

    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [isOpen, searchQuery, showTargetedOnly, targetKey])

  async function pick(exerciseId: string) {
    await onPick(exerciseId)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="press slide-fill group relative flex h-14 w-full items-center justify-center gap-2 rounded-[1.25rem] border-2 border-dashed border-input bg-card/70 text-base font-bold text-strawberry [--slide:var(--accent)]">
        <Plus className="size-5 transition-transform duration-500 ease-spring group-hover:rotate-90" /> Add exercise
      </DialogTrigger>
      <DialogContent className="flex h-[80vh] max-w-md flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b-2 p-5 pb-4">
          <DialogTitle>Add an exercise</DialogTitle>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute top-3.5 left-3.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {targetMuscles.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <Button
                variant={showTargetedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowTargetedOnly(true)}
                className="min-w-0 rounded-full"
              >
                <span className="truncate">Target muscles ({targetMuscles.join(', ')})</span>
              </Button>
              <Button
                variant={!showTargetedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowTargetedOnly(false)}
                className="rounded-full"
              >
                All
              </Button>
            </div>
          )}
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="flex flex-col gap-1">
            {results.map(ex => (
              <button
                key={ex.id}
                onClick={() => pick(ex.id)}
                className="group flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-accent active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  {ex.image_url ? (
                    <div className="size-11 shrink-0 overflow-hidden rounded-xl border-2 border-border bg-white">
                      <img src={ex.image_url} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
                    </div>
                  ) : (
                    <div className="size-11 shrink-0 rounded-xl border-2 border-border bg-muted" />
                  )}
                  <div className="min-w-0">
                    <div className="line-clamp-1 text-sm font-bold text-foreground">{ex.name}</div>
                    <div className="text-xs font-bold text-muted-foreground">{ex.muscle_group}</div>
                  </div>
                </div>
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-strawberry transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Plus className="size-4" />
                </span>
              </button>
            ))}
            {results.length === LIMIT && (
              <div className="py-3 text-center text-xs font-bold text-muted-foreground">
                Showing the first {LIMIT}. Keep typing to narrow it down.
              </div>
            )}
            {results.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-sm font-bold text-muted-foreground">
                <KittyLoaf className="w-24" />
                {loading ? "Searching..." : "No exercises found."}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
