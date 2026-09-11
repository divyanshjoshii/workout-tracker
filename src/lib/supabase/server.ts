import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Every page and action starts by resolving the signed-in user. The proxy already
// bounces anonymous requests to /login, so these only ever trip on an expired
// session mid-request -- but they also narrow `user` away from null for callers.
// getClaims() verifies the session locally against the project's ES256 key, so
// resolving the user no longer costs a round trip to Supabase Auth on every page
// and action. Callers only ever read id and email.
async function signedInUser() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims ? { id: data.claims.sub, email: data.claims.email } : null
  return { supabase, user }
}

export async function requireUser() {
  const { supabase, user } = await signedInUser()
  if (!user) redirect("/login")
  return { supabase, user }
}

export async function requireUserAction() {
  const { supabase, user } = await signedInUser()
  if (!user) throw new Error("Not authenticated")
  return { supabase, user }
}
