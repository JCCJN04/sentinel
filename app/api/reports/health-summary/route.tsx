import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { cookies } from 'next/headers'

// --- FUNCIÓN ACTUALIZADA ---
async function getHealthSummaryData(userId: string) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  // Se especifican todos los campos para asegurar que se obtengan.
  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      first_name,
      last_name,
      curp,
      genero,
      tipo_de_sangre,
      estado_civil,
      ocupacion,
      direccion
    `)
    .eq("id", userId)
    .single();

  const { data: allergies } = await supabase
    .from("user_allergies")
    .select("allergy_name, reaction_description")
    .eq("user_id", userId);

  const { data: activePrescriptions } = await supabase
    .from("prescriptions")
    .select("diagnosis, doctor_name, start_date, prescription_medicines(medicine_name, dosage, instructions)")
    .eq("user_id", userId)
    .or(`end_date.gte.${new Date().toISOString()},end_date.is.null`)
    .order("start_date", { ascending: false });

  return { 
    profile: profile || {}, 
    allergies: allergies || [], 
    activePrescriptions: activePrescriptions || [] 
  };
}

// El resto del archivo no cambia
export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const reportData = await getHealthSummaryData(user.id);
    const encodedData = Buffer.from(JSON.stringify(reportData)).toString('base64');
    
    const protocol = req.nextUrl.protocol;
    const host = req.nextUrl.host;
    const baseUrl = `${protocol}//${host}`;
    
    const reportUrl = `${baseUrl}/dashboard/reportes/health-summary/preview?data=${encodedData}`;

    console.log(`[PDF Generation] Visiting URL: ${reportUrl}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    await page.goto(reportUrl, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="expediente-salud-sentinel-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
      status: 200,
    });

  } catch (error) {
    console.error("[PDF Generation] A critical error occurred:", error);
    return new NextResponse("Error generating PDF", { status: 500 });
  }
}