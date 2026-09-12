"use client"

import { useState, useEffect } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, CornerDownRight, FileText, GripVertical, Link2, Plus, Trash2, Trophy, Unlink, Weight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { bestSet } from "@/lib/e1rm"
import { cn } from "@/lib/utils"

import type { WorkoutExercise } from "./types"

type HistorySet = { weight: number | null; reps: number; set_number: number }
type HistoryRow = { workout_sessions: { created_at: string }; workout_sets: HistorySet[] | null }

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

  // Read straight from Supabase in the browser rather than through a server
  // action. Next runs server actions one at a time, so one history call per
  // card queued up in front of every button press on this screen. RLS limits
  // the rows to this user's own workouts.
  useEffect(() => {
    let stale = false
    createClient()
      .from("workout_exercises")
      .select("session_id, workout_sessions!inner(created_at), workout_sets(weight, reps, set_number)")
      .eq("exercise_id", we.exercises.id)
      .neq("session_id", we.session_id)
      .then(({ data }) => {
        const rows = (data ?? []) as unknown as HistoryRow[]
        if (stale || rows.length === 0) return
        setPr(bestSet(rows.flatMap(row => row.workout_sets ?? [])))
        const last = rows.reduce((a, b) =>
          new Date(b.workout_sessions.created_at) > new Date(a.workout_sessions.created_at) ? b : a)
        setLastSessionSets([...(last.workout_sets ?? [])].sort((a, b) => a.set_number - b.set_number))
      })
    return () => {
      stale = true
    }
  }, [we.exercises.id, we.session_id])

  const linked = isLinkedToNext || isLinkedToPrev

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "gap-3 py-4",
        isDragging && "scale-[1.02] opacity-90 shadow-xl ring-4 ring-ring/25",
        linked && "bg-[color-mix(in_oklab,var(--sky)_32%,var(--card))]",
        isLinkedToNext && "rounded-b-none border-b-0 shadow-none",
        isLinkedToPrev && "rounded-t-none border-t-2 border-t-[color-mix(in_oklab,var(--sky-foreground)_18%,transparent)] border-dashed"
      )}
    >
      <CardHeader className="flex flex-row items-start gap-2 px-3 sm:px-5">
        <div {...attributes} {...listeners} aria-label={`Move ${we.exercises.name}`} className="mt-0.5 grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-strawberry active:cursor-grabbing">
          <GripVertical className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-[1.0625rem] leading-snug">{we.exercises.name}</CardTitle>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {pr && pr.weight && (
              <span className="inline-flex items-center gap-1 rounded-full bg-butter px-2.5 py-0.5 text-xs font-bold text-butter-foreground">
                <Trophy className="size-3.5" />
                Best {pr.weight} kg × {pr.reps}
                {pr.e1rm && <span className="font-medium opacity-80">({pr.e1rm} kg e1RM)</span>}
              </span>
            )}
            {hasNext && (
              <Button
                variant={isLinkedToNext ? "secondary" : "outline"}
                size="xs"
                className="rounded-full"
                onClick={onToggleLink}
              >
                {isLinkedToNext ? <Unlink /> : <Link2 />}
                {isLinkedToNext ? "Unlink superset" : "Superset below"}
              </Button>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label={`Remove ${we.exercises.name}`} className="text-muted-foreground hover:text-destructive [--slide:var(--destructive-soft)]" onClick={() => removeExercise(we.id)}>
          <Trash2 />
        </Button>
      </CardHeader>

      <CardContent className="px-3 sm:px-5">
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[2.25rem_1fr_1fr_2.75rem] gap-2 text-center text-[0.6875rem] font-bold text-muted-foreground sm:grid-cols-[2.25rem_1fr_1fr_2.75rem_5rem]">
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
              <div key={set.id} className={cn("flex flex-col gap-1", isDropset && "ml-3 border-l-2 border-dashed border-input pl-3")}>
                <div className={cn(
                  "grid grid-cols-[2.25rem_1fr_1fr_2.75rem] items-center gap-2 rounded-2xl p-1 transition-colors duration-300 sm:grid-cols-[2.25rem_1fr_1fr_2.75rem_5rem]",
                  isCompleted && "bg-accent"
                )}>
                  <button
                    type="button"
                    aria-label={set.notes ? `Edit note: ${set.notes}` : "Add a note"}
                    className="press relative grid h-10 place-items-center rounded-xl bg-sky font-display text-sm text-sky-foreground"
                    onClick={() => {
                      const notes = prompt("Enter notes for this set:", set.notes || "")
                      if (notes !== null) updateSet(we.id, set.id, "notes", notes)
                    }}
                  >
                    {isDropset ? <CornerDownRight className="size-4" /> : set.set_number}
                    {set.notes && <FileText className="absolute -top-1 -right-1 size-3.5 rounded-sm bg-card text-strawberry" />}
                  </button>

                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      aria-label="Weight in kg"
                      placeholder={lastSet && lastSet.weight !== null ? String(lastSet.weight) : "--"}
                      value={set.is_bodyweight ? "" : (set.weight ?? "")}
                      disabled={!!set.is_bodyweight}
                      onChange={(e) => updateSet(we.id, set.id, "weight", e.target.value)}
                      className={cn("h-10 rounded-xl pr-7 text-center", isCompleted && "border-primary bg-card text-strawberry")}
                    />
                    <button
                      type="button"
                      onClick={() => updateSet(we.id, set.id, "is_bodyweight", !set.is_bodyweight)}
                      className={cn(
                        "absolute right-1.5 z-10 grid size-6 place-items-center rounded-lg transition-colors",
                        set.is_bodyweight ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-strawberry"
                      )}
                      aria-pressed={!!set.is_bodyweight}
                      title="Bodyweight"
                    >
                      <Weight className="size-3.5" />
                    </button>
                    {set.is_bodyweight && <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-xl bg-accent pr-6 font-display text-sm text-strawberry">BW</div>}
                  </div>

                  <Input
                    type="number"
                    aria-label="Reps"
                    placeholder={lastSet && lastSet.reps ? String(lastSet.reps) : "--"}
                    value={set.reps || ""}
                    onChange={(e) => updateSet(we.id, set.id, "reps", e.target.value)}
                    className={cn("h-10 rounded-xl text-center", isCompleted && "border-primary bg-card text-strawberry")}
                  />

                  <div className="flex flex-col gap-1">
                    <Button
                      variant={isCompleted ? "default" : "outline"}
                      size="icon"
                      aria-label={isCompleted ? "Mark set not done" : "Mark set done"}
                      aria-pressed={!!isCompleted}
                      className={cn("h-10 w-full rounded-xl", isCompleted && "animate-hop")}
                      onClick={() => toggleSetComplete(set.id)}
                    >
                      <Check className={cn("size-5", !isCompleted && "text-muted-foreground")} />
                    </Button>
                  </div>

                  <div className="hidden gap-1 sm:flex">
                    {!isDropset && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Add dropset"
                        aria-label="Add dropset"
                        className="text-muted-foreground hover:text-strawberry"
                        onClick={() => addSet(we.id, set.set_number)}
                      >
                        <Plus />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove set"
                      className="text-muted-foreground hover:text-destructive [--slide:var(--destructive-soft)]"
                      onClick={() => removeSet(we.id, set.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                {/* Phone controls under the row */}
                <div className="flex items-center gap-1 pl-11 sm:hidden">
                  {!isDropset && (
                    <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={() => addSet(we.id, set.set_number)}>
                      <CornerDownRight /> Drop set
                    </Button>
                  )}
                  <Button variant="ghost" size="xs" aria-label="Remove set" className="text-muted-foreground hover:text-destructive [--slide:var(--destructive-soft)]" onClick={() => removeSet(we.id, set.id)}>
                    <Trash2 /> Remove
                  </Button>
                  {set.notes && <span className="line-clamp-1 text-xs font-medium text-muted-foreground italic">{set.notes}</span>}
                </div>
              </div>
            )})}

          <Button
            variant="outline"
            className="mt-1 h-11 w-full border-dashed border-input text-strawberry"
            onClick={() => addSet(we.id)}
          >
            <Plus /> Add set
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
