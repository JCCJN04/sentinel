// app/api/medications/search/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { secureLog } from '@/middleware/security';

// Database query timeout helper
const DB_TIMEOUT_MS = 10000;
const FDA_TIMEOUT_MS = 15000;

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = DB_TIMEOUT_MS
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    ),
  ]);
}

// Validation schema
const searchSchema = z.object({
  term: z.string()
    .min(2, 'El término debe tener al menos 2 caracteres')
    .max(100, 'El término es demasiado largo')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s-]+$/, 'El término contiene caracteres inválidos')
});

// URL de la API de la FDA
const FDA_API_URL = 'https://api.fda.gov/drug/label.json';

// Es seguro crear este cliente aquí porque este código solo se ejecuta en el servidor.
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const term = searchParams.get('term');

        // Validate input
        const validationResult = searchSchema.safeParse({ term });
        
        if (!validationResult.success) {
            // Return empty array for invalid searches (better UX than error)
            if (term && term.length < 2) {
                return NextResponse.json([]);
            }
            
            secureLog('warn', 'Invalid medication search term', {
                errors: validationResult.error.errors
            });
            return NextResponse.json([]);
        }

        const sanitizedTerm = validationResult.data.term;

        // --- PASO 1: Buscar en nuestro diccionario local (Español) ---
        const localSearchPromise = supabase
            .from('medication_dictionary')
            .select('spanish_name')
            .ilike('spanish_name', `${sanitizedTerm}%`);

        // --- PASO 2: Buscar en la API de FDA (Inglés) ---
        // Sanitize term for URL query (prevent injection)
        const fdaSearchTerm = encodeURIComponent(sanitizedTerm.toUpperCase());
        const fdaQuery = `openfda.brand_name.exact:"${fdaSearchTerm}"+OR+openfda.generic_name.exact:"${fdaSearchTerm}"`;
        const fdaUrl = `${FDA_API_URL}?search=${fdaQuery}&limit=10`;
        
        const fdaSearchPromise = withTimeout(
            fetch(fdaUrl, {
                headers: {
                    'User-Agent': 'MedicalHealthApp/1.0',
                    'Accept': 'application/json'
                }
            }),
            FDA_TIMEOUT_MS
        );
        
        // Ejecutamos ambas búsquedas en paralelo para mayor eficiencia
        const [localResponse, fdaResponse] = await Promise.all([
            (async () => {
                try {
                    return await localSearchPromise;
                } catch (err: any) {
                    secureLog('warn', 'Local medication search failed', {
                        error: err.message
                    });
                    return { data: null, error: err };
                }
            })(),
            fdaSearchPromise.catch(err => {
                secureLog('warn', 'FDA API search failed', {
                    error: err.message
                });
                return new Response(JSON.stringify({ results: [] }), { status: 200 });
            })
        ]);

        const { data: localResults, error: localError } = localResponse as any;

        if (localError) {
            secureLog('error', 'Error searching local medication dictionary', {
                errorMessage: localError.message
            });
        }

        let fdaResults: string[] = [];
        if (fdaResponse && 'ok' in fdaResponse && fdaResponse.ok) {
            try {
                const fdaData = await fdaResponse.json();
                if (fdaData.results && Array.isArray(fdaData.results)) {
                    const fdaSuggestions = new Set<string>();
                    fdaData.results.forEach((result: any) => {
                        if (result.openfda) {
                            result.openfda.brand_name?.forEach((name: string) => {
                                // Sanitize FDA results
                                if (typeof name === 'string' && name.length <= 100) {
                                    fdaSuggestions.add(name);
                                }
                            });
                            result.openfda.generic_name?.forEach((name: string) => {
                                if (typeof name === 'string' && name.length <= 100) {
                                    fdaSuggestions.add(name);
                                }
                            });
                        }
                    });
                    fdaResults = Array.from(fdaSuggestions).slice(0, 20); // Limit results
                }
            } catch (parseError) {
                secureLog('error', 'Failed to parse FDA response', {
                    error: parseError instanceof Error ? parseError.message : 'Unknown'
                });
            }
        }

        // --- PASO 3: Combinar y devolver resultados sin duplicados ---
        const combinedSuggestions = new Set([
            ...(localResults?.map((item: any) => item.spanish_name).filter(Boolean) || []),
            ...fdaResults
        ]);

        const results = Array.from(combinedSuggestions).slice(0, 30); // Limit total results

        secureLog('info', 'Medication search completed', {
            term: sanitizedTerm,
            localResults: localResults?.length || 0,
            fdaResults: fdaResults.length,
            totalResults: results.length
        });

        return NextResponse.json(results);

    } catch (error) {
        secureLog('error', 'Unexpected error in medication search', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json(
            { error: 'No se pudo obtener la información de medicamentos.' }, 
            { status: 500 }
        );
    }
}
