"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createSplit(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const name = formData.get("name") as string
  const days = formData.getAll("days[]") as string[]

  if (!name || days.length === 0) {
    throw new Error("Missing required fields")
  }

  // 1. Create the split
  const { data: split, error: splitError } = await supabase
    .from("splits")
    .insert({
      user_id: user.id,
      name,
      is_active: false // By default not active
    })
    .select()
    .single()

  if (splitError || !split) {
    throw new Error(splitError?.message || "Failed to create split")
  }

  // 2. Insert the days
  const splitDaysData = days.map((dayName, index) => ({
    split_id: split.id,
    name: dayName,
    day_order: index + 1
  }))

  const { error: daysError } = await supabase
    .from("split_days")
    .insert(splitDaysData)

  if (daysError) {
    // Ideally we would rollback the split creation here if this was a transaction
    // Supabase JS doesn't support generic transactions yet, but for MVP this is okay
    throw new Error(daysError.message)
  }

  revalidatePath("/splits")
  redirect("/splits")
}

export async function setActiveSplit(splitId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  // 1. Set all user's splits to inactive
  await supabase
    .from("splits")
    .update({ is_active: false })
    .eq("user_id", user.id)

  // 2. Set the selected split to active
  await supabase
    .from("splits")
    .update({ is_active: true })
    .eq("id", splitId)
    .eq("user_id", user.id)

  revalidatePath("/splits")
  revalidatePath("/workout")
}

export async function deleteSplit(splitId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  await supabase
    .from("splits")
    .delete()
    .eq("id", splitId)
    .eq("user_id", user.id)

  revalidatePath("/splits")
  revalidatePath("/workout")
}
