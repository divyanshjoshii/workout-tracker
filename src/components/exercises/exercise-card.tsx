import { Badge } from "@/components/ui/badge"
import { Database } from "@/types/database"
import Link from "next/link"
import { Dumbbell } from "lucide-react"

type Exercise = Pick<Database["public"]["Tables"]["exercises"]["Row"], "id" | "name" | "muscle_group" | "category" | "equipment">

interface ExerciseCardProps {
  exercise: Exercise
  actionSlot?: React.ReactNode
}

export function ExerciseCard({ exercise, actionSlot }: ExerciseCardProps) {
  return (
    <div className="tile flex items-center gap-2 p-1.5 pr-2.5 transition-[transform,border-color] duration-300 ease-spring hover:-translate-y-0.5 hover:border-input">
      <Link href={`/exercises/${exercise.id}`} className="press min-w-0 flex-1 rounded-[1.35rem] p-2.5">
        <h3 className="line-clamp-1 text-base font-bold">{exercise.name}</h3>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{exercise.muscle_group}</Badge>
          <Badge variant="outline">{exercise.category}</Badge>
          {exercise.equipment && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
              <Dumbbell className="size-3.5" />
              {exercise.equipment}
            </span>
          )}
        </div>
      </Link>
      {actionSlot}
    </div>
  )
}
