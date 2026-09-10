import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// The Logout buttons on the dashboard and settings pages post here.
// next/navigation's redirect() answers 307 in a Route Handler, which preserves
// the POST method, so the browser would re-post to /login. Send 303 instead to
// force a GET.
export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 })
}
