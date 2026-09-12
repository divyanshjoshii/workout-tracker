"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Timer, ArrowRight } from "lucide-react"
import { KittyFace } from "@/components/kitty/kitty"
import { Watchful } from "@/components/kitty/watchful"

export function ActiveWorkoutBanner() {
  const pathname = usePathname()
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [sessionName, setSessionName] = useState<string>("")
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)

  // Hide banner if we are currently on the active workout page
  const isWorkoutRoute = pathname?.startsWith("/workout/") || pathname === "/workout"

  useEffect(() => {
    // Nobody is signed in on the login page, so there is nothing to find.
    if (pathname === "/login") return

    let stale = false

    // RLS already limits this to the signed-in user's sessions, so there is no
    // need to look the user up first. That lookup was a round trip to Supabase
    // Auth on every navigation.
    async function checkActiveWorkout() {
      // Imported here rather than at the top: this banner sits in the root
      // layout, so a top-level import put the Supabase library into every
      // page's startup JavaScript.
      const { createClient } = await import("@/lib/supabase/client")
      const { data, error } = await createClient()
        .from("workout_sessions")
        .select("id, name, created_at")
        .is("duration_seconds", null)
        .order("created_at", { ascending: false })
        .limit(1)
        // No workout in progress is the usual case, not an error. .single()
        // answered it with a 406 on every navigation.
        .maybeSingle()

      if (stale) return
      if (!error && data) {
        setActiveSessionId(data.id)
        setSessionName(data.name)
        setSessionStartTime(new Date(data.created_at).getTime())
      } else {
        setActiveSessionId(null)
      }
    }

    checkActiveWorkout()
    return () => {
      stale = true
    }
  }, [pathname])

  useEffect(() => {
    if (!sessionStartTime) return

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000))
    }, 1000)

    setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000))
    return () => clearInterval(interval)
  }, [sessionStartTime])

  if (!activeSessionId || isWorkoutRoute) return null

  function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 mx-auto w-[calc(100%-1.5rem)] max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500 ease-spring">
      <Link
        href={`/workout/${activeSessionId}`}
        className="tile press slide-fill group relative flex items-center gap-3 border-[rgb(200_51_111/0.25)] bg-primary p-2.5 pr-4 text-primary-foreground shadow-[inset_0_-4px_0_0_rgb(200_51_111/0.3),0_12px_24px_-12px_var(--shadow)] [--slide:#FFB9D4]"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-card">
          <Watchful eyeLevel={0.6} className="w-9">
            <KittyFace blink className="w-full" />
          </Watchful>
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="line-clamp-1 font-bold">{sessionName}</span>
          <span className="flex items-center gap-1 text-xs font-bold opacity-80">
            <Timer className="size-3.5" /> In progress
          </span>
        </span>
        <span className="font-display text-xl tabular-nums">{formatTime(elapsedSeconds)}</span>
        <ArrowRight className="size-4 transition-transform duration-300 ease-spring group-hover:translate-x-1" />
      </Link>
    </div>
  )
}
