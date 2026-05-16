"use client"

import { useState, useTransition } from "react"
import { Database } from "@/types/database"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Check, Plus, Trash2, Calendar, Clock, Save, Trash, Copy, Play } from "lucide-react"
import { useRouter } from "next/navigation"
import { deleteWorkout } from "@/app/actions"
import { saveAsTemplate } from "@/app/workout/actions"

type Exercise = Database["public"]["Tables"]["exercises"]["Row"]
type Session = Database["public"]["Tables"]["workout_sessions"]["Row"]
type WorkoutSet = Database["public"]["Tables"]["workout_sets"]["Row"]
type WorkoutExercise = Database["public"]["Tables"]["workout_exercises"]["Row"] & {
  exercises: Exercise
  workout_sets: WorkoutSet[]
}

interface EditWorkoutProps {
  session: Session
  initialWorkoutExercises: WorkoutExercise[]
  allExercises: Exercise[]
  targetMuscles?: string[]
}

export function EditWorkout({ session, initialWorkoutExercises, allExercises, targetMuscles = [] }: EditWorkoutProps) {
  const router = useRouter()
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>(initialWorkoutExercises)
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showTargetedOnly, setShowTargetedOnly] = useState(targetMuscles.length > 0)
  const [isPending, startTransition] = useTransition()
  const [templateName, setTemplateName] = useState(session.name + " Template")
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  
  // Session details
  const [name, setName] = useState(session.name)
  const [date, setDate] = useState(session.date)
  const [durationMinutes, setDurationMinutes] = useState(session.duration_seconds ? Math.round(session.duration_seconds / 60) : "")
  const [feeling, setFeeling] = useState(session.feeling || "Medium")

  const supabase = createClient()

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
    const reps = prevSet ? prevSet.reps : null

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

  function handleDelete() {
    if (confirm("Are you sure you want to delete this workout? This action cannot be undone.")) {
      startTransition(async () => {
        await deleteWorkout(session.id)
        router.push("/progress")
        router.refresh()
      })
    }
  }

  function handleSaveTemplate() {
    startTransition(async () => {
      try {
        await saveAsTemplate(session.id, templateName)
        setIsTemplateDialogOpen(false)
        alert("Template saved successfully!")
      } catch (err: any) {
        alert(err.message || "Failed to save template")
      }
    })
  }

  function handleSave() {
    startTransition(async () => {
      const durationSecs = durationMinutes ? Number(durationMinutes) * 60 : null
      
      await supabase
        .from("workout_sessions")
        .update({
          name,
          date,
          feeling,
          duration_seconds: durationSecs
        })
        .eq("id", session.id)

      router.push("/progress")
      router.refresh()
    })
  }

  // --- Render ---
  let filteredExercises = allExercises.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
  
  if (showTargetedOnly && targetMuscles.length > 0) {
    filteredExercises = filteredExercises.filter(e => targetMuscles.includes(e.muscle_group))
  }

  return (
    <div className="flex flex-col p-4 space-y-6 max-w-lg mx-auto pb-24">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Edit Workout</h1>
        <div className="flex gap-2">
          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
              <Copy className="h-4 w-4 mr-2" />
              Save as Template
            </DialogTrigger>
            <DialogContent className="sm:max-w-md w-[95vw] rounded-xl bg-card border-border">
              <DialogHeader>
                <DialogTitle>Save as Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Template Name</label>
                  <Input 
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Heavy Pull Day"
                    className="bg-background"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  This will save the current exercises in this workout as a reusable template.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveTemplate} disabled={isPending || !templateName}>
                  {isPending ? "Saving..." : "Save Template"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={() => router.push(`/workout/${session.id}`)} variant="secondary" className="h-9 px-4 font-semibold">
            <Play className="w-4 h-4 mr-2" /> Resume
          </Button>
          <Button onClick={handleSave} disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9 px-4">
            <Save className="w-4 h-4 mr-2" /> Save
          </Button>
        </div>
      </header>

      {/* Session Details */}
      <Card className="border-border bg-card">
        <CardContent className="pt-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Workout Name</label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="bg-background border-border"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center"><Calendar className="w-3 h-3 mr-1" /> Date</label>
              <Input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="bg-background border-border"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center"><Clock className="w-3 h-3 mr-1" /> Duration (mins)</label>
              <Input 
                type="number" 
                value={durationMinutes} 
                onChange={(e) => setDurationMinutes(e.target.value)} 
                className="bg-background border-border"
                placeholder="e.g. 45"
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
                <div className="grid grid-cols-[3rem_1fr_1fr_3rem] gap-2 text-xs font-semibold text-muted-foreground uppercase text-center mb-2">
                  <span>Set</span>
                  <span>kg</span>
                  <span>Reps</span>
                  <span></span>
                </div>
                
                {we.workout_sets
                  .sort((a, b) => a.set_number - b.set_number)
                  .map((set, idx) => (
                    <div key={set.id} className="grid grid-cols-[3rem_1fr_1fr_3rem] gap-2 items-center">
                      <div className="text-center font-medium bg-secondary/20 text-secondary rounded-md h-9 flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <Input
                        type="number"
                        placeholder="--"
                        value={set.weight ?? ""}
                        onChange={(e) => updateSet(we.id, set.id, "weight", e.target.value)}
                        className="h-9 text-center bg-background border-border"
                      />
                      <Input
                        type="number"
                        placeholder="--"
                        value={set.reps || ""}
                        onChange={(e) => updateSet(we.id, set.id, "reps", e.target.value)}
                        className="h-9 text-center bg-background border-border"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeSet(we.id, set.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                
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
      
      {/* Workout Feeling Selector */}
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

      <div className="pt-8">
        <Button 
          variant="destructive" 
          onClick={handleDelete} 
          disabled={isPending}
          className="w-full h-12 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/20"
        >
          <Trash className="w-4 h-4 mr-2" />
          Delete Workout
        </Button>
      </div>
    </div>
  )
}
