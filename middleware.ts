import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// Se respeta tu importación original desde lib/supabase.ts
import { createSupabaseMiddlewareClient } from "@/lib/supabase";

// --- SOLUCIÓN: Añade esta línea para eliminar las advertencias en Vercel ---
export const runtime = 'nodejs';

export async function middleware(req: NextRequest) {
  // Se usa tu función personalizada para crear el cliente
  const { supabase, response } = await createSupabaseMiddlewareClient(req);

  // Excepción para la vista previa del PDF
  if (req.nextUrl.pathname.startsWith('/dashboard/reportes/health-summary/preview')) {
    console.log("Middleware: Allowing PDF preview route to proceed.");
    return response;
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Middleware: Error fetching session:", sessionError);
  }

  const protectedRoutes = ["/dashboard"];
  const authRoutes = ["/login", "/registro", "/recuperar-password"];

  const isProtectedRoute = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some(
    (route) => req.nextUrl.pathname === route
  );

  // 1. Redirigir a login si se intenta acceder a una ruta protegida sin sesión
  if (isProtectedRoute && !session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirect", req.nextUrl.pathname);
    console.log("Middleware: Redirecting to login from protected route");
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Redirigir al dashboard si se intenta acceder a una ruta de autenticación con sesión activa
  if (isAuthRoute && session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    console.log("Middleware: Redirecting to dashboard from auth route");
    return NextResponse.redirect(redirectUrl);
  }

  // 3. Si no se cumple ninguna condición, continuar
  console.log("Middleware: Allowing request to proceed");
  return response;
}

// Se mantiene tu configuración de rutas para el middleware
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets).*)",
  ],
};