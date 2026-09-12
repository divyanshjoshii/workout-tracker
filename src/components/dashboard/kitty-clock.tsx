"use client"

import { useState, useSyncExternalStore } from "react"
import { Heart } from "lucide-react"
import { KittySit } from "@/components/kitty/kitty"
import { Watchful } from "@/components/kitty/watchful"
import { cn } from "@/lib/utils"

// The current minute as a number, so the clock renders once a minute instead
// of every second. A phone waking from sleep reports a stale minute, so coming
// back to the tab counts as a change too.
function subscribe(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout>
  const schedule = () => {
    timer = setTimeout(() => {
      onChange()
      schedule()
    }, 60_000 - (Date.now() % 60_000))
  }
  schedule()
  document.addEventListener("visibilitychange", onChange)
  return () => {
    clearTimeout(timer)
    document.removeEventListener("visibilitychange", onChange)
  }
}
const currentMinute = () => Math.floor(Date.now() / 60_000)
// The server doesn't know the phone's time zone, so the time fills in on the
// phone. The layout keeps its size meanwhile.
const noMinuteOnServer = () => null

export function KittyClock() {
  const minute = useSyncExternalStore(subscribe, currentMinute, noMinuteOnServer)
  const [pets, setPets] = useState(0)

  const now = minute === null ? null : new Date(minute * 60_000)
  const parts = now
    ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).formatToParts(now)
    : []
  const part = (type: string) => parts.find((p) => p.type === type)?.value
  const week = now
    ? Array.from({ length: 7 }, (_, i) => {
        const day = new Date(now)
        day.setDate(now.getDate() - now.getDay() + i)
        return day
      })
    : []

  return (
    <section aria-label="Clock" className="tile relative">
      <div
        aria-hidden="true"
        className="check absolute inset-y-0 right-0 w-[38%] rounded-r-[calc(var(--radius-3xl)-2px)] [mask-image:linear-gradient(90deg,transparent,#000_28%)]"
      />

      <div className="relative flex flex-col gap-3 p-5 pb-4">
        <div>
          <p className="font-display text-heading text-strawberry">
            {now ? now.toLocaleDateString(undefined, { weekday: "long" }) : " "}
          </p>
          <p className="mt-1 flex items-baseline gap-1.5 font-display text-clock tabular-nums">
            {now ? (
              <>
                <time dateTime={now.toISOString()}>
                  {part("hour")}
                  <span className="animate-tick">:</span>
                  {part("minute")}
                </time>
                {part("dayPeriod") && (
                  <span className="text-base text-muted-foreground">{part("dayPeriod")}</span>
                )}
              </>
            ) : (
              <span className="opacity-0">00:00</span>
            )}
          </p>
          <p className="mt-1.5 text-sm font-bold text-muted-foreground">
            {now ? now.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : " "}
          </p>
        </div>

        <ol className="grid w-[62%] grid-cols-7 gap-0.5 text-center" aria-label="This week">
          {(week.length ? week : Array.from({ length: 7 }, () => null)).map((day, i) => {
            const isToday = day !== null && now !== null && day.getDate() === now.getDate()
            return (
              <li
                key={i}
                aria-current={isToday ? "date" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-full py-1 text-[0.6875rem] leading-none font-bold text-muted-foreground",
                  isToday && "bg-primary text-primary-foreground shadow-[inset_0_-2px_0_0_rgb(200_51_111/0.3)]"
                )}
              >
                <span>{day?.toLocaleDateString(undefined, { weekday: "narrow" }) ?? " "}</span>
                <span className="font-display text-xs tabular-nums">{day?.getDate() ?? " "}</span>
              </li>
            )
          })}
        </ol>
      </div>

      {/* She sits on the top edge, watching the pointer. Tap her and she hops. */}
      <button
        type="button"
        onClick={() => setPets((n) => n + 1)}
        aria-label="Pet the kitty"
        className="absolute right-4 -top-[97px] w-[96px] rounded-3xl [-webkit-tap-highlight-color:transparent]"
      >
        <span key={pets} className={cn("block origin-bottom", pets > 0 && "animate-hop")}>
          <Watchful>
            <KittySit className="w-full" />
          </Watchful>
        </span>
        {pets > 0 && (
          <Heart
            key={`heart-${pets}`}
            aria-hidden="true"
            className="absolute -top-2 left-2 size-6 animate-heart fill-primary text-strawberry"
          />
        )}
      </button>
    </section>
  )
}
