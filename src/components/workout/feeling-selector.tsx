"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KittyFace } from "@/components/kitty/kitty"
import { cn } from "@/lib/utils"

export const FEELINGS = ["Easy", "Medium", "Hard"] as const
export type Feeling = (typeof FEELINGS)[number]

// Each feeling gets the kitty's face for it and a tile colour of its own.
const LOOK = {
  Easy: { mood: "happy", tone: "bg-mint text-mint-foreground" },
  Medium: { mood: "open", tone: "bg-butter text-butter-foreground" },
  Hard: { mood: "closed", tone: "bg-primary text-primary-foreground" },
} as const

export function FeelingSelector({ value, onChange }: { value: string; onChange: (f: Feeling) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">How did it feel?</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="How did it feel?">
        {FEELINGS.map(f => {
          const selected = value === f
          return (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(f)}
              className={cn(
                "press flex flex-col items-center gap-1.5 rounded-[1.25rem] border-2 py-3 text-sm font-bold",
                selected
                  ? cn(LOOK[f].tone, "border-transparent shadow-[inset_0_-3px_0_0_rgb(67_34_47/0.12)]")
                  : "border-border bg-card text-muted-foreground shadow-[inset_0_-3px_0_0_var(--lip)] hover:text-foreground"
              )}
            >
              <KittyFace mood={LOOK[f].mood} className={cn("w-10 transition-transform duration-500 ease-spring", selected && "scale-110")} />
              {f}
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
