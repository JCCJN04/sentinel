import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard"];
const AUTH_ROUTES = ["/login", "/registro", "/recuperar-password"];

// ⚠️ Importante: NO declares `export const runtime = 'nodejs'` en middleware.
// Middleware siempre corre en Edge; esa línea sobra y puede causar warnings.

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 0) Permite la vista previa del PDF sin tocar auth
  if (pathname.startsWith("/dashboard/reportes/health-summary/preview")) {
    return NextResponse.next();
  }

  // 1) Chequeo de "sesión" por cookies (sin red, instantáneo)
  //    Cubre nombres usados por Supabase (auth-helpers y ssr)
  const hasAuth =
    !!req.cookies.get("sb-access-token") ||
    !!req.cookies.get("sb-refresh-token") ||
    !!req.cookies.get("supabase-auth-token");

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  // 2) Acceso a rutas protegidas sin sesión -> redirige a login
  if (isProtected && !hasAuth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // 3) Acceso a rutas de auth con sesión -> al dashboard
  if (isAuthRoute && hasAuth) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // 4) Deja pasar todo lo demás
  return NextResponse.next();
}

// Limita el alcance del middleware para evitar tocar assets y APIs
export const config = {
  matcher: [
    // Excluye api, estáticos e imágenes, y además archivos comunes por extensión
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images|assets|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map)).*)",
  ],
};
