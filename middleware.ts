import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase";

// ⛔️ No declares `export const runtime = 'nodejs'` en middleware (siempre es Edge)

const PROTECTED_PREFIXES = ["/dashboard"];
const AUTH_ROUTES = ["/login", "/registro", "/recuperar-password"];

// Detección robusta de cookies de Supabase (distintas versiones/helplers)
function hasSupabaseAuthCookie(req: NextRequest) {
  const cookies = req.cookies.getAll().map((c) => c.name);
  // Casos comunes:
  // - sb-access-token / sb-refresh-token
  // - supabase-auth-token
  // - cookies con prefijo "sb-" de helpers más nuevos
  return cookies.some((name) =>
    /^(sb[-_:].*access|sb[-_:].*refresh|sb[-_:]|supabase-auth-token)/i.test(
      name
    )
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 0) Preflight/CORS y archivos especiales: dejar pasar
  if (
    req.method === "OPTIONS" ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  // 1) Crear el cliente de Supabase VINCULADO A LA RESPUESTA (sin I/O)
  //    Esto permite refresco/rotación de cookies como antes.
  const { response } = await createSupabaseMiddlewareClient(req);

  // 2) Excepción: vista previa PDF (sin auth)
  if (pathname.startsWith("/dashboard/reportes/health-summary/preview")) {
    return response; // mantener respuesta que porta las cookies
  }

  // 3) Chequeo de "sesión" solo por cookies (instantáneo, sin red)
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const hasAuth = hasSupabaseAuthCookie(req);

  // 4) Rutas protegidas sin sesión → login
  if (isProtected && !hasAuth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // 5) Rutas de auth con sesión → dashboard
  if (isAuthRoute && hasAuth) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // 6) Continuar flujo normal con la respuesta enlazada a Supabase
  return response;
}

// Limita el alcance del middleware para evitar tocar assets/APIs y reducir “failed to fetch”
export const config = {
  matcher: [
    // Excluye API, estáticos e imágenes y extensiones comunes
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images|assets|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map)).*)",
  ],
};
