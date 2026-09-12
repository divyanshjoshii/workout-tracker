import { requireUser } from "@/lib/supabase/server"
import { buttonVariants } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { SplitCard } from "@/components/splits/split-card"
import { PageHeader } from "@/components/layout/page-header"
import { KittyLift } from "@/components/kitty/kitty"
import { Watchful } from "@/components/kitty/watchful"

export default async function SplitsPage() {
  const { supabase, user } = await requireUser()

  // Fetch all splits for the user, including their days
  const { data: splits } = await supabase
    .from("splits")
    .select(`
      *,
      split_days (*)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Fetch all templates to allow linking
  const { data: templates } = await supabase
    .from("workout_templates")
    .select("id, name")
    .eq("user_id", user.id)
    .order("template_order", { ascending: true })

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 px-4 pb-6">
      <PageHeader
        title="Your splits"
        description="Manage your workout routines."
        aside={
          <Link href="/splits/new" className={buttonVariants({ className: "shrink-0 rounded-full" })}>
            <Plus /> New split
          </Link>
        }
      />

      {(!splits || splits.length === 0) ? (
        <section className="tile flex flex-col items-center px-6 py-8 text-center">
          <Watchful eyeLevel={0.5} className="w-32">
            <KittyLift className="w-full" />
          </Watchful>
          <h2 className="mt-4 font-display text-heading">No splits yet</h2>
          <p className="mt-1.5 text-sm font-bold text-muted-foreground">
            Create a custom split to structure your workout routine (e.g., Push/Pull/Legs).
          </p>
          <Link href="/splits/new" className={buttonVariants({ size: "lg", className: "mt-5 rounded-full" })}>
            Create your first split
          </Link>
        </section>
      ) : (
        <div className="grid gap-4">
          {splits.map((split: any) => (
            <SplitCard key={split.id} split={split} templates={templates || []} />
          ))}
        </div>
      )}
    </div>
  )
}
