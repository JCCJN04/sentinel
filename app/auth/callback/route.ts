import { createServerClient, type CookieOptions } from "@supabase/ssr" // Updated import to include CookieOptions type
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { // The 'get' method itself is correct
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) { // Corrected 'set' method
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // The 'set' method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
              console.error("Error setting cookie:", error)
            }
          },
          remove(name: string, options: CookieOptions) { // Corrected 'remove' method
            try {
              cookieStore.set({ name, value: '', ...options }) // Set value to empty string to remove
            } catch (error) {
              // The 'remove' method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
              console.error("Error removing cookie:", error)
            }
          },
        },
      }
    )

    // Intercambiar el código por una sesión
    await supabase.auth.exchangeCodeForSession(code)
  }

  // URL a la que redirigir después de la autenticación
  return NextResponse.redirect(new URL("/dashboard", request.url))
}