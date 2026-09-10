"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const FEELINGS = ["Easy", "Medium", "Hard"] as const
export type Feeling = (typeof FEELINGS)[number]

export function FeelingSelector({ value, onChange }: { value: string; onChange: (f: Feeling) => void }) {
  return (
    <Card className="border-border bg-card mt-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-center">How did it feel?</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center gap-2">
        {FEELINGS.map(f => (
          <Button
            key={f}
            variant={value === f ? "default" : "outline"}
            onClick={() => onChange(f)}
            className={`flex-1 ${value === f ? (f === "Easy" ? "bg-primary text-primary-foreground" : f === "Hard" ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground") : "border-border text-muted-foreground"}`}
          >
            {f}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
