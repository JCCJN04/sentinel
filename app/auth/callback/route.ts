import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Intercambiar el código por una sesión
    await supabase.auth.exchangeCodeForSession(code)
  }

  // URL a la que redirigir después de la autenticación
  return NextResponse.redirect(new URL("/dashboard", request.url))
}
