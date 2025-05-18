import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// Import the correct function from your lib/supabase.ts file
import { createSupabaseMiddlewareClient } from "@/lib/supabase"; // <-- Use YOUR function

export async function middleware(req: NextRequest) {
  // Use the custom client creation function from lib/supabase.ts
  // This function returns both the client and a response object
  // that needs to be managed throughout the middleware.
  const { supabase, response } = await createSupabaseMiddlewareClient(req);

  // Refresh session if expired - important for server-side rendering
  // This also updates the response cookies if needed.
  const {
    data: { session },
    error: sessionError, // Capture potential errors during session fetch
  } = await supabase.auth.getSession();

  // Handle potential errors fetching the session
  if (sessionError) {
    console.error("Middleware: Error fetching session:", sessionError);
    // Decide how to handle this - maybe allow request or redirect to an error page
    // For now, we'll proceed but log the error.
  }

  // Define protected and authentication routes
  const protectedRoutes = ["/dashboard"]; // Add other protected routes as needed
  const authRoutes = ["/login", "/registro", "/recuperar-password"]; // Add other auth routes

  const isProtectedRoute = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some(
    (route) => req.nextUrl.pathname === route
  );

  // 1. Redirect to login if trying to access a protected route without a session
  if (isProtectedRoute && !session) {
    const redirectUrl = req.nextUrl.clone(); // Clone the request URL
    redirectUrl.pathname = "/login"; // Set the path to the login page
    redirectUrl.searchParams.set("redirect", req.nextUrl.pathname); // Add redirect query param
    console.log("Middleware: Redirecting to login from protected route");
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Redirect to dashboard if trying to access an auth route with an active session
  if (isAuthRoute && session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/dashboard"; // Set the path to the dashboard
    redirectUrl.search = ""; // Clear any existing query params like 'redirect'
    console.log("Middleware: Redirecting to dashboard from auth route");
    return NextResponse.redirect(redirectUrl);
  }

  // 3. If none of the above conditions are met, continue the request
  // Return the response object created/updated by createSupabaseMiddlewareClient
  // This ensures any session cookies set/updated by getSession() are passed correctly.
  console.log("Middleware: Allowing request to proceed");
  return response;
}

// Configure the paths where the middleware should run
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (assuming you have an /images folder for static assets)
     * - assets (assuming you have an /assets folder for static assets)
     * Feel free to modify this list based on your needs.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets).*)",
    // Explicitly include specific routes if the above pattern is too broad
    // or if you prefer listing them:
    // "/dashboard/:path*",
    // "/login",
    // "/registro",
    // "/recuperar-password",
  ],
};
