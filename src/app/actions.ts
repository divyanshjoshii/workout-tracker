"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function logBodyWeight(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const weightStr = formData.get("weight") as string
  const weight = parseFloat(weightStr)

  if (isNaN(weight) || weight <= 0) {
    throw new Error("Invalid weight")
  }

  const date = new Date().toISOString().split('T')[0] // current date YYYY-MM-DD

  // Check if an entry for today already exists
  const { data: existing } = await supabase
    .from("body_weight_entries")
    .select("id")
    .eq("user_id", user.id)
    .eq("date", date)
    .single()

  if (existing) {
    // Update today's entry
    const { error } = await supabase
      .from("body_weight_entries")
      .update({ weight })
      .eq("id", existing.id)

    if (error) throw new Error(error.message)
  } else {
    // Insert new entry
    const { error } = await supabase
      .from("body_weight_entries")
      .insert({
        user_id: user.id,
        date,
        weight
      })

    if (error) throw new Error(error.message)
  }

  revalidatePath("/")
  revalidatePath("/progress")
}
