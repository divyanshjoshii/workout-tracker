"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Plus, Trash2, Calendar, Clock, Save, Trash, Copy, Play, Link2, Unlink } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { deleteWorkout } from "@/app/actions"
import { saveAsTemplate } from "@/app/workout/actions"

import { ExercisePicker } from "./exercise-picker"
import { FeelingSelector, type Feeling } from "./feeling-selector"
import { useWorkoutExercises } from "./use-workout-exercises"
import { supersetFlags, type Session, type WorkoutExercise } from "./types"

interface EditWorkoutProps {
  session: Session
  initialWorkoutExercises: WorkoutExercise[]
  targetMuscles?: string[]
}

export function EditWorkout({ session, initialWorkoutExercises, targetMuscles = [] }: EditWorkoutProps) {
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
    <div className="mx-auto flex max-w-md flex-col gap-5 px-4 pt-5 pb-8">
      <header className="flex flex-col gap-3 pt-1">
        <h1 className="font-display text-title">Edit workout</h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSave} disabled={isPending} className="rounded-full">
            <Save /> Save
          </Button>
          <Button onClick={() => router.push(`/workout/${session.id}`)} variant="secondary" className="rounded-full">
            <Play fill="currentColor" /> Resume
          </Button>
          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogTrigger render={<Button variant="outline" className="rounded-full" />}>
              <Copy /> Save as template
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Save as template</DialogTitle>
                <DialogDescription>
                  Saves the exercises in this workout as a routine you can start again.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2 pb-1">
                <Label htmlFor="template-name">Template name</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Heavy Pull Day"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveTemplate} disabled={isPending || !templateName}>
                  {isPending ? "Saving..." : "Save template"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Session Details */}
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="workout-name">Workout name</Label>
            <Input
              id="workout-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="workout-date"><Calendar className="size-3.5" /> Date</Label>
              <Input
                id="workout-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="workout-duration"><Clock className="size-3.5" /> Minutes</Label>
              <Input
                id="workout-duration"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="e.g. 45"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-5">
        {workoutExercises.map((we, index) => {
          const { isLinkedToNext, isLinkedToPrev, hasNext, isSupersetFirst } = supersetFlags(workoutExercises, index)
          const linked = isLinkedToNext || isLinkedToPrev

          return (
          <div key={we.id} className={isLinkedToPrev ? "relative -mt-5" : "relative mt-1"}>
            {isSupersetFirst && (
              <span className="absolute -top-3 left-5 z-20 inline-flex items-center gap-1 rounded-full border-2 border-card bg-sky px-2.5 py-0.5 text-xs font-bold text-sky-foreground">
                <Link2 className="size-3.5" /> Superset
              </span>
            )}
            <Card
              className={cn(
                "relative z-10 gap-3 py-4",
                linked && "bg-[color-mix(in_oklab,var(--sky)_32%,var(--card))]",
                isLinkedToNext && "rounded-b-none border-b-0 shadow-none",
                isLinkedToPrev && "rounded-t-none border-t-2 border-dashed border-t-[color-mix(in_oklab,var(--sky-foreground)_18%,transparent)]"
              )}
            >
              <CardHeader className="flex flex-row items-start gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-[1.0625rem] leading-snug">{we.exercises.name}</CardTitle>
                  {hasNext && (
                    <Button
                      variant={isLinkedToNext ? "secondary" : "outline"}
                      size="xs"
                      className="mt-1.5 rounded-full"
                      onClick={() => toggleSupersetLink(index)}
                    >
                      {isLinkedToNext ? <Unlink /> : <Link2 />}
                      {isLinkedToNext ? "Unlink superset" : "Superset below"}
                    </Button>
                  )}
                </div>
                <Button variant="ghost" size="icon-sm" aria-label={`Remove ${we.exercises.name}`} className="text-muted-foreground hover:text-destructive [--slide:var(--destructive-soft)]" onClick={() => removeExercise(we.id)}>
                  <Trash2 />
                </Button>
              </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-[2.5rem_1fr_1fr_2.5rem] gap-2 text-center text-[0.6875rem] font-bold text-muted-foreground">
                  <span>Set</span>
                  <span>kg</span>
                  <span>Reps</span>
                  <span></span>
                </div>

                {we.workout_sets
                  .sort((a, b) => a.set_number - b.set_number)
                  .map((set, idx) => (
                    <div key={set.id} className="grid grid-cols-[2.5rem_1fr_1fr_2.5rem] items-center gap-2">
                      <div className="grid h-10 place-items-center rounded-xl bg-sky font-display text-sm text-sky-foreground">
                        {idx + 1}
                      </div>
                      <Input
                        type="number"
                        aria-label="Weight in kg"
                        placeholder="--"
                        value={set.weight ?? ""}
                        onChange={(e) => updateSet(we.id, set.id, "weight", e.target.value)}
                        className="h-10 rounded-xl text-center"
                      />
                      <Input
                        type="number"
                        aria-label="Reps"
                        placeholder="--"
                        value={set.reps || ""}
                        onChange={(e) => updateSet(we.id, set.id, "reps", e.target.value)}
                        className="h-10 rounded-xl text-center"
                      />
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
                  ))}

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
          </div>
        )})}
      </div>

      <ExercisePicker targetMuscles={targetMuscles} onPick={addExercise} />

      <FeelingSelector value={feeling} onChange={setFeeling} />

      <Button
        variant="destructive"
        size="lg"
        onClick={handleDelete}
        disabled={isPending}
        className="mt-4 w-full"
      >
        <Trash />
        Delete workout
      </Button>
    </div>
  )
}
