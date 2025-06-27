// app/api/medications/details/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const FDA_API_URL = 'https://api.fda.gov/drug/label.json';

// Cliente de Supabase para consultar nuestro diccionario interno
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
        return NextResponse.json({ error: 'Se requiere un nombre de medicamento' }, { status: 400 });
    }

    let searchName = name;

    // Primero, consultamos nuestro diccionario para "traducir" el nombre si es necesario
    const { data: localMatch } = await supabase
        .from('medication_dictionary')
        .select('generic_name_en')
        .eq('spanish_name', name)
        .single();

    if (localMatch) {
        searchName = localMatch.generic_name_en; // Usamos el nombre en inglés para buscar en FDA
    }

    // Buscamos una coincidencia exacta con el nombre de marca o genérico en openFDA
    const query = `(openfda.brand_name.exact:"${searchName.toUpperCase()}" OR openfda.generic_name.exact:"${searchName.toUpperCase()}")`;
    const url = `${FDA_API_URL}?search=${query}&limit=1`;

    try {
        const fdaResponse = await fetch(url);
        if (!fdaResponse.ok) {
            throw new Error('La API de FDA no respondió correctamente.');
        }

        const data = await fdaResponse.json();

        if (data.error || !data.results || data.results.length === 0) {
            return NextResponse.json({ error: 'No se encontró información detallada para este medicamento.' }, { status: 404 });
        }

        // Extraemos la información que nos interesa del primer resultado
        const firstResult = data.results[0];
        const details = {
            generic_name: firstResult.openfda?.generic_name?.[0] || 'No disponible',
            brand_name: firstResult.openfda?.brand_name?.[0] || 'No disponible',
            description: firstResult.description?.[0] || 'No disponible',
            indications_and_usage: firstResult.indications_and_usage?.[0] || 'No disponible',
            warnings: firstResult.warnings?.[0] || 'No disponible',
        };

        return NextResponse.json(details);

    } catch (error) {
        console.error("[API Details] Error:", error);
        return NextResponse.json({ error: 'No se pudo obtener la información del medicamento.' }, { status: 500 });
    }
}
