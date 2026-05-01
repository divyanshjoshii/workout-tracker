"use client"

import { useState, useTransition, useEffect } from "react"
import { Database } from "@/types/database"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Check, Plus, Trash2, Timer, Play, X } from "lucide-react"
import { finishWorkout } from "@/app/workout/actions"

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
  
  // Local state for completed sets (just UI feedback)
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({})

  // Rest Timer State
  const [restTargetEndTime, setRestTargetEndTime] = useState<number | null>(null)
  const [restTimeLeft, setRestTimeLeft] = useState<number | null>(null)

  // Main Workout Timer State
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const supabase = createClient()

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
          // Optional: Vibrate when rest is over
          if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate([200, 100, 200])
          }
        }
      }
    }, 1000)

    // Initial call
    setElapsedSeconds(Math.floor((Date.now() - sessionStart) / 1000))

    return () => clearInterval(interval)
  }, [restTargetEndTime, session.created_at])

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
        // Auto-start a 90s rest timer when completing a set
        startRestTimer(90)
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

  async function addSet(workoutExerciseId: string) {
    const targetWe = workoutExercises.find(we => we.id === workoutExerciseId)
    if (!targetWe) return

    const setNumber = targetWe.workout_sets.length + 1
    const prevSet = targetWe.workout_sets[targetWe.workout_sets.length - 1]
    const weight = prevSet ? prevSet.weight : null
    const reps = prevSet ? prevSet.reps : null // Default to null for clean UI, or use prev

    const { data: newSet, error } = await supabase
      .from("workout_sets")
      .insert({
        workout_exercise_id: workoutExerciseId,
        set_number: setNumber,
        weight,
        reps: reps || 0,
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

  async function updateSet(workoutExerciseId: string, setId: string, field: "weight" | "reps", value: string) {
    const numValue = value === "" ? null : Number(value)
    
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

      await finishWorkout(session.id, durationSeconds, feeling, "Completed successfully")
    })
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{session.name}</h1>
          <div className="flex items-center text-sm font-mono text-primary mt-1 bg-primary/10 px-2 py-0.5 rounded-full w-fit">
            <Timer className="w-3.5 h-3.5 mr-1.5" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>
        </div>
        <Button onClick={handleFinish} disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
          <Check className="w-4 h-4 mr-2" /> Finish
        </Button>
      </header>

      <div className="space-y-6">
        {workoutExercises.map((we) => (
          <Card key={we.id} className="border-border bg-card">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg text-primary flex items-center">
                {we.exercises.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-[3rem_1fr_1fr_3rem_3rem] gap-2 text-xs font-semibold text-muted-foreground uppercase text-center mb-2">
                  <span>Set</span>
                  <span>kg</span>
                  <span>Reps</span>
                  <span>Done</span>
                  <span></span>
                </div>
                
                {we.workout_sets
                  .sort((a, b) => a.set_number - b.set_number)
                  .map((set, idx) => {
                    const isCompleted = completedSets[set.id]
                    return (
                    <div key={set.id} className={`grid grid-cols-[3rem_1fr_1fr_3rem_3rem] gap-2 items-center transition-colors rounded-md p-1 ${isCompleted ? 'bg-primary/10' : ''}`}>
                      <div className="text-center font-medium bg-secondary/20 text-secondary rounded-md h-9 flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <Input
                        type="number"
                        placeholder="--"
                        value={set.weight ?? ""}
                        onChange={(e) => updateSet(we.id, set.id, "weight", e.target.value)}
                        className={`h-9 text-center bg-background border-border ${isCompleted ? 'opacity-70 text-primary border-primary/50' : ''}`}
                      />
                      <Input
                        type="number"
                        placeholder="--"
                        value={set.reps || ""}
                        onChange={(e) => updateSet(we.id, set.id, "reps", e.target.value)}
                        className={`h-9 text-center bg-background border-border ${isCompleted ? 'opacity-70 text-primary border-primary/50' : ''}`}
                      />
                      <Button
                        variant={isCompleted ? "default" : "secondary"}
                        size="icon"
                        className={`h-9 w-full ${isCompleted ? 'bg-primary text-primary-foreground' : ''}`}
                        onClick={() => toggleSetComplete(set.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeSet(we.id, set.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
        ))}
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
              {filteredExercises.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No exercises found.</div>
              )}
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
