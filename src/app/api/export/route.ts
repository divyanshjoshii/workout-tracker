import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Fetch all workout sessions and their sets
    const { data: sessions, error } = await supabase
      .from("workout_sessions")
      .select(`
        *,
        workout_sets (
          *,
          exercises (name)
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    // Generate CSV String
    let csvStr = "Date,Workout Name,Duration (s),Feeling,Exercise Name,Set Number,Weight (kg),Reps,Notes\n"

    sessions.forEach((session) => {
      const date = new Date(session.created_at).toISOString().split('T')[0]
      const sessionName = `"${session.name.replace(/"/g, '""')}"`
      const duration = session.duration_seconds || ""
      const feeling = session.feeling || ""

      if (session.workout_sets && session.workout_sets.length > 0) {
        // Sort sets by created_at
        const sortedSets = session.workout_sets.sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )

        // Group sets by exercise to determine set number
        const exerciseSetCounts: Record<string, number> = {}

        sortedSets.forEach((set: any) => {
          // @ts-ignore - Supabase nested joins typing can be tricky
          const exerciseNameStr = set.exercises?.name || "Unknown Exercise"
          const exerciseName = `"${exerciseNameStr.replace(/"/g, '""')}"`
          
          exerciseSetCounts[exerciseNameStr] = (exerciseSetCounts[exerciseNameStr] || 0) + 1
          const setNum = exerciseSetCounts[exerciseNameStr]
          
          const weight = set.weight_kg || ""
          const reps = set.reps || ""
          const notes = set.notes ? `"${set.notes.replace(/"/g, '""')}"` : ""

          csvStr += `${date},${sessionName},${duration},${feeling},${exerciseName},${setNum},${weight},${reps},${notes}\n`
        })
      } else {
        // Workout with no sets
        csvStr += `${date},${sessionName},${duration},${feeling},,,,, \n`
      }
    })

    // Return the CSV file
    return new NextResponse(csvStr, {
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
