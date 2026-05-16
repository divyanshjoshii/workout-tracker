"use client"

import { useState, useEffect } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Database } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Plus, Trash2, GripVertical, FileText, Weight } from "lucide-react"
import { getExerciseHistory } from "@/app/workout/actions"

type Exercise = Database["public"]["Tables"]["exercises"]["Row"]
type WorkoutSet = Database["public"]["Tables"]["workout_sets"]["Row"]
type WorkoutExercise = Database["public"]["Tables"]["workout_exercises"]["Row"] & {
  exercises: Exercise
  workout_sets: WorkoutSet[]
}

interface SortableExerciseProps {
  we: WorkoutExercise
  completedSets: Record<string, boolean>
  toggleSetComplete: (setId: string) => void
  updateSet: (weId: string, setId: string, field: any, value: any) => void
  removeSet: (weId: string, setId: string) => void
  addSet: (weId: string, parentSetNumber?: number) => void
  removeExercise: (weId: string) => void
  isLinkedToNext?: boolean
  isLinkedToPrev?: boolean
  hasNext?: boolean
  onToggleLink?: () => void
}

export function SortableExercise({ 
  we, completedSets, toggleSetComplete, updateSet, removeSet, addSet, removeExercise,
  isLinkedToNext, isLinkedToPrev, hasNext, onToggleLink
}: SortableExerciseProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: we.id })
  
  const [pr, setPr] = useState<{ weight: number | null, reps: number, e1rm?: number } | null>(null)
  const [lastSessionSets, setLastSessionSets] = useState<any[]>([])
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: "relative" as const,
  }

  useEffect(() => {
    // Fetch PR and last session data for this exercise
    async function fetchHistory() {
      const history = await getExerciseHistory(we.exercises.id, we.session_id)
      if (history.pr) setPr(history.pr as any)
      if (history.lastSession) setLastSessionSets(history.lastSession)
    }
    fetchHistory()
  }, [we.exercises.id])

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`bg-card 
        ${isDragging ? 'shadow-xl ring-2 ring-primary/50 opacity-90' : ''}
        ${isLinkedToNext ? 'rounded-b-none border-b-0' : 'border-border border'}
        ${isLinkedToPrev ? 'rounded-t-none border-t-0' : 'border-border border'}
        ${isLinkedToNext || isLinkedToPrev ? 'border-primary/30 border-l-4' : ''}
      `}
    >
      {isLinkedToPrev && <div className="h-px bg-border/50 mx-4 mt-2"></div>}
      <CardHeader className="pb-2 flex flex-row items-center space-y-0 p-3 sm:p-6">
        <div {...attributes} {...listeners} className="mr-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none">
          <GripVertical className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-lg text-primary flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>{we.exercises.name}</span>
              {hasNext && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-6 text-[10px] px-2 rounded-full border ${isLinkedToNext ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20' : 'text-muted-foreground border-border hover:text-foreground'}`}
                  onClick={onToggleLink}
                >
                  {isLinkedToNext ? '🔗 Unlink Superset' : '🔗 Superset Below'}
                </Button>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeExercise(we.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardTitle>
          {pr && pr.weight && (
            <div className="text-xs text-muted-foreground mt-1">
              🏆 All-Time PR: <span className="font-semibold text-foreground">{pr.weight}kg x {pr.reps}</span> {pr.e1rm && <span className="font-normal opacity-80">({pr.e1rm}kg e1RM)</span>}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        <div className="space-y-3">
          <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 text-xs font-semibold text-muted-foreground uppercase text-center mb-2">
            <span>Set</span>
            <span>kg</span>
            <span>Reps</span>
            <span>Done</span>
          </div>
          
          {we.workout_sets
            .sort((a, b) => {
              if (a.set_number !== b.set_number) return a.set_number - b.set_number
              // If same set number, ensure dropsets come after normal sets, or just sort by created_at
              return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            })
            .map((set, idx) => {
              const isCompleted = completedSets[set.id]
              const lastSet = lastSessionSets[idx]
              const isDropset = set.set_type === "dropset"
              
              return (
              <div key={set.id} className={`space-y-1 ${isDropset ? 'pl-4 sm:pl-8 border-l-2 border-primary/20 ml-2 mt-1 relative' : ''}`}>
                {isDropset && <div className="absolute top-1/2 -left-2 w-2 h-px bg-primary/20 -translate-y-1/2"></div>}
                <div className={`grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 items-center transition-colors rounded-md p-1 ${isCompleted ? 'bg-primary/5' : ''}`}>
                  <div className="relative text-center font-medium bg-secondary/20 text-secondary rounded-md h-9 flex items-center justify-center text-sm cursor-pointer group" onClick={() => {
                    const notes = prompt("Enter notes for this set:", set.notes || "")
                    if (notes !== null) updateSet(we.id, set.id, "notes", notes)
                  }}>
                    {isDropset ? "↳" : set.set_number}
                    {set.notes && <FileText className="absolute -top-1 -right-1 w-3 h-3 text-primary" />}
                    <span className="sr-only">Add Note</span>
                  </div>
                  
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      placeholder={lastSet && lastSet.weight !== null ? String(lastSet.weight) : "--"}
                      value={set.is_bodyweight ? "" : (set.weight ?? "")}
                      disabled={!!set.is_bodyweight}
                      onChange={(e) => updateSet(we.id, set.id, "weight", e.target.value)}
                      className={`h-9 pr-6 text-center bg-background border-border placeholder:text-muted-foreground/40 ${isCompleted ? 'opacity-70 text-primary border-primary/50' : ''}`}
                    />
                    <button 
                      onClick={() => updateSet(we.id, set.id, "is_bodyweight", !set.is_bodyweight)}
                      className={`absolute right-1 p-1 rounded-sm ${set.is_bodyweight ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-accent'}`}
                      title="Bodyweight"
                    >
                      <Weight className="w-3 h-3" />
                    </button>
                    {set.is_bodyweight && <div className="absolute inset-0 flex items-center justify-center font-bold text-primary pointer-events-none bg-background/80 rounded-md">BW</div>}
                  </div>
                  
                  <Input
                    type="number"
                    placeholder={lastSet && lastSet.reps ? String(lastSet.reps) : "--"}
                    value={set.reps || ""}
                    onChange={(e) => updateSet(we.id, set.id, "reps", e.target.value)}
                    className={`h-9 text-center bg-background border-border placeholder:text-muted-foreground/40 ${isCompleted ? 'opacity-70 text-primary border-primary/50' : ''}`}
                  />
                  
                  <div className="flex flex-col gap-1 sm:flex-row">
                    <Button
                      variant={isCompleted ? "default" : "secondary"}
                      size="icon"
                      className={`h-9 w-full sm:w-9 ${isCompleted ? 'bg-primary text-primary-foreground' : ''}`}
                      onClick={() => toggleSetComplete(set.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    {/* Mobile delete button under check */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-full sm:hidden text-muted-foreground hover:text-destructive"
                      onClick={() => removeSet(we.id, set.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="hidden sm:flex gap-1">
                    {!isDropset && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Add Dropset"
                        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={() => addSet(we.id, set.set_number)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeSet(we.id, set.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {/* Mobile / Extra controls */}
                <div className="sm:hidden flex items-center gap-2 pl-10 pr-2">
                  {!isDropset && (
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 ml-1" onClick={() => addSet(we.id, set.set_number)}>+ Drop</Button>
                  )}
                  {set.notes && <span className="text-[10px] text-muted-foreground italic line-clamp-1">{set.notes}</span>}
                </div>
              </div>
            )})}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2 border-border border-dashed text-muted-foreground hover:text-foreground"
            onClick={() => addSet(we.id)}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Set
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
