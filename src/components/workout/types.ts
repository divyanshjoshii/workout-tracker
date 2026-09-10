import { Database } from "@/types/database"

export type Exercise = Database["public"]["Tables"]["exercises"]["Row"]
export type Session = Database["public"]["Tables"]["workout_sessions"]["Row"]
export type WorkoutSet = Database["public"]["Tables"]["workout_sets"]["Row"]
export type WorkoutExercise = Database["public"]["Tables"]["workout_exercises"]["Row"] & {
  exercises: Exercise
  workout_sets: WorkoutSet[]
}

// Supersets are stored as a shared superset_id on adjacent rows, so what a card
// needs to know about its own position has to be derived from its neighbours.
export function supersetFlags(list: WorkoutExercise[], index: number) {
  const we = list[index]
  const isLinkedToNext = !!(we.superset_id && index < list.length - 1 && list[index + 1].superset_id === we.superset_id)
  const isLinkedToPrev = !!(we.superset_id && index > 0 && list[index - 1].superset_id === we.superset_id)
  return {
    isLinkedToNext,
    isLinkedToPrev,
    hasNext: index < list.length - 1,
    isSupersetFirst: isLinkedToNext && !isLinkedToPrev,
  }
}
