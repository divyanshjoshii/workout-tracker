"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Plus, Trash2, Calendar, Clock, Save, Trash, Copy, Play } from "lucide-react"
import { useRouter } from "next/navigation"
import { deleteWorkout } from "@/app/actions"
import { saveAsTemplate } from "@/app/workout/actions"

import { ExercisePicker } from "./exercise-picker"
import { FeelingSelector, type Feeling } from "./feeling-selector"
import { useWorkoutExercises } from "./use-workout-exercises"
import { supersetFlags, type Exercise, type Session, type WorkoutExercise } from "./types"

interface EditWorkoutProps {
  session: Session
  initialWorkoutExercises: WorkoutExercise[]
  allExercises: Exercise[]
  targetMuscles?: string[]
}

export function EditWorkout({ session, initialWorkoutExercises, allExercises, targetMuscles = [] }: EditWorkoutProps) {
  const router = useRouter()
  const {
    workoutExercises, supabase,
    addExercise, removeExercise, addSet, updateSet, removeSet, toggleSupersetLink,
  } = useWorkoutExercises(session.id, initialWorkoutExercises)

  const [isPending, startTransition] = useTransition()
  const [templateName, setTemplateName] = useState(session.name + " Template")
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)

  // Session details
  const [name, setName] = useState(session.name)
  const [date, setDate] = useState(session.date)
  const [durationMinutes, setDurationMinutes] = useState(session.duration_seconds ? String(Math.round(session.duration_seconds / 60)) : "")
  const [feeling, setFeeling] = useState<Feeling>((session.feeling as Feeling) || "Medium")

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
      await supabase
        .from("workout_sessions")
        .update({
          name,
          date,
          feeling,
          duration_seconds: durationMinutes ? Number(durationMinutes) * 60 : null
        })
        .eq("id", session.id)

      router.push("/progress")
      router.refresh()
    })
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
        {workoutExercises.map((we, index) => {
          const { isLinkedToNext, isLinkedToPrev, hasNext, isSupersetFirst } = supersetFlags(workoutExercises, index)

          return (
          <div key={we.id} className="relative mt-2">
            {isSupersetFirst && (
               <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-[10px] uppercase font-bold px-2 py-0.5 rounded-full z-20 shadow-sm">
                 SUPERSET
               </div>
            )}
            <Card
              className={`bg-card relative z-10
                ${isLinkedToNext ? 'rounded-b-none border-b-0' : 'border-border border'}
                ${isLinkedToPrev ? 'rounded-t-none border-t-0' : 'border-border border'}
                ${isLinkedToNext || isLinkedToPrev ? 'border-primary/30 border-l-4' : ''}
              `}
            >
              {isLinkedToPrev && <div className="h-px bg-border/50 mx-4 mt-2"></div>}
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg text-primary flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span>{we.exercises.name}</span>
                    {hasNext && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-6 text-[10px] px-2 rounded-full border ${isLinkedToNext ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20' : 'text-muted-foreground border-border hover:text-foreground'}`}
                        onClick={() => toggleSupersetLink(index)}
                      >
                        {isLinkedToNext ? '🔗 Unlink Superset' : '🔗 Superset Below'}
                      </Button>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeExercise(we.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
          </div>
        )})}
      </div>

      <ExercisePicker allExercises={allExercises} targetMuscles={targetMuscles} onPick={addExercise} />

      <FeelingSelector value={feeling} onChange={setFeeling} />

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
