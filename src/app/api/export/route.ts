import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// RFC 4180: wrap in quotes, double any quote inside.
const q = (v: unknown) => (v == null || v === "" ? "" : `"${String(v).replace(/"/g, '""')}"`)

const HEADER = "Date,Workout Name,Duration (s),Feeling,Exercise Name,Set Number,Weight (kg),Reps,Notes"

// The client is untyped (Database is never handed to createClient), so name the
// shape the nested select below returns rather than reaching through `any`.
type ExportSet = { set_number: number; weight: number | null; reps: number | null; notes: string | null }
type ExportExercise = {
  exercise_order: number
  exercises: { name: string } | null
  workout_sets: ExportSet[] | null
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Sets hang off workout_exercises, not off the session directly -- there is
    // no foreign key from workout_sessions to workout_sets to select through.
    const { data: sessions, error } = await supabase
      .from("workout_sessions")
      .select(`
        name,
        date,
        duration_seconds,
        feeling,
        created_at,
        workout_exercises (
          exercise_order,
          exercises ( name ),
          workout_sets ( set_number, weight, reps, notes )
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    const rows = [HEADER]

    for (const session of sessions ?? []) {
      const base = [session.date, q(session.name), session.duration_seconds ?? "", session.feeling ?? ""]

      const exercises = [...((session.workout_exercises ?? []) as unknown as ExportExercise[])].sort(
        (a, b) => a.exercise_order - b.exercise_order
      )

      let wroteAnySet = false

      for (const we of exercises) {
        const name = q(we.exercises?.name ?? "Unknown Exercise")
        const sets = [...(we.workout_sets ?? [])].sort((a, b) => a.set_number - b.set_number)

        for (const set of sets) {
          rows.push([...base, name, set.set_number, set.weight ?? "", set.reps ?? "", q(set.notes)].join(","))
          wroteAnySet = true
        }
      }

      // Keep workouts with nothing logged in the export rather than dropping them.
      if (!wroteAnySet) {
        rows.push([...base, "", "", "", "", ""].join(","))
      }
    }

    return new NextResponse(rows.join("\n") + "\n", {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="workout_history_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })

  } catch (error) {
    console.error("Export error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
