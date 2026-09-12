"use client"

import { useState, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Check, Timer, X, ChevronLeft, Link2, Settings2 } from "lucide-react"
import { KittyFace, KittyLoaf } from "@/components/kitty/kitty"
import { Watchful } from "@/components/kitty/watchful"
import { finishWorkout } from "@/app/workout/actions"
import { useRouter } from "next/navigation"

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers'

import { SortableExercise } from "./sortable-exercise"
import { ExercisePicker } from "./exercise-picker"
import { FeelingSelector, type Feeling } from "./feeling-selector"
import { useWorkoutExercises } from "./use-workout-exercises"
import { supersetFlags, type Session, type WorkoutExercise } from "./types"

interface ActiveWorkoutProps {
  session: Session
  initialWorkoutExercises: WorkoutExercise[]
  targetMuscles?: string[]
}

export function ActiveWorkout({ session, initialWorkoutExercises, targetMuscles = [] }: ActiveWorkoutProps) {
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
    <div className="mx-auto flex max-w-md flex-col gap-5 px-4 pt-5 pb-24">
      <header className="flex items-start gap-2">
        <Button variant="ghost" size="icon" aria-label="Back to home" onClick={() => router.push("/")} className="-ml-2 shrink-0 text-muted-foreground">
          <ChevronLeft className="size-6" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-title">{session.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 font-display text-sm text-primary-foreground tabular-nums">
              <Timer className="size-4" />
              {formatTime(elapsedSeconds)}
            </span>
            <Dialog open={isRestConfigOpen} onOpenChange={setIsRestConfigOpen}>
              <DialogTrigger render={
                <Button variant="outline" size="sm" className="rounded-full">
                  <Settings2 /> {formatTime(defaultRestTime)} rest
                </Button>
              } />
              <DialogContent className="max-w-xs">
                <DialogHeader>
                  <DialogTitle>Rest between sets</DialogTitle>
                  <DialogDescription>Minutes and seconds, like 2:30, or just minutes.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                  <Input
                    value={customRestInput}
                    onChange={(e) => setCustomRestInput(e.target.value)}
                    placeholder="e.g. 2:30"
                    aria-label="Rest time"
                  />
                  <Button onClick={applyRestTimerConfig} size="lg" className="w-full">Apply</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Button onClick={handleFinish} disabled={isPending} size="lg" className="shrink-0 rounded-full px-4">
          <Check /> Finish
        </Button>
      </header>

      <div className="flex flex-col gap-5">
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
              <div key={we.id} className={isLinkedToPrev ? "relative -mt-5" : "relative mt-1"}>
                {isSupersetFirst && (
                  <span className="absolute -top-3 left-5 z-20 inline-flex items-center gap-1 rounded-full border-2 border-card bg-sky px-2.5 py-0.5 text-xs font-bold text-sky-foreground">
                    <Link2 className="size-3.5" /> Superset
                  </span>
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

      <ExercisePicker targetMuscles={targetMuscles} onPick={addExercise} />

      {workoutExercises.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Watchful eyeLevel={0.6} className="w-20">
            <KittyFace blink className="w-full" />
          </Watchful>
          <p className="font-display text-heading">Nothing logged yet</p>
          <p className="text-sm font-bold text-muted-foreground">Add your first exercise to get going.</p>
        </div>
      )}

      {workoutExercises.length > 0 && <FeelingSelector value={feeling} onChange={setFeeling} />}

      {/* Floating Rest Timer */}
      {restTimeLeft !== null && (
        <div
          role="timer"
          className={`tile fixed inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-50 mx-auto flex w-[calc(100%-1.5rem)] max-w-sm animate-in items-center gap-3 rounded-full p-2 pl-3 duration-500 ease-spring fade-in slide-in-from-bottom-4 ${restTimeLeft === 0 ? "border-primary bg-accent" : ""}`}
        >
          {/* She naps while you rest and wakes when it's time to lift. */}
          {restTimeLeft > 0 ? (
            <KittyLoaf className="w-14 shrink-0" />
          ) : (
            <KittyFace mood="happy" className="w-11 shrink-0 animate-hop" />
          )}
          <div className="flex min-w-0 flex-1 flex-col leading-none">
            <span className="font-display text-2xl tabular-nums">{formatTime(restTimeLeft)}</span>
            <span className="mt-1 text-xs font-bold text-muted-foreground">
              {restTimeLeft > 0 ? "Resting" : "Time for the next set"}
            </span>
          </div>

          <Button variant="outline" size="sm" className="rounded-full" onClick={() => startRestTimer(restTimeLeft + 30)}>
            +30s
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Stop rest timer" className="rounded-full text-muted-foreground" onClick={() => setRestEndsAt(null)}>
            <X />
          </Button>
        </div>
      )}
    </div>
  )
}
