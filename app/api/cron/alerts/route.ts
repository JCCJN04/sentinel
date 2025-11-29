import { NextRequest, NextResponse } from 'next/server';
import { 
  runAutomaticAlertChecks, 
  cleanupOldAlerts 
} from '@/lib/alerts-cron';

/**
 * Endpoint para ejecutar tareas programadas de alertas
 * Debe ser llamado por un servicio de cron job externo (ej: Vercel Cron, GitHub Actions)
 * o configurado en vercel.json
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autorización mediante token de cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const task = searchParams.get('task') || 'all';

    console.log(`Ejecutando tarea programada: ${task}`);

    switch (task) {
      case 'check-alerts':
        await runAutomaticAlertChecks();
        break;
      
      case 'cleanup':
        await cleanupOldAlerts();
        break;
      
      case 'all':
        await runAutomaticAlertChecks();
        await cleanupOldAlerts();
        break;
      
      default:
        return NextResponse.json(
          { error: 'Tarea no reconocida' },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      success: true,
      task,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en cron job de alertas:', error);
    return NextResponse.json(
      { error: 'Error al ejecutar tarea programada' },
      { status: 500 }
    );
  }
}

// También permitir POST para mayor flexibilidad
export async function POST(request: NextRequest) {
  return GET(request);
}
