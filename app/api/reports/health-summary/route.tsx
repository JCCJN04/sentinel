import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';

// --- 1. Importaciones dinámicas para desarrollo vs. producción ---
import puppeteer from "puppeteer"; // Para desarrollo local
import core from "puppeteer-core"; // Para producción
import chromium from "@sparticuz/chromium"; // Para producción

// Configuraciones importantes para la función serverless
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function getHealthSummaryData(userId: string) {
  const supabase = createClient();
  const [ profileRes, allergiesRes, activePrescriptionsRes, personalHistoryRes, familyHistoryRes, vaccinationsRes ] = await Promise.all([
    supabase.from("profiles").select('*').eq("id", userId).single(),
    supabase.from("user_allergies").select('*').eq("user_id", userId),
    supabase.from("prescriptions").select("*, prescription_medicines(*)").eq("user_id", userId).or(`end_date.gte.${new Date().toISOString()},end_date.is.null`).order("start_date", { ascending: false }),
    supabase.from("user_personal_history").select('*').eq('user_id', userId).order('diagnosis_date', { ascending: false }),
    supabase.from("user_family_history").select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from("vaccinations").select('*').eq('user_id', userId).order('administration_date', { ascending: false })
  ]);
  return { profile: profileRes.data || {}, allergies: allergiesRes.data || [], activePrescriptions: activePrescriptionsRes.data || [], personalHistory: personalHistoryRes.data || [], familyHistory: familyHistoryRes.data || [], vaccinations: vaccinationsRes.data || [] };
}

export async function GET(req: NextRequest) {
  let browser = null;
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse("No autorizado", { status: 401 });

    const reportData = await getHealthSummaryData(user.id);
    const encodedData = Buffer.from(JSON.stringify(reportData)).toString('base64');
    
    const protocol = req.nextUrl.protocol;
    const host = req.nextUrl.host;
    const domain = req.nextUrl.hostname;
    const baseUrl = `${protocol}//${host}`;
    const reportUrl = `${baseUrl}/dashboard/reportes/health-summary/preview?data=${encodedData}`;

    console.log(`[PDF Generation] Iniciando la generación del PDF en modo: ${process.env.NODE_ENV}`);

    // --- 2. Lógica condicional para el navegador ---
    if (process.env.NODE_ENV === 'development') {
      // Usamos el puppeteer completo en desarrollo local, es más robusto aquí.
      console.log("[PDF Generation] Usando puppeteer estándar para desarrollo.");
      browser = await puppeteer.launch({ headless: true });
    } else {
      // Usamos la configuración optimizada para producción (Vercel, AWS, etc.)
      console.log("[PDF Generation] Usando puppeteer-core con @sparticuz/chromium para producción.");
      browser = await core.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });
    }

    const page = await browser.newPage();
    const cookieStore = cookies();
    const sessionCookies = cookieStore.getAll().map(cookie => ({
      name: cookie.name,
      value: cookie.value,
      domain: domain
    }));
    await page.setCookie(...sessionCookies);
    
    console.log(`[PDF Generation] Cookies de sesión establecidas. Navegando a: ${reportUrl}`);
    await page.goto(reportUrl, { waitUntil: 'networkidle0' });
    
    console.log(`[PDF Generation] Creando el buffer del PDF...`);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '25px', right: '25px', bottom: '25px', left: '25px' }
    });

    console.log(`[PDF Generation] PDF generado exitosamente.`);
    
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
    console.error("[PDF Generation] Ocurrió un error crítico:", error);
    return new NextResponse("Error al generar el PDF. Revisa los logs del servidor.", { status: 500 });
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}