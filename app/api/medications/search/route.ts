// app/api/medications/search/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// URL de la API de la FDA
const FDA_API_URL = 'https://api.fda.gov/drug/label.json';

// Es seguro crear este cliente aquí porque este código solo se ejecuta en el servidor.
// Asegúrate de que tus variables de entorno estén configuradas.
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // IMPORTANTE: Usa la service_role key para permisos de lectura
);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term');

    if (!term || term.length < 3) {
        // Devuelve un array vacío si el término de búsqueda es muy corto, 
        // para que el frontend no muestre un error.
        return NextResponse.json([]); 
    }

    try {
        // --- PASO 1: Buscar en nuestro diccionario local (Español) ---
        const localSearch = supabase
            .from('medication_dictionary')
            .select('spanish_name')
            .ilike('spanish_name', `${term}%`); // 'ilike' es para búsqueda no sensible a mayúsculas

        // --- PASO 2: Buscar en la API de FDA (Inglés) ---
        // La sintaxis .exact es para buscar una coincidencia en el campo completo (ignorando mayúsculas/minúsculas)
        const fdaQuery = `openfda.brand_name.exact:"${term.toUpperCase()}"+OR+openfda.generic_name.exact:"${term.toUpperCase()}"`;
        const fdaUrl = `${FDA_API_URL}?search=${fdaQuery}&limit=10`;
        const fdaSearch = fetch(fdaUrl);
        
        // Ejecutamos ambas búsquedas en paralelo para mayor eficiencia
        const [localResponse, fdaResponse] = await Promise.all([localSearch, fdaSearch]);

        const { data: localResults, error: localError } = localResponse;

        if (localError) {
            console.error("Error buscando en diccionario local:", localError);
            // No detenemos el proceso, aún podemos devolver resultados de la FDA
        }

        let fdaResults: string[] = [];
        if (fdaResponse.ok) {
            const fdaData = await fdaResponse.json();
            if (fdaData.results) {
                const fdaSuggestions = new Set<string>();
                fdaData.results.forEach((result: any) => {
                    if (result.openfda) {
                        result.openfda.brand_name?.forEach((name: string) => fdaSuggestions.add(name));
                        result.openfda.generic_name?.forEach((name: string) => fdaSuggestions.add(name));
                    }
                });
                fdaResults = Array.from(fdaSuggestions);
            }
        }

        // --- PASO 3: Combinar y devolver resultados sin duplicados ---
        const combinedSuggestions = new Set([
            ...(localResults?.map(item => item.spanish_name) || []),
            ...fdaResults
        ]);

        return NextResponse.json(Array.from(combinedSuggestions));

    } catch (error) {
        console.error("Error general en la búsqueda de medicamentos:", error);
        return NextResponse.json({ error: 'No se pudo obtener la información de medicamentos.' }, { status: 500 });
    }
}
