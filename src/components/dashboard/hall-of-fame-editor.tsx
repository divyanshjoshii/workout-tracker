"use client"

import { useState } from "react"
import { updateHallOfFame } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Check, Edit2, Search, X } from "lucide-react"

type Exercise = { id: string, name: string, muscle_group: string }

export function HallOfFameEditor({ allExercises, currentSelections }: { allExercises: Exercise[], currentSelections: string[] }) {
  const [open, setOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>(currentSelections)
  const [search, setSearch] = useState("")
  const [isPending, setIsPending] = useState(false)

  const filteredExercises = allExercises.filter(ex => 
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
      if (val) setSelectedIds(currentSelections) // Reset on open
    }}>
      <DialogTrigger render={<Button variant="ghost" size="icon" className="h-6 w-6 text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 hover:bg-yellow-500/20" />}>
        <Edit2 className="h-3 w-3" />
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-4">
        <DialogHeader>
          <DialogTitle>Edit Hall of Fame</DialogTitle>
          <DialogDescription>
            Select up to 3 exercises to feature on your dashboard. ({selectedIds.length}/3 selected)
          </DialogDescription>
        </DialogHeader>

        {/* Selected Badges */}
        <div className="flex flex-wrap gap-2 pt-2">
          {selectedIds.map(id => {
            const ex = allExercises.find(e => e.id === id)
            if (!ex) return null
            return (
              <div key={id} className="flex items-center gap-1 bg-yellow-500/20 text-yellow-700 dark:text-yellow-500 px-2 py-1 rounded-md text-xs font-medium">
                {ex.name}
                <button onClick={() => toggleSelection(id)} className="hover:text-foreground ml-1">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>

        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search exercises..." 
            className="pl-9 bg-accent/50"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto mt-2 space-y-1 pr-1 border rounded-md">
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
                  className={`w-full flex items-center justify-between p-3 text-left hover:bg-accent transition-colors
                    ${isSelected ? 'bg-yellow-500/10' : ''} 
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div>
                    <div className={`text-sm font-medium ${isSelected ? 'text-yellow-600 dark:text-yellow-500' : ''}`}>{ex.name}</div>
                    <div className="text-xs text-muted-foreground">{ex.muscle_group}</div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />}
                </button>
              )
            })
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button onClick={handleSave} disabled={isPending} className="w-full font-bold">
            {isPending ? "Saving..." : "Save Selection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
