"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

// Makes the kitty inside watch the pointer. Her eyes follow it and her head
// tips toward it; bring it over her and she relaxes. On a phone a tap counts,
// and she looks back ahead a moment after the finger lifts.
//
// Positions go straight to CSS variables on this element, so following the
// pointer never re-renders React. eyeLevel is how far down the box her eyes
// sit, as a fraction of its height.
export function Watchful({
  children,
  className,
  eyeLevel = 0.35,
}: {
  children: React.ReactNode
  className?: string
  eyeLevel?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let frame = 0
    let settle: ReturnType<typeof setTimeout> | undefined
    let pointer: { x: number; y: number } | null = null

    function look(x: number, y: number, tilt: number, relaxed: boolean) {
      el!.style.setProperty("--look-x", `${x}px`)
      el!.style.setProperty("--look-y", `${y}px`)
      el!.style.setProperty("--tilt", `${tilt}deg`)
      el!.dataset.relaxed = String(relaxed)
    }

    function update() {
      frame = 0
      if (!pointer) return
      const box = el!.getBoundingClientRect()
      if (box.bottom < 0 || box.top > innerHeight) return

      const dx = pointer.x - (box.left + box.width / 2)
      const dy = pointer.y - (box.top + box.height * eyeLevel)
      const distance = Math.hypot(dx, dy) || 1
      const reach = Math.min(distance / 90, 1)
      const over =
        pointer.x > box.left - 12 && pointer.x < box.right + 12 &&
        pointer.y > box.top - 12 && pointer.y < box.bottom + 12

      // Over her, she leans into it instead of tracking.
      look(
        over ? 0 : (dx / distance) * reach * 2.6,
        over ? 0 : (dy / distance) * reach * 2.2,
        over ? -9 : Math.max(-1, Math.min(1, dx / 200)) * 7,
        over
      )
    }

    function reset() {
      pointer = null
      look(0, 0, 0, false)
    }

    function onPointer(event: PointerEvent) {
      pointer = { x: event.clientX, y: event.clientY }
      if (!frame) frame = requestAnimationFrame(update)
      clearTimeout(settle)
      if (event.pointerType !== "mouse") settle = setTimeout(reset, 1600)
    }

    addEventListener("pointermove", onPointer, { passive: true })
    addEventListener("pointerdown", onPointer, { passive: true })
    document.documentElement.addEventListener("mouseleave", reset)
    return () => {
      removeEventListener("pointermove", onPointer)
      removeEventListener("pointerdown", onPointer)
      document.documentElement.removeEventListener("mouseleave", reset)
      cancelAnimationFrame(frame)
      clearTimeout(settle)
    }
  }, [eyeLevel])

  return (
    <span ref={ref} data-relaxed="false" className={cn("group/kitty block", className)}>
      {children}
    </span>
  )
}
