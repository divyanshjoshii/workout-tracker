import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, LogOut, Smartphone, User } from "lucide-react"

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch Profile Name
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single()

  const displayName = profile?.display_name || "Athlete"

  return (
    <div className="flex flex-col p-4 space-y-6 max-w-lg mx-auto pb-24">
      <header className="mt-4">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account and app preferences</p>
      </header>

      {/* Account Info */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center">
            <User className="w-5 h-5 mr-2 text-primary" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Email</div>
            <div className="font-medium text-foreground">{user.email}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Name</div>
            <div className="font-medium text-foreground">{displayName}</div>
          </div>
          
          <div className="pt-2">
            <form action="/auth/signout" method="post">
              <Button variant="destructive" className="w-full bg-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground border-none">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center">
            <Download className="w-5 h-5 mr-2 text-primary" />
            Data
          </CardTitle>
          <CardDescription>
            Download a copy of all your workout sessions and sets. You own your data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/api/export" method="GET">
            <Button variant="secondary" type="submit" className="w-full font-medium">
              Export to CSV
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* PWA App Install Instructions */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center">
            <Smartphone className="w-5 h-5 mr-2 text-primary" />
            Install App
          </CardTitle>
          <CardDescription>
            Get the full native experience by adding this app to your home screen. It works completely offline!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="bg-muted/30 p-3 rounded-md">
            <p className="font-medium text-foreground mb-1">iOS (Safari)</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Tap the <span className="font-bold text-foreground">Share</span> icon at the bottom of Safari.</li>
              <li>Scroll down and tap <span className="font-bold text-foreground">Add to Home Screen</span>.</li>
            </ol>
          </div>
          
          <div className="bg-muted/30 p-3 rounded-md">
            <p className="font-medium text-foreground mb-1">Android (Chrome)</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Tap the <span className="font-bold text-foreground">Menu</span> icon (three dots) in Chrome.</li>
              <li>Tap <span className="font-bold text-foreground">Install App</span> or <span className="font-bold text-foreground">Add to Home screen</span>.</li>
            </ol>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-center text-xs text-muted-foreground pt-4 pb-8">
        Workout Tracker MVP v1.0.0<br/>
        Built with Next.js, Supabase, and Tailwind CSS.
      </div>
    </div>
  )
}
