"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function startWorkout(splitDayId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  // Get the split day name if provided
  let name = "Custom Workout"
  if (splitDayId) {
    const { data: splitDay } = await supabase
      .from("split_days")
      .select("name")
      .eq("id", splitDayId)
      .single()
    if (splitDay) {
      name = splitDay.name
    }
  }

  const { data: session, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: user.id,
      split_day_id: splitDayId,
      name,
      date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
    })
    .select()
    .single()

  if (error || !session) {
    throw new Error("Failed to start workout")
  }

  redirect(`/workout/${session.id}`)
}

export async function finishWorkout(sessionId: string, durationSeconds: number, feeling: string, notes: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const { error } = await supabase
    .from("workout_sessions")
    .update({
      duration_seconds: durationSeconds,
      feeling,
      notes
    })
    .eq("id", sessionId)
    .eq("user_id", user.id)

  if (error) {
    throw new Error("Failed to finish workout")
  }

  revalidatePath("/")
  revalidatePath("/progress")
  redirect("/")
}
