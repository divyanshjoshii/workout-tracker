import { requireUser } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, LogOut, Smartphone, User } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { KittyLoaf } from "@/components/kitty/kitty"

export default async function SettingsPage() {
  const { supabase, user } = await requireUser()

  // Fetch Profile Name
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single()

  const displayName = profile?.display_name || "Athlete"

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 px-4 pb-6">
      <PageHeader
        title="Settings"
        description="Manage your account and app preferences."
        aside={<KittyLoaf className="w-24 shrink-0" />}
      />

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <IconChip><User /></IconChip>
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <dl className="flex flex-col gap-2">
            <div className="rounded-2xl bg-muted/70 px-4 py-3">
              <dt className="text-xs font-bold text-muted-foreground">Email</dt>
              <dd className="mt-0.5 truncate font-bold">{user.email}</dd>
            </div>
            <div className="rounded-2xl bg-muted/70 px-4 py-3">
              <dt className="text-xs font-bold text-muted-foreground">Name</dt>
              <dd className="mt-0.5 font-bold">{displayName}</dd>
            </div>
          </dl>

          <form action="/auth/signout" method="post">
            <Button variant="destructive" size="lg" className="w-full">
              <LogOut />
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <IconChip><Download /></IconChip>
            Data
          </CardTitle>
          <CardDescription>
            Download a copy of all your workout sessions and sets. You own your data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/api/export" method="GET">
            <Button variant="secondary" size="lg" type="submit" className="w-full">
              Export to CSV
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* PWA App Install Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <IconChip><Smartphone /></IconChip>
            Install app
          </CardTitle>
          <CardDescription>
            Get the full native experience by adding this app to your home screen. It works completely offline!
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5 text-sm">
          <div className="rounded-2xl bg-muted/70 p-4">
            <p className="font-display text-base">iOS (Safari)</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 font-medium text-muted-foreground marker:font-bold marker:text-strawberry">
              <li>Tap the <span className="font-bold text-foreground">Share</span> icon at the bottom of Safari.</li>
              <li>Scroll down and tap <span className="font-bold text-foreground">Add to Home Screen</span>.</li>
            </ol>
          </div>

          <div className="rounded-2xl bg-muted/70 p-4">
            <p className="font-display text-base">Android (Chrome)</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 font-medium text-muted-foreground marker:font-bold marker:text-strawberry">
              <li>Tap the <span className="font-bold text-foreground">Menu</span> icon (three dots) in Chrome.</li>
              <li>Tap <span className="font-bold text-foreground">Install App</span> or <span className="font-bold text-foreground">Add to Home screen</span>.</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <p className="pt-2 pb-4 text-center text-xs font-bold text-muted-foreground">
        Workout Tracker MVP v1.0.0<br />
        Built with Next.js, Supabase, and Tailwind CSS.
      </p>
    </div>
  )
}

function IconChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground [&_svg]:size-[18px]">
      {children}
    </span>
  )
}
