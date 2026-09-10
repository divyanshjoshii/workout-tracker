"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

// Both actions redirect on success, so a returned value always means the caller
// has something to show the user.
type AuthResult = { error?: string; message?: string }

export async function login(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/", "layout")
  redirect("/")
}

export async function signup(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  })

  if (error) {
    return { error: error.message }
  }

  // With email confirmation switched on, signUp succeeds but hands back no
  // session. Redirecting to / here would bounce straight back to the login page
  // with nothing explaining why, so say what happened instead.
  if (!data.session) {
    return { message: "Account created. Check your email to confirm it, then sign in." }
  }

  revalidatePath("/", "layout")
  redirect("/")
}
