"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database } from "@/types/database"
import { setActiveSplit, deleteSplit } from "@/app/splits/actions"
import { useTransition } from "react"
import { CheckCircle2, Trash2 } from "lucide-react"

type Split = Database["public"]["Tables"]["splits"]["Row"]
type SplitDay = Database["public"]["Tables"]["split_days"]["Row"]

interface SplitCardProps {
  split: Split & { split_days: SplitDay[] }
}

export function SplitCard({ split }: SplitCardProps) {
  const [isPending, startTransition] = useTransition()

  function handleSetActive() {
    startTransition(async () => {
      await setActiveSplit(split.id)
    })
  }

  function handleDelete() {
    if (window.confirm("Are you sure you want to delete this split?")) {
      startTransition(async () => {
        await deleteSplit(split.id)
      })
    }
  }

  return (
    <Card className={`border-border bg-card transition-all ${split.is_active ? 'border-primary ring-1 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{split.name}</CardTitle>
            {split.is_active && (
              <Badge variant="secondary" className="mt-2 bg-primary/20 text-primary hover:bg-primary/30">
                Active Plan
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {split.split_days
            .sort((a, b) => a.day_order - b.day_order)
            .map((day) => (
              <Badge key={day.id} variant="outline" className="border-border text-foreground">
                {day.name}
              </Badge>
            ))}
        </div>
        
        {!split.is_active && (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleSetActive}
            disabled={isPending}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Set as Active
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
