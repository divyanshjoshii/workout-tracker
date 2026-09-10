// Epley formula. Used for PR ranking on the dashboard, the exercise detail
// chart, and the per-exercise PR line during a workout.
export function e1rm(weight: number, reps: number) {
  return Math.round(weight * (1 + reps / 30))
}

// Best set by estimated 1RM, ties broken by the heavier lift.
export function bestSet<T extends { weight: number | null; reps: number | null }>(sets: T[]) {
  let best: (T & { e1rm: number }) | null = null
  for (const s of sets) {
    if (!s.weight || !s.reps) continue
    const score = e1rm(s.weight, s.reps)
    if (!best || score > best.e1rm || (score === best.e1rm && s.weight > best.weight!)) {
      best = { ...s, e1rm: score }
    }
  }
  return best
}
