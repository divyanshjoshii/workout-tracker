"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Timer, ArrowRight } from "lucide-react"

export function ActiveWorkoutBanner() {
  const pathname = usePathname()
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [sessionName, setSessionName] = useState<string>("")
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
  const supabase = createClient()

  // Hide banner if we are currently on the active workout page
  const isWorkoutRoute = pathname?.startsWith("/workout/") || pathname === "/workout"

  useEffect(() => {
    async function checkActiveWorkout() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("workout_sessions")
        .select("id, name, created_at")
        .eq("user_id", user.id)
        .is("duration_seconds", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (!error && data) {
        setActiveSessionId(data.id)
        setSessionName(data.name)
        setSessionStartTime(new Date(data.created_at).getTime())
      } else {
        setActiveSessionId(null)
      }
    }

    checkActiveWorkout()

    // Optionally check periodically or listen to route changes
    const interval = setInterval(checkActiveWorkout, 5000)
    return () => clearInterval(interval)
  }, [supabase, pathname])

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
    <div className="fixed bottom-16 left-0 right-0 z-50 px-4 pb-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
      <Link href={`/workout/${activeSessionId}`}>
        <div className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg border border-primary/20 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-background/20 p-2 rounded-full">
              <Timer className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium opacity-80 uppercase tracking-wider">Active Workout</span>
              <span className="font-bold text-sm line-clamp-1">{sessionName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-lg">{formatTime(elapsedSeconds)}</span>
            <ArrowRight className="w-4 h-4 opacity-70" />
          </div>
        </div>
      </Link>
    </div>
  )
}
