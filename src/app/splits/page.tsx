import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { SplitCard } from "@/components/splits/split-card"

export default async function SplitsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch all splits for the user, including their days
  const { data: splits } = await supabase
    .from("splits")
    .select(`
      *,
      split_days (*)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="flex flex-col p-4 space-y-6 max-w-lg mx-auto pb-24">
      <header className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Splits</h1>
          <p className="text-muted-foreground text-sm">Manage your workout routines</p>
        </div>
        <Link href="/splits/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" /> New Split
          </Button>
        </Link>
      </header>

      {(!splits || splits.length === 0) ? (
        <div className="text-center py-12 px-4 border border-dashed border-border rounded-lg bg-card/50">
          <h3 className="text-lg font-medium mb-2">No splits found</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Create a custom split to structure your workout routine (e.g., Push/Pull/Legs).
          </p>
          <Link href="/splits/new">
            <Button>Create Your First Split</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {splits.map((split: any) => (
            <SplitCard key={split.id} split={split} />
          ))}
        </div>
      )}
    </div>
  )
}
