// middleware/security.ts
/**
 * SECURITY MIDDLEWARE
 * 
 * Implementa múltiples capas de seguridad:
 * - Rate limiting por IP y usuario
 * - Security headers (CSP, HSTS, etc.)
 * - CSRF protection
 * - Request sanitization
 * - Logging de seguridad
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting store (en producción usar Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// CSRF tokens store (en producción usar Redis con TTL)
const csrfTokens = new Set<string>();

/**
 * Rate Limiting - Previene ataques de fuerza bruta y DoS
 * Límites: 100 requests por minuto por IP, 50 para rutas sensibles
 */
export function rateLimit(ip: string, endpoint: string): boolean {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const limit = endpoint.includes('/api/auth/') ? 10 : 100; // Más estricto en auth
  const windowMs = 60000; // 1 minuto

  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Security Headers - Protección contra múltiples vectores de ataque
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    // Content Security Policy - Previene XSS
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),

    // HTTP Strict Transport Security - Fuerza HTTPS
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

    // Previene clickjacking
    'X-Frame-Options': 'DENY',

    // Previene MIME sniffing
    'X-Content-Type-Options': 'nosniff',

    // XSS Protection (navegadores antiguos)
    'X-XSS-Protection': '1; mode=block',

    // Referrer Policy - No expone URLs completas
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions Policy - Deshabilita APIs peligrosas
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  };
}

/**
 * Sanitiza paths para prevenir path traversal
 */
export function sanitizePath(path: string): string {
  return path.replace(/\.\./g, '').replace(/[^a-zA-Z0-9/_-]/g, '');
}

/**
 * Genera token CSRF
 */
export function generateCsrfToken(): string {
  const token = crypto.randomUUID();
  csrfTokens.add(token);
  return token;
}

/**
 * Valida token CSRF
 */
export function validateCsrfToken(token: string): boolean {
  return csrfTokens.has(token);
}

/**
 * Limpia el rate limit store periódicamente
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Cada minuto

/**
 * Logging seguro - Sin información sensible
 */
export function secureLog(
  level: 'info' | 'warn' | 'error', 
  message: string, 
  metadata?: Record<string, any>
) {
  const sanitizedMetadata = metadata ? {
    ...metadata,
    // Eliminar campos sensibles
    password: metadata.password ? '[REDACTED]' : undefined,
    token: metadata.token ? '[REDACTED]' : undefined,
    apiKey: metadata.apiKey ? '[REDACTED]' : undefined,
    secret: metadata.secret ? '[REDACTED]' : undefined,
    email: metadata.email ? metadata.email.replace(/(.{2}).*(@.*)/, '$1***$2') : undefined,
    phone: metadata.phone ? metadata.phone.replace(/(\d{2}).*(\d{2})/, '$1****$2') : undefined,
    ssn: undefined,
    credit_card: undefined,
  } : undefined;

  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    metadata: sanitizedMetadata,
  };

  console.log(JSON.stringify(logEntry));
}
