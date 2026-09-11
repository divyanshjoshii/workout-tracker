"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

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
      <DialogTrigger className="w-full h-12 text-lg font-medium border border-border border-dashed bg-card/50 hover:bg-accent flex items-center justify-center rounded-md">
        <Plus className="h-5 w-5 mr-2" /> Add Exercise
      </DialogTrigger>
      <DialogContent className="max-w-md h-[80vh] flex flex-col p-0 border-border bg-background">
        <DialogHeader className="p-4 border-b border-border shrink-0">
          <DialogTitle>Select Exercise</DialogTitle>
          <Input
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-4 bg-card border-border"
          />
          {targetMuscles.length > 0 && (
            <div className="flex items-center mt-3 gap-2">
              <Button
                variant={showTargetedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowTargetedOnly(true)}
                className="text-xs h-8"
              >
                Target Muscles ({targetMuscles.join(', ')})
              </Button>
              <Button
                variant={!showTargetedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowTargetedOnly(false)}
                className="text-xs h-8"
              >
                All
              </Button>
            </div>
          )}
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {results.map(ex => (
              <button
                key={ex.id}
                onClick={() => pick(ex.id)}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-accent/50 transition-colors flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  {ex.image_url ? (
                    <div className="w-10 h-10 rounded-md bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                      <img src={ex.image_url} alt={ex.name} loading="lazy" decoding="async" className="object-cover w-full h-full mix-blend-screen" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-muted shrink-0 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Img</span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-foreground text-sm line-clamp-1">{ex.name}</div>
                    <div className="text-xs text-muted-foreground">{ex.muscle_group}</div>
                  </div>
                </div>
                <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
            {results.length === LIMIT && (
              <div className="text-center py-3 text-xs text-muted-foreground">
                Showing the first {LIMIT}. Keep typing to narrow it down.
              </div>
            )}
            {results.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {loading ? "Searching..." : "No exercises found."}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
