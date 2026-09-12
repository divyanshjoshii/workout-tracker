"use client"

import { useState } from "react"
import { updateHallOfFame } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Check, Pencil, Search, X } from "lucide-react"

type Exercise = { id: string, name: string, muscle_group: string }

export function HallOfFameEditor({ currentSelections }: { currentSelections: string[] }) {
  const [open, setOpen] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>(currentSelections)
  const [search, setSearch] = useState("")
  const [isPending, setIsPending] = useState(false)

  // Loaded when the dialog opens instead of on every dashboard render. The table
  // holds around 870 rows and this list shows at most 50 of them. The Supabase
  // library is imported here as well, which keeps it out of the home screen's
  // startup JavaScript.
  async function loadExercises() {
    if (exercises.length > 0 || loading) return
    setLoading(true)
    const { createClient } = await import("@/lib/supabase/client")
    const { data } = await createClient()
      .from("exercises")
      .select("id, name, muscle_group")
      .order("name", { ascending: true })
    setExercises(data ?? [])
    setLoading(false)
  }

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(search.toLowerCase()) || 
    ex.muscle_group.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 50) // Limit display for performance

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id)
      } else {
        if (prev.length >= 3) return prev // Max 3
        return [...prev, id]
      }
    })
  }

  const handleSave = async () => {
    setIsPending(true)
    try {
      await updateHallOfFame(selectedIds)
      setOpen(false)
    } catch (e) {
      console.error(e)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val)
      if (val) {
        setSelectedIds(currentSelections) // Reset on open
        loadExercises()
      }
    }}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Edit hall of fame" className="text-strawberry" />}>
        <Pencil />
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-4">
        <DialogHeader>
          <DialogTitle>Hall of fame</DialogTitle>
          <DialogDescription>
            Pick up to three lifts to show off on your home screen. {selectedIds.length} of 3 picked.
          </DialogDescription>
        </DialogHeader>

        {/* Selected Badges */}
        <div className="flex flex-wrap gap-2 pt-2">
          {selectedIds.map(id => {
            const ex = exercises.find(e => e.id === id)
            if (!ex) return null
            return (
              <div key={id} className="flex items-center gap-1 rounded-full bg-primary py-1 pr-1.5 pl-3 text-xs font-bold text-primary-foreground">
                {ex.name}
                <button onClick={() => toggleSelection(id)} aria-label={`Remove ${ex.name}`} className="grid size-5 place-items-center rounded-full transition-colors hover:bg-card/60">
                  <X className="size-3" />
                </button>
              </div>
            )
          })}
        </div>

        <div className="relative mt-2">
          <Search className="pointer-events-none absolute top-3.5 left-3.5 size-4 text-muted-foreground" />
          <Input 
            placeholder="Search exercises..." 
            className="pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="mt-2 flex-1 space-y-1 overflow-y-auto rounded-2xl border-2 p-1">
          {filteredExercises.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">No exercises found.</p>
          ) : (
            filteredExercises.map(ex => {
              const isSelected = selectedIds.includes(ex.id)
              const isDisabled = !isSelected && selectedIds.length >= 3
              
              return (
                <button
                  key={ex.id}
                  disabled={isDisabled}
                  onClick={() => toggleSelection(ex.id)}
                  className={`flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors hover:bg-accent
                    ${isSelected ? 'bg-accent' : ''}
                    ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}
                  `}
                >
                  <div>
                    <div className={`text-sm font-bold ${isSelected ? 'text-strawberry' : ''}`}>{ex.name}</div>
                    <div className="text-xs text-muted-foreground">{ex.muscle_group}</div>
                  </div>
                  {isSelected && <Check className="size-4 text-strawberry" />}
                </button>
              )
            })
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button onClick={handleSave} disabled={isPending} size="lg" className="w-full">
            {isPending ? "Saving..." : "Save Selection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
