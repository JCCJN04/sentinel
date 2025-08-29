import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

// --- SOLUCIÓN: Añade esta línea al principio del archivo ---
// Esto asegura que el middleware se ejecute en el entorno Node.js,
// eliminando las advertencias de compatibilidad con Supabase.
export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // Si el usuario está en una ruta de autenticación y ya tiene sesión, redirige al dashboard
  if ((pathname === '/login' || pathname === '/registro') && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Rutas protegidas
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      // Si no hay sesión, redirige a la página de login
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Si el usuario intenta acceder a la raíz y tiene sesión, llévalo al dashboard
  if (pathname === '/' && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/',
    '/login',
    '/registro',
    '/dashboard/:path*',
  ],
}