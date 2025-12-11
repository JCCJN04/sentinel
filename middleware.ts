/**
 * SECURITY: Middleware de autenticación y seguridad
 * - Manejo de sesiones con Supabase
 * - Rate limiting y security headers
 * - Protección de rutas
 * - Logging seguro
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase";
import { rateLimit, getSecurityHeaders, sanitizePath, secureLog } from "@/middleware/security";

export const runtime = 'nodejs';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // SECURITY: Obtener IP del cliente (considerando proxies)
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';

  // SECURITY: Rate limiting
  if (!rateLimit(ip, pathname)) {
    secureLog('warn', 'Rate limit exceeded', { ip, pathname });
    return new NextResponse(
      JSON.stringify({ error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }),
      { 
        status: 429, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }

  // SECURITY: Prevenir path traversal
  const sanitized = sanitizePath(pathname);
  if (sanitized !== pathname) {
    secureLog('warn', 'Path traversal attempt', { ip, pathname });
    return new NextResponse('Forbidden', { status: 403 });
  }

  // SECURITY: Bloquear archivos sensibles
  const blockedPaths = ['/.env', '/package.json', '/.git/', '/node_modules/'];
  if (blockedPaths.some(blocked => pathname.startsWith(blocked))) {
    secureLog('warn', 'Attempt to access sensitive file', { ip, pathname });
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Crear cliente Supabase
  const { supabase, response } = await createSupabaseMiddlewareClient(req);

  // SECURITY: Aplicar security headers a todas las respuestas
  const securityHeaders = getSecurityHeaders();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');

  // Excepción para PDF preview
  if (pathname.startsWith('/dashboard/reportes/health-summary/preview')) {
    return response;
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    secureLog('error', 'Session fetch error', { error: sessionError.message });
  }

  const protectedRoutes = ["/dashboard"];
  const authRoutes = ["/login", "/registro", "/recuperar-password"];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  // SECURITY: Redirigir a login si no hay sesión en ruta protegida
  if (isProtectedRoute && !session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirect", pathname);
    secureLog('info', 'Redirect to login (no session)', { pathname });
    return NextResponse.redirect(redirectUrl);
  }

  // Redirigir al dashboard si hay sesión en ruta de auth
  if (isAuthRoute && session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

// Se mantiene tu configuración de rutas para el middleware
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.gif|.*\\.webp|logo).*)",
  ],
};