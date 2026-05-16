"use client"

import { useState, useTransition, useEffect } from "react"
import { Database } from "@/types/database"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Check, Plus, Timer, X, ChevronLeft, Settings2 } from "lucide-react"
import { finishWorkout } from "@/app/workout/actions"
import { useRouter } from "next/navigation"

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers'

import { SortableExercise } from "./sortable-exercise"

type Exercise = Database["public"]["Tables"]["exercises"]["Row"]
type Session = Database["public"]["Tables"]["workout_sessions"]["Row"]
type WorkoutSet = Database["public"]["Tables"]["workout_sets"]["Row"]
type WorkoutExercise = Database["public"]["Tables"]["workout_exercises"]["Row"] & {
  exercises: Exercise
  workout_sets: WorkoutSet[]
}

interface ActiveWorkoutProps {
  session: Session
  initialWorkoutExercises: WorkoutExercise[]
  allExercises: Exercise[]
  targetMuscles?: string[]
}

export function ActiveWorkout({ session, initialWorkoutExercises, allExercises, targetMuscles = [] }: ActiveWorkoutProps) {
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>(initialWorkoutExercises)
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showTargetedOnly, setShowTargetedOnly] = useState(targetMuscles.length > 0)
  const [isPending, startTransition] = useTransition()
  const [feeling, setFeeling] = useState<"Easy" | "Medium" | "Hard">("Medium")
  
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({})

  // Rest Timer State
  const [restTargetEndTime, setRestTargetEndTime] = useState<number | null>(null)
  const [restTimeLeft, setRestTimeLeft] = useState<number | null>(null)

  // Main Workout Timer State
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Default Rest Time (in seconds)
  const [defaultRestTime, setDefaultRestTime] = useState(150)
  const [isRestConfigOpen, setIsRestConfigOpen] = useState(false)
  const [customRestInput, setCustomRestInput] = useState("2:30")

  const supabase = createClient()
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // --- Timer Logic ---
  useEffect(() => {
    const sessionStart = new Date(session.created_at).getTime()
    
    const interval = setInterval(() => {
      // Main timer
      const now = Date.now()
      setElapsedSeconds(Math.floor((now - sessionStart) / 1000))

      // Rest timer
      if (restTargetEndTime !== null) {
        const remaining = Math.ceil((restTargetEndTime - now) / 1000)
        if (remaining > 0) {
          setRestTimeLeft(remaining)
        } else {
          setRestTimeLeft(0)
          setRestTargetEndTime(null)
          if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate([200, 100, 200])
          }
        }
      }
    }, 1000)

    setElapsedSeconds(Math.floor((Date.now() - sessionStart) / 1000))
    return () => clearInterval(interval)
  }, [restTargetEndTime, session.created_at])

  // --- Local Storage Sync ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(`workout_ui_${session.id}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.completedSets) setCompletedSets(parsed.completedSets)
        if (parsed.restTargetEndTime && parsed.restTargetEndTime > Date.now()) {
          setRestTargetEndTime(parsed.restTargetEndTime)
          setRestTimeLeft(Math.ceil((parsed.restTargetEndTime - Date.now()) / 1000))
        }
        if (parsed.defaultRestTime) {
          setDefaultRestTime(parsed.defaultRestTime)
          setCustomRestInput(formatTime(parsed.defaultRestTime))
        }
      }
    } catch (e) {}
  }, [session.id])

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(`workout_ui_${session.id}`, JSON.stringify({
      completedSets,
      restTargetEndTime,
      defaultRestTime
    }))
  }, [completedSets, restTargetEndTime, defaultRestTime, session.id])

  function startRestTimer(seconds: number) {
    setRestTargetEndTime(Date.now() + seconds * 1000)
    setRestTimeLeft(seconds)
  }

  function stopRestTimer() {
    setRestTargetEndTime(null)
    setRestTimeLeft(null)
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

  // --- Actions ---
  async function addExercise(exerciseId: string) {
    const order = workoutExercises.length + 1
    const { data: newWe, error } = await supabase
      .from("workout_exercises")
      .insert({
        session_id: session.id,
        exercise_id: exerciseId,
        exercise_order: order,
      })
      .select(`*, exercises(*)`)
      .single()

    if (!error && newWe) {
      setWorkoutExercises([...workoutExercises, { ...newWe, workout_sets: [] } as WorkoutExercise])
      setIsAddExerciseOpen(false)
    }
  }

  async function removeExercise(weId: string) {
    setWorkoutExercises(prev => prev.filter(we => we.id !== weId))
    await supabase.from("workout_exercises").delete().eq("id", weId)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setWorkoutExercises((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        
        // Update DB
        const updates = newItems.map((item, index) => ({
          id: item.id,
          exercise_order: index + 1
        }))
        
        // Fire and forget updates
        updates.forEach(async (update) => {
          await supabase.from("workout_exercises").update({ exercise_order: update.exercise_order }).eq("id", update.id)
        })

        return newItems
      })
    }
  }

  async function addSet(workoutExerciseId: string, parentSetNumber?: number) {
    const targetWe = workoutExercises.find(we => we.id === workoutExerciseId)
    if (!targetWe) return

    let setNumber = targetWe.workout_sets.length + 1
    let setType = "normal"
    let weight = null
    let reps = 0

    if (parentSetNumber !== undefined) {
      setNumber = parentSetNumber
      setType = "dropset"
      const parentSets = targetWe.workout_sets.filter(s => s.set_number === parentSetNumber)
      if (parentSets.length > 0) {
        weight = parentSets[parentSets.length - 1].weight
        reps = parentSets[parentSets.length - 1].reps
      }
    } else {
      const prevSet = targetWe.workout_sets[targetWe.workout_sets.length - 1]
      weight = prevSet ? prevSet.weight : null
      reps = prevSet ? prevSet.reps : 0
      const maxSet = Math.max(...targetWe.workout_sets.map(s => s.set_number), 0)
      setNumber = maxSet + 1
    }

    const { data: newSet, error } = await supabase
      .from("workout_sets")
      .insert({
        workout_exercise_id: workoutExerciseId,
        set_number: setNumber,
        set_type: setType,
        weight,
        reps,
      })
      .select()
      .single()

    if (!error && newSet) {
      setWorkoutExercises(prev => prev.map(we => {
        if (we.id === workoutExerciseId) {
          return { ...we, workout_sets: [...we.workout_sets, newSet] }
        }
        return we
      }))
    }
  }

  async function updateSet(workoutExerciseId: string, setId: string, field: string, value: any) {
    let numValue = value
    if (field === "weight" || field === "reps") {
      numValue = value === "" ? null : Number(value)
    }
    
    setWorkoutExercises(prev => prev.map(we => {
      if (we.id === workoutExerciseId) {
        return {
          ...we,
          workout_sets: we.workout_sets.map(s => s.id === setId ? { ...s, [field]: numValue } : s)
        }
      }
      return we
    }))

    await supabase
      .from("workout_sets")
      .update({ [field]: numValue })
      .eq("id", setId)
  }

  async function removeSet(workoutExerciseId: string, setId: string) {
    setWorkoutExercises(prev => prev.map(we => {
      if (we.id === workoutExerciseId) {
        return {
          ...we,
          workout_sets: we.workout_sets.filter(s => s.id !== setId)
        }
      }
      return we
    }))
    await supabase.from("workout_sets").delete().eq("id", setId)
  }

  function handleFinish() {
    startTransition(async () => {
      const start = new Date(session.created_at).getTime()
      const end = new Date().getTime()
      const durationSeconds = Math.floor((end - start) / 1000)

      if (typeof window !== "undefined") {
        localStorage.removeItem(`workout_ui_${session.id}`)
      }
      await finishWorkout(session.id, durationSeconds, feeling, "Completed successfully")
    })
  }

  function applyRestTimerConfig() {
    const parts = customRestInput.split(":")
    let secs = 150
    if (parts.length === 2) {
      secs = parseInt(parts[0]) * 60 + parseInt(parts[1])
    } else if (parts.length === 1) {
      secs = parseInt(parts[0]) * 60
    }
    if (!isNaN(secs) && secs > 0) {
      setDefaultRestTime(secs)
      setIsRestConfigOpen(false)
    }
  }

  // --- Render ---
  let filteredExercises = allExercises.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
  
  if (showTargetedOnly && targetMuscles.length > 0) {
    filteredExercises = filteredExercises.filter(e => targetMuscles.includes(e.muscle_group))
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
              const isSuperset = we.workout_sets.length > 0 && we.workout_sets.some(s => s.set_type === "superset")
              
              return (
              <div key={we.id} className="relative">
                {isSuperset && index > 0 && (
                  <div className="absolute -top-6 left-6 w-4 h-8 border-l-2 border-b-2 border-primary/40 rounded-bl-xl z-0 pointer-events-none"></div>
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
                  />
                </div>
              </div>
            )})}
          </SortableContext>
        </DndContext>
      </div>

      <Dialog open={isAddExerciseOpen} onOpenChange={setIsAddExerciseOpen}>
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
              {filteredExercises.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => addExercise(ex.id)}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-accent/50 transition-colors flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    {ex.image_url ? (
                      <div className="w-10 h-10 rounded-md bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                        <img src={ex.image_url} alt={ex.name} className="object-cover w-full h-full mix-blend-screen" />
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
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {workoutExercises.length > 0 && (
        <Card className="border-border bg-card mt-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-center">How did it feel?</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center gap-2">
            {(["Easy", "Medium", "Hard"] as const).map(f => (
              <Button
                key={f}
                variant={feeling === f ? "default" : "outline"}
                onClick={() => setFeeling(f)}
                className={`flex-1 ${feeling === f ? (f === "Easy" ? "bg-primary text-primary-foreground" : f === "Hard" ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground") : "border-border text-muted-foreground"}`}
              >
                {f}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Floating Rest Timer */}
      {restTimeLeft !== null && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-card border border-border rounded-full shadow-lg shadow-black/50 p-2 flex items-center justify-between z-50">
          <div className="flex items-center gap-3 pl-2">
            <Timer className={`w-5 h-5 ${restTimeLeft > 0 ? 'text-primary animate-pulse' : 'text-destructive'}`} />
            <span className="font-mono text-lg font-bold">
              {restTimeLeft > 0 ? formatTime(restTimeLeft) : "0:00"}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-xs font-medium" onClick={() => startRestTimer(restTimeLeft + 30)}>
              +30s
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground" onClick={stopRestTimer}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
