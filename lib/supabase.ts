import {
  createBrowserClient,
  createServerClient,
  type CookieOptions,
} from '@supabase/ssr'
import { type GetServerSidePropsContext } from 'next'
import { type NextApiRequest, type NextApiResponse } from 'next'
import { type NextRequest, NextResponse } from 'next/server' // Keep for Middleware types

// Use environment variables (Recommended!)
// Create a .env.local file in your project root:
// NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
// NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// --- Client for Browser Components ---
// Creates a singleton client instance for the browser environment.
// Use this in your React components and hooks (like use-auth.tsx).
export const supabaseBrowserClient = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
)

// --- Client for Server-Side Rendering (getServerSideProps) ---
// Creates a new client for each server-side request.
// Use this within getServerSideProps functions in your pages.
export function createSupabaseServerClient(context: GetServerSidePropsContext) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return context.req.cookies[name]
      },
      // Set and remove are typically handled by Supabase helper functions
      // or within API routes, not directly in getServerSideProps reads.
      // If you need to set/remove cookies server-side, do it in API routes
      // or use context.res.setHeader('Set-Cookie', ...) carefully.
    },
  })
}

// --- Client for API Routes (pages/api/...) ---
// Creates a new client for each API route request.
// Use this within your API route handlers.
export function createSupabaseApiClient(
  req: NextApiRequest,
  res: NextApiResponse // Response object is needed for setting cookies
) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies[name]
      },
      set(name: string, value: string, options: CookieOptions) {
        // You might need the 'cookie' library for more complex serialization
        // but often setting directly on res works.
        res.setHeader('Set-Cookie', `${name}=${value}; Path=${options.path}; Max-Age=${options.maxAge}; HttpOnly=${options.httpOnly}; SameSite=${options.sameSite}; Secure=${options.secure}`)

      },
      remove(name: string, options: CookieOptions) {
         res.setHeader('Set-Cookie', `${name}=; Path=${options.path}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly=${options.httpOnly}; SameSite=${options.sameSite}; Secure=${options.secure}`)
      },
    },
  })
}

// --- Client for Middleware (middleware.ts) ---
// Creates a client specifically for use within Next.js Middleware.
// Note: Middleware runs on the Edge runtime by default.
export async function createSupabaseMiddlewareClient(req: NextRequest) {
  // Middleware needs to handle the response lifecycle to manage cookies.
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is updated, update the request for the next middleware
          // and the response for the browser
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({ // Create new response to apply changes
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the request and response
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
           response = NextResponse.next({ // Create new response to apply changes
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  return { supabase, response }
}

// --- Helper to get Session (Example for Middleware/Server) ---
// You might place this elsewhere, but shows usage with server clients
export async function getServerSession(supabaseClient: ReturnType<typeof createServerClient>) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
}
