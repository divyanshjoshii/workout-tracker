import { requireUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ArrowLeft, Dumbbell, Activity, Target } from "lucide-react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { KittyFace } from "@/components/kitty/kitty"
import { FavoriteButton } from "@/components/exercises/favorite-button"
import { ExerciseProgressCharts } from "@/components/exercises/exercise-progress-charts"

export default async function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { supabase, user } = await requireUser()

  const { data: exercise } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", resolvedParams.id)
    .single()

  if (!exercise) {
    redirect("/exercises")
  }

  const { data: favorite } = await supabase
    .from("favorite_exercises")
    .select("*")
    .eq("user_id", user.id)
    .eq("exercise_id", exercise.id)
    .single()

  const isFavorite = !!favorite

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 px-4 pt-5 pb-6">
      <div className="flex items-center justify-between">
        <Link href="/exercises" aria-label="Back to exercises" className={buttonVariants({ variant: "outline", size: "icon", className: "rounded-full" })}>
          <ArrowLeft className="size-5" />
        </Link>
        <div className="tile rounded-full p-0.5">
          <FavoriteButton exerciseId={exercise.id} userId={user.id} initialIsFavorite={isFavorite} />
        </div>
      </div>

      <div className="tile grid aspect-[4/3] place-items-center overflow-hidden bg-white p-2">
        {exercise.image_url ? (
          <img
            src={exercise.image_url}
            alt={exercise.name}
            className="size-full rounded-[1.25rem] object-contain"
          />
        ) : (
          <KittyFace mood="happy" className="w-28" />
        )}
      </div>

      <div>
        <h1 className="font-display text-title">{exercise.name}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky px-3 py-1.5 text-sm font-bold text-sky-foreground">
            <Target className="size-4" />
            {exercise.muscle_group}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground">
            <Activity className="size-4" />
            {exercise.category}
          </span>
          {exercise.equipment && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-butter px-3 py-1.5 text-sm font-bold text-butter-foreground">
              <Dumbbell className="size-4" />
              {exercise.equipment}
            </span>
          )}
        </div>
      </div>

      <section className="tile p-5">
        <h2 className="font-display text-heading">Instructions</h2>
        <p className="mt-2 leading-relaxed text-foreground/85">
          {exercise.instructions || "No instructions provided for this exercise."}
        </p>
      </section>

      <ExerciseProgressCharts exerciseId={exercise.id} userId={user.id} />
    </div>
  )
}
