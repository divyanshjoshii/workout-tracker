"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function startWorkout(splitDayId: string | null, formData?: FormData) {
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
      date: formData?.get('localDate') as string || new Date().toISOString().split('T')[0]
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

export async function saveAsTemplate(sessionId: string, templateName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Fetch session exercises and their sets
  const { data: workoutExercises } = await supabase
    .from("workout_exercises")
    .select(`
      *,
      workout_sets (id)
    `)
    .eq("session_id", sessionId)
    .order("exercise_order", { ascending: true })

  if (!workoutExercises || workoutExercises.length === 0) {
    throw new Error("Cannot save an empty template")
  }

  // Create template
  const { data: template, error: templateError } = await supabase
    .from("workout_templates")
    .insert({
      user_id: user.id,
      name: templateName
    })
    .select()
    .single()

  if (templateError || !template) throw new Error("Failed to create template")

  // Insert template exercises
  const templateExercisesData = workoutExercises.map((we: any, index) => ({
    template_id: template.id,
    exercise_id: we.exercise_id,
    exercise_order: index + 1,
    target_sets: we.workout_sets ? Math.max(we.workout_sets.length, 1) : 3
  }))

  const { error: insertError } = await supabase
    .from("template_exercises")
    .insert(templateExercisesData)

  if (insertError) throw new Error("Failed to save template exercises")

  revalidatePath("/workout")
  return template.id
}

export async function startWorkoutFromTemplate(templateId: string, splitDayId?: string | null, formData?: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Fetch template and its exercises
  const { data: template } = await supabase
    .from("workout_templates")
    .select("*")
    .eq("id", templateId)
    .single()

  const { data: templateExercises } = await supabase
    .from("template_exercises")
    .select("*")
    .eq("template_id", templateId)
    .order("exercise_order", { ascending: true })

  if (!template || !templateExercises) throw new Error("Template not found")

  // Create session
  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: user.id,
      split_day_id: splitDayId || null,
      name: template.name.replace(/\s*template$/i, ""),
      date: formData?.get('localDate') as string || new Date().toISOString().split('T')[0]
    })
    .select()
    .single()

  if (sessionError || !session) throw new Error("Failed to start session from template")

  // Insert workout exercises
  if (templateExercises.length > 0) {
    const workoutExercisesData = templateExercises.map(te => ({
      session_id: session.id,
      exercise_id: te.exercise_id,
      exercise_order: te.exercise_order
    }))

    const { data: insertedExercises } = await supabase
      .from("workout_exercises")
      .insert(workoutExercisesData)
      .select()
      
    // Insert preset sets
    if (insertedExercises) {
      const setsData: any[] = []
      insertedExercises.forEach((we, index) => {
        const te = templateExercises[index]
        const numSets = te.target_sets || 3
        for (let i = 1; i <= numSets; i++) {
          setsData.push({
            workout_exercise_id: we.id,
            set_number: i,
            weight: null,
            reps: 0
          })
        }
      })
      if (setsData.length > 0) {
        await supabase.from("workout_sets").insert(setsData)
      }
    }
  }

  revalidatePath("/workout")
  redirect(`/workout/${session.id}`)
}

export async function getExerciseHistory(exerciseId: string, currentSessionId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { pr: null, lastSession: null }

  // 1. Get all workout_exercises for this user and exercise
  const { data: weDataRaw } = await supabase
    .from("workout_exercises")
    .select(`
      id,
      session_id,
      workout_sessions!inner(user_id, created_at)
    `)
    .eq("exercise_id", exerciseId)
    .eq("workout_sessions.user_id", user.id)

  if (!weDataRaw || weDataRaw.length === 0) return { pr: null, lastSession: null }
  
  // Filter out the current session if provided
  const weData = currentSessionId ? weDataRaw.filter(we => we.session_id !== currentSessionId) : weDataRaw;

  if (weData.length === 0) return { pr: null, lastSession: null }

  const weIds = weData.map(w => w.id)

  // 2. Get PR (max weight)
  const { data: prData } = await supabase
    .from("workout_sets")
    .select("weight, reps")
    .in("workout_exercise_id", weIds)
    .not("weight", "is", null)
    .order("weight", { ascending: false })
    .order("reps", { ascending: false })
    .limit(1)

  // 3. Get last session data
  const sortedWe = [...weData].sort((a, b) => {
    const tA = new Date((a as any).workout_sessions.created_at).getTime()
    const tB = new Date((b as any).workout_sessions.created_at).getTime()
    return tB - tA
  })
  
  const lastWeId = sortedWe[0].id
  const { data: lastSessionSets } = await supabase
    .from("workout_sets")
    .select("weight, reps, set_number")
    .eq("workout_exercise_id", lastWeId)
    .order("set_number", { ascending: true })

  return {
    pr: prData && prData.length > 0 ? prData[0] : null,
    lastSession: lastSessionSets || []
  }
}

export async function updateTemplateOrder(updates: { id: string, template_order: number }[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Update order for each template
  for (const update of updates) {
    await supabase
      .from("workout_templates")
      .update({ template_order: update.template_order })
      .eq("id", update.id)
      .eq("user_id", user.id)
  }

  revalidatePath("/workout")
  revalidatePath("/")
}

