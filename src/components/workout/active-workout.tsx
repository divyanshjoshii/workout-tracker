"use client"

import { useState, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Check, Timer, X, ChevronLeft, Settings2 } from "lucide-react"
import { finishWorkout } from "@/app/workout/actions"
import { useRouter } from "next/navigation"

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers'

import { SortableExercise } from "./sortable-exercise"
import { ExercisePicker } from "./exercise-picker"
import { FeelingSelector, type Feeling } from "./feeling-selector"
import { useWorkoutExercises } from "./use-workout-exercises"
import { supersetFlags, type Exercise, type Session, type WorkoutExercise } from "./types"

interface ActiveWorkoutProps {
  session: Session
  initialWorkoutExercises: WorkoutExercise[]
  allExercises: Exercise[]
  targetMuscles?: string[]
}

export function ActiveWorkout({ session, initialWorkoutExercises, allExercises, targetMuscles = [] }: ActiveWorkoutProps) {
  const {
    workoutExercises, setWorkoutExercises, supabase,
    addExercise, removeExercise, addSet, updateSet, removeSet, toggleSupersetLink,
  } = useWorkoutExercises(session.id, initialWorkoutExercises)

  const [isPending, startTransition] = useTransition()
  const [feeling, setFeeling] = useState<Feeling>("Medium")

  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({})

  // One clock drives both timers below.
  const [now, setNow] = useState(() => Date.now())
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null)

  // Default Rest Time (in seconds)
  const [defaultRestTime, setDefaultRestTime] = useState(150)
  const [isRestConfigOpen, setIsRestConfigOpen] = useState(false)
  const [customRestInput, setCustomRestInput] = useState("2:30")

  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // --- Timer Logic ---
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const elapsedSeconds = Math.floor((now - new Date(session.created_at).getTime()) / 1000)
  const restTimeLeft = restEndsAt === null ? null : Math.max(0, Math.ceil((restEndsAt - now) / 1000))

  useEffect(() => {
    if (restTimeLeft === 0) navigator.vibrate?.([200, 100, 200])
  }, [restTimeLeft])

  // --- Local Storage Sync ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`workout_ui_${session.id}`)
      if (!saved) return
      const parsed = JSON.parse(saved)
      if (parsed.completedSets) setCompletedSets(parsed.completedSets)
      if (parsed.restEndsAt > Date.now()) setRestEndsAt(parsed.restEndsAt)
      if (parsed.defaultRestTime) {
        setDefaultRestTime(parsed.defaultRestTime)
        setCustomRestInput(formatTime(parsed.defaultRestTime))
      }
    } catch {}
  }, [session.id])

  useEffect(() => {
    localStorage.setItem(`workout_ui_${session.id}`, JSON.stringify({
      completedSets,
      restEndsAt,
      defaultRestTime
    }))
  }, [completedSets, restEndsAt, defaultRestTime, session.id])

  function startRestTimer(seconds: number) {
    setRestEndsAt(Date.now() + seconds * 1000)
  }

  function toggleSetComplete(setId: string) {
    setCompletedSets(prev => {
      const isNowComplete = !prev[setId]
      if (isNowComplete) {
        startRestTimer(defaultRestTime) // Configurable rest timer
      }
      return { ...prev, [setId]: isNowComplete }
    })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setWorkoutExercises((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id)
      const newIndex = items.findIndex((i) => i.id === over.id)

      // A dragged exercise leaves whatever superset it was part of.
      const draggedItem = items[oldIndex]
      if (draggedItem.superset_id) {
        draggedItem.superset_id = null
        supabase.from("workout_exercises").update({ superset_id: null }).eq("id", draggedItem.id).then()
      }

      const newItems = arrayMove(items, oldIndex, newIndex)

      // Fire and forget the reorder.
      newItems.forEach((item, index) => {
        supabase.from("workout_exercises").update({ exercise_order: index + 1 }).eq("id", item.id).then()
      })

      return newItems
    })
  }

  function handleFinish() {
    startTransition(async () => {
      const durationSeconds = Math.floor((Date.now() - new Date(session.created_at).getTime()) / 1000)
      localStorage.removeItem(`workout_ui_${session.id}`)
      await finishWorkout(session.id, durationSeconds, feeling, "Completed successfully")
    })
  }

  function applyRestTimerConfig() {
    const [mins, secs] = customRestInput.split(":")
    const total = Number(mins) * 60 + Number(secs ?? 0)
    if (!isNaN(total) && total > 0) {
      setDefaultRestTime(total)
      setIsRestConfigOpen(false)
    }
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col p-4 space-y-6 max-w-lg mx-auto pb-32">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="shrink-0 -ml-2 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{session.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full w-fit">
                <Timer className="w-3.5 h-3.5 mr-1.5" />
                <span>{formatTime(elapsedSeconds)}</span>
              </div>
              <Dialog open={isRestConfigOpen} onOpenChange={setIsRestConfigOpen}>
                <DialogTrigger render={
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground">
                    <Settings2 className="w-3 h-3 mr-1" /> {formatTime(defaultRestTime)} Rest
                  </Button>
                } />
                <DialogContent className="max-w-xs rounded-xl bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>Default Rest Timer</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">Set your default rest period between sets (MM:SS or MM).</p>
                    <Input
                      value={customRestInput}
                      onChange={(e) => setCustomRestInput(e.target.value)}
                      placeholder="e.g. 2:30"
                      className="bg-background"
                    />
                    <Button onClick={applyRestTimerConfig} className="w-full">Apply</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
        <Button onClick={handleFinish} disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
          <Check className="w-4 h-4 mr-2" /> Finish
        </Button>
      </header>

      <div className="space-y-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
        >
          <SortableContext
            items={workoutExercises.map(we => we.id)}
            strategy={verticalListSortingStrategy}
          >
            {workoutExercises.map((we, index) => {
              const { isLinkedToNext, isLinkedToPrev, hasNext, isSupersetFirst } = supersetFlags(workoutExercises, index)

              return (
              <div key={we.id} className="relative mt-2">
                {isSupersetFirst && (
                   <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-[10px] uppercase font-bold px-2 py-0.5 rounded-full z-20 shadow-sm">
                     SUPERSET
                   </div>
                )}
                <div className="relative z-10">
                  <SortableExercise
                    we={we}
                    completedSets={completedSets}
                    toggleSetComplete={toggleSetComplete}
                    updateSet={updateSet}
                    removeSet={removeSet}
                    addSet={addSet}
                    removeExercise={removeExercise}
                    isLinkedToNext={isLinkedToNext}
                    isLinkedToPrev={isLinkedToPrev}
                    hasNext={hasNext}
                    onToggleLink={() => toggleSupersetLink(index)}
                  />
                </div>
              </div>
            )})}
          </SortableContext>
        </DndContext>
      </div>

      <ExercisePicker allExercises={allExercises} targetMuscles={targetMuscles} onPick={addExercise} />

      {workoutExercises.length > 0 && <FeelingSelector value={feeling} onChange={setFeeling} />}

      {/* Floating Rest Timer */}
      {restTimeLeft !== null && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-card border border-border rounded-full shadow-lg shadow-black/50 p-2 flex items-center justify-between z-50">
          <div className="flex items-center gap-3 pl-2">
            <Timer className={`w-5 h-5 ${restTimeLeft > 0 ? 'text-primary animate-pulse' : 'text-destructive'}`} />
            <span className="font-mono text-lg font-bold">
              {formatTime(restTimeLeft)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-xs font-medium" onClick={() => startRestTimer(restTimeLeft + 30)}>
              +30s
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground" onClick={() => setRestEndsAt(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
