import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { cookies } from 'next/headers';
import { HealthReportTemplate } from "@/components/reports/health-report-template";
import ReactDOMServer from 'react-dom/server';

// Solución 1: Especificar el runtime 'nodejs' para evitar conflictos con el Edge Runtime
// Los APIs como puppeteer solo funcionan en un entorno Node.js
export const runtime = 'nodejs';

// Esta función ahora solo se usa aquí para obtener los datos
async function getHealthSummaryData(userId: string) {
  // Se llama a createClient sin argumentos, ya que obtiene las cookies internamente
  const supabase = createClient();
  
  const [
    profileRes,
    allergiesRes,
    activePrescriptionsRes,
    personalHistoryRes,
    familyHistoryRes,
    vaccinationsRes
  ] = await Promise.all([
    supabase.from("profiles").select('*').eq("id", userId).single(),
    supabase.from("user_allergies").select('*').eq("user_id", userId),
    supabase.from("prescriptions").select("*, prescription_medicines(*)").eq("user_id", userId).or(`end_date.gte.${new Date().toISOString()},end_date.is.null`).order("start_date", { ascending: false }),
    supabase.from("user_personal_history").select('*').eq('user_id', userId).order('diagnosis_date', { ascending: false }),
    supabase.from("user_family_history").select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from("vaccinations").select('*').eq('user_id', userId).order('administration_date', { ascending: false })
  ]);

  return { 
    profile: profileRes.data || {}, 
    allergies: allergiesRes.data || [], 
    activePrescriptions: activePrescriptionsRes.data || [],
    personalHistory: personalHistoryRes.data || [],
    familyHistory: familyHistoryRes.data || [],
    vaccinations: vaccinationsRes.data || [],
  };
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const reportData = await getHealthSummaryData(user.id);
    
    const encodedData = Buffer.from(JSON.stringify(reportData)).toString('base64');
    
    const protocol = req.nextUrl.protocol;
    const host = req.nextUrl.host;
    const baseUrl = `${protocol}//${host}`;
    
    const reportUrl = `${baseUrl}/dashboard/reportes/health-summary/preview?data=${encodedData}`;

    console.log(`[PDF Generation] Visiting URL...`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    await page.goto(reportUrl, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '25px', right: '25px', bottom: '25px', left: '25px' }
    });

    await browser.close();

    // Solución 2: Convertir el Uint8Array a un ReadableStream para el NextResponse
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(pdfBuffer);
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="expediente-salud-sentinel-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
      status: 200,
    });

  } catch (error) {
    console.error("[PDF Generation] A critical error occurred:", error);
    return new NextResponse("Error al generar el PDF", { status: 500 });
  }
}