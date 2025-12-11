// app/api/medications/details/route.ts
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
const detailsSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre es demasiado largo')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s-]+$/, 'El nombre contiene caracteres inválidos')
});

const FDA_API_URL = 'https://api.fda.gov/drug/label.json';

// Cliente de Supabase para consultar nuestro diccionario interno
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const name = searchParams.get('name');

        // Validate input
        const validationResult = detailsSchema.safeParse({ name });
        
        if (!validationResult.success) {
            secureLog('warn', 'Invalid medication details request', {
                errors: validationResult.error.errors
            });
            return NextResponse.json(
                { error: 'Se requiere un nombre de medicamento válido' }, 
                { status: 400 }
            );
        }

        const sanitizedName = validationResult.data.name;
        let searchName = sanitizedName;

        // Primero, consultamos nuestro diccionario para "traducir" el nombre si es necesario
        try {
            const { data: localMatch } = await supabase
                .from('medication_dictionary')
                .select('generic_name_en')
                .eq('spanish_name', sanitizedName)
                .single();

            if (localMatch?.generic_name_en) {
                searchName = localMatch.generic_name_en;
                secureLog('info', 'Medication name translated', {
                    spanish: sanitizedName,
                    english: searchName
                });
            }
        } catch (dictError) {
            // No problem if not found in dictionary, continue with original name
            secureLog('info', 'Medication not found in local dictionary', {
                name: sanitizedName
            });
        }

        // Buscamos una coincidencia exacta con el nombre de marca o genérico en openFDA
        const fdaSearchTerm = encodeURIComponent(searchName.toUpperCase());
        const query = `(openfda.brand_name.exact:"${fdaSearchTerm}" OR openfda.generic_name.exact:"${fdaSearchTerm}")`;
        const url = `${FDA_API_URL}?search=${query}&limit=1`;

        const fdaResponse = await withTimeout(
            fetch(url, {
                headers: {
                    'User-Agent': 'MedicalHealthApp/1.0',
                    'Accept': 'application/json'
                }
            }),
            FDA_TIMEOUT_MS
        );

        if (!fdaResponse.ok) {
            secureLog('warn', 'FDA API responded with error', {
                status: fdaResponse.status,
                medication: searchName
            });
            throw new Error('La API de FDA no respondió correctamente.');
        }

        const data = await fdaResponse.json();

        if (data.error || !data.results || data.results.length === 0) {
            secureLog('info', 'No medication details found', {
                name: searchName
            });
            return NextResponse.json(
                { error: 'No se encontró información detallada para este medicamento.' }, 
                { status: 404 }
            );
        }

        // Extraemos la información que nos interesa del primer resultado
        const firstResult = data.results[0];
        
        // Sanitize and truncate text fields to prevent excessive data
        const sanitizeText = (text: string | undefined, maxLength: number = 5000): string => {
            if (!text || typeof text !== 'string') return 'No disponible';
            return text.slice(0, maxLength);
        };

        const details = {
            generic_name: sanitizeText(firstResult.openfda?.generic_name?.[0], 200),
            brand_name: sanitizeText(firstResult.openfda?.brand_name?.[0], 200),
            description: sanitizeText(firstResult.description?.[0]),
            indications_and_usage: sanitizeText(firstResult.indications_and_usage?.[0]),
            warnings: sanitizeText(firstResult.warnings?.[0]),
        };

        secureLog('info', 'Medication details retrieved successfully', {
            medication: searchName,
            hasDescription: details.description !== 'No disponible'
        });

        return NextResponse.json(details);

    } catch (error) {
        secureLog('error', 'Unexpected error in medication details', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json(
            { error: 'No se pudo obtener la información del medicamento.' }, 
            { status: 500 }
        );
    }
}
