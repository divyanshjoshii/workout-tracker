"use client"

import { useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { WorkoutExercise, WorkoutSet } from "./types"

// The active-workout and edit-workout screens differ in chrome, not in what
// editing an exercise list does, so both drive this.
export function useWorkoutExercises(sessionId: string, initial: WorkoutExercise[]) {
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>(initial)
  const supabase = createClient()

  // Inserts that haven't landed yet, by set id. A set is shown the moment it is
  // added, so an edit or delete could otherwise reach the database before the
  // row it targets exists.
  const pendingInserts = useRef(new Map<string, PromiseLike<unknown>>())

  async function addExercise(exerciseId: string) {
    const { data: newWe, error } = await supabase
      .from("workout_exercises")
      .insert({
        session_id: sessionId,
        exercise_id: exerciseId,
        exercise_order: workoutExercises.length + 1,
      })
      .select(`*, exercises(*)`)
      .single()

    if (error || !newWe) return false
    setWorkoutExercises([...workoutExercises, { ...newWe, workout_sets: [] } as WorkoutExercise])
    return true
  }

  async function removeExercise(weId: string) {
    setWorkoutExercises(prev => prev.filter(we => we.id !== weId))
    await supabase.from("workout_exercises").delete().eq("id", weId)
  }

  // parentSetNumber turns the new set into a dropset hanging off that set.
  async function addSet(workoutExerciseId: string, parentSetNumber?: number) {
    const targetWe = workoutExercises.find(we => we.id === workoutExerciseId)
    if (!targetWe) return

    let setNumber: number
    let setType = "normal"
    let source

    if (parentSetNumber !== undefined) {
      setNumber = parentSetNumber
      setType = "dropset"
      const parentSets = targetWe.workout_sets.filter(s => s.set_number === parentSetNumber)
      source = parentSets[parentSets.length - 1]
    } else {
      setNumber = Math.max(...targetWe.workout_sets.map(s => s.set_number), 0) + 1
      source = targetWe.workout_sets[targetWe.workout_sets.length - 1]
    }

    // Show the row immediately and write it in the background, instead of
    // waiting a round trip to Seoul before anything appears. The id is made
    // here so there is nothing to swap in afterwards; the column only falls
    // back to gen_random_uuid() when no id is given.
    const newSet: WorkoutSet = {
      id: crypto.randomUUID(),
      workout_exercise_id: workoutExerciseId,
      set_number: setNumber,
      set_type: setType,
      weight: source ? source.weight : null,
      reps: source ? source.reps : 0,
      rpe: null,
      notes: null,
      is_bodyweight: false,
      created_at: new Date().toISOString(),
    }
    setWorkoutExercises(prev =>
      prev.map(we => (we.id === workoutExerciseId ? { ...we, workout_sets: [...we.workout_sets, newSet] } : we))
    )

    const insert = supabase.from("workout_sets").insert({
      id: newSet.id,
      workout_exercise_id: workoutExerciseId,
      set_number: setNumber,
      set_type: setType,
      weight: newSet.weight,
      reps: newSet.reps,
    })
    pendingInserts.current.set(newSet.id, insert)
    const { error } = await insert
    pendingInserts.current.delete(newSet.id)

    // Take it back out if the write was refused.
    if (error) {
      setWorkoutExercises(prev =>
        prev.map(we => (we.id === workoutExerciseId ? { ...we, workout_sets: we.workout_sets.filter(s => s.id !== newSet.id) } : we))
      )
    }
  }

  async function updateSet(workoutExerciseId: string, setId: string, field: string, value: any) {
    const numValue = field === "weight" || field === "reps" ? (value === "" ? null : Number(value)) : value

    setWorkoutExercises(prev =>
      prev.map(we =>
        we.id === workoutExerciseId
          ? { ...we, workout_sets: we.workout_sets.map(s => (s.id === setId ? { ...s, [field]: numValue } : s)) }
          : we
      )
    )

    await pendingInserts.current.get(setId)
    await supabase.from("workout_sets").update({ [field]: numValue }).eq("id", setId)
  }

  async function removeSet(workoutExerciseId: string, setId: string) {
    setWorkoutExercises(prev =>
      prev.map(we =>
        we.id === workoutExerciseId
          ? { ...we, workout_sets: we.workout_sets.filter(s => s.id !== setId) }
          : we
      )
    )
    await pendingInserts.current.get(setId)
    await supabase.from("workout_sets").delete().eq("id", setId)
  }

  // Links an exercise to the one below it, or breaks that link.
  async function toggleSupersetLink(currentIndex: number) {
    const currentWe = workoutExercises[currentIndex]
    const nextWe = workoutExercises[currentIndex + 1]
    if (!nextWe) return

    const setSupersetId = (id: string, supersetId: string | null) =>
      supabase.from("workout_exercises").update({ superset_id: supersetId }).eq("id", id)

    if (currentWe.superset_id && currentWe.superset_id === nextWe.superset_id) {
      await setSupersetId(nextWe.id, null)
      setWorkoutExercises(prev => prev.map((we, idx) => (idx === currentIndex + 1 ? { ...we, superset_id: null } : we)))

      // Drop the current one out of the group too if nothing else was in it.
      const otherLinked = workoutExercises.some(
        (we, idx) => idx !== currentIndex && idx !== currentIndex + 1 && we.superset_id === currentWe.superset_id
      )
      if (!otherLinked) {
        await setSupersetId(currentWe.id, null)
        setWorkoutExercises(prev => prev.map(we => (we.id === currentWe.id ? { ...we, superset_id: null } : we)))
      }
      return
    }

    const supersetId = currentWe.superset_id || crypto.randomUUID()
    if (!currentWe.superset_id) await setSupersetId(currentWe.id, supersetId)
    await setSupersetId(nextWe.id, supersetId)

    setWorkoutExercises(prev =>
      prev.map(we => (we.id === currentWe.id || we.id === nextWe.id ? { ...we, superset_id: supersetId } : we))
    )
  }

  return {
    workoutExercises,
    setWorkoutExercises,
    supabase,
    addExercise,
    removeExercise,
    addSet,
    updateSet,
    removeSet,
    toggleSupersetLink,
  }
}
