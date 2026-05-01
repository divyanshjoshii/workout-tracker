import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database } from "@/types/database"
import Link from "next/link"
import { Dumbbell } from "lucide-react"

type Exercise = Database["public"]["Tables"]["exercises"]["Row"]

interface ExerciseCardProps {
  exercise: Exercise
  actionSlot?: React.ReactNode
}

export function ExerciseCard({ exercise, actionSlot }: ExerciseCardProps) {
  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm transition-all hover:border-primary/50">
      <div className="flex items-start justify-between p-4">
        <Link href={`/exercises/${exercise.id}`} className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg line-clamp-1">{exercise.name}</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
              {exercise.muscle_group}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground border-border">
              {exercise.category}
            </Badge>
          </div>
          
          {exercise.equipment && (
            <div className="flex items-center text-xs text-muted-foreground mt-2">
              <Dumbbell className="w-3 h-3 mr-1" />
              {exercise.equipment}
            </div>
          )}
        </Link>
        {actionSlot && (
          <div className="ml-2 pl-2 border-l border-border/50">
            {actionSlot}
          </div>
        )}
      </div>
    </Card>
  )
}
