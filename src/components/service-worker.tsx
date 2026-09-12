"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Registers public/sw.js. When the app opens on the home screen, that page may
// have come from the phone's saved copy, so ask the server for current data
// straight away. The service worker is already refreshing its copy for next time.
export function ServiceWorker() {
  const router = useRouter()

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {})
    if (navigator.serviceWorker.controller && location.pathname === "/") router.refresh()
  }, [router])

  return null
}
