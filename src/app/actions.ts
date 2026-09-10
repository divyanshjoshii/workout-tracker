"use server"

import { requireUserAction } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function logBodyWeight(formData: FormData) {
  const { supabase, user } = await requireUserAction()

  const weightStr = formData.get("weight") as string
  const weight = parseFloat(weightStr)

  if (isNaN(weight) || weight <= 0) {
    throw new Error("Invalid weight")
  }

  const date = new Date().toISOString().split('T')[0] // current date YYYY-MM-DD

  const { error } = await supabase
    .from("body_weight_entries")
    .upsert({ user_id: user.id, date, weight }, { onConflict: "user_id,date" })

  if (error) throw new Error(error.message)

  revalidatePath("/")
  revalidatePath("/progress")
}

export async function createPastWorkout(formData: FormData) {
  const { supabase, user } = await requireUserAction()

  const name = formData.get("name") as string || "Past Workout"
  const date = formData.get("date") as string
  const durationMinsStr = formData.get("duration") as string
  
  const durationSecs = durationMinsStr ? parseInt(durationMinsStr) * 60 : null

  const { data: session, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: user.id,
      name,
      date,
      duration_seconds: durationSecs,
      feeling: "Medium"
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  return session.id
}

export async function deleteWorkout(sessionId: string) {
  const { supabase, user } = await requireUserAction()

  const { error } = await supabase
    .from("workout_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)

  revalidatePath("/progress")
  revalidatePath("/")
}

export async function updateHallOfFame(exerciseIds: string[]) {
  const { supabase, user } = await requireUserAction()

  // Ensure maximum 3 ids
  const idsToSave = exerciseIds.slice(0, 3)

  const { error } = await supabase
    .from("profiles")
    .update({ hall_of_fame: idsToSave })
    .eq("id", user.id)

  if (error) {
    throw new Error("Failed to update Hall of Fame")
  }

  revalidatePath("/")
}
