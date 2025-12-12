// lib/utils/app-url.ts
/**
 * Utility to get the correct app URL for the current environment
 * Handles Vercel deployments automatically
 */

export function getAppUrl(): string {
  // 1. Production on Vercel - use VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // 2. Custom production domain or local dev
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

/**
 * Get the base URL for API calls
 * Safe to use in both client and server
 */
export function getApiBaseUrl(): string {
  return getAppUrl();
}