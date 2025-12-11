import { NextRequest, NextResponse } from 'next/server';
import { 
  runAutomaticAlertChecks, 
  cleanupOldAlerts 
} from '@/lib/alerts-cron';
import { z } from 'zod';
import { secureLog } from '@/middleware/security';

// Validation schema for cron tasks
const cronTaskSchema = z.object({
  task: z.enum(['check-alerts', 'cleanup', 'all']).optional().default('all')
});

/**
 * Endpoint para ejecutar tareas programadas de alertas
 * Debe ser llamado por un servicio de cron job externo (ej: Vercel Cron, GitHub Actions)
 * o configurado en vercel.json
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verificar autorización mediante token de cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      secureLog('error', 'CRON_SECRET not configured in environment variables', {});
      return NextResponse.json(
        { error: 'Configuración de servidor inválida' },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      
      secureLog('warn', 'Unauthorized cron endpoint access attempt', {
        ip,
        hasAuthHeader: !!authHeader
      });
      
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const taskParam = searchParams.get('task');
    
    const validationResult = cronTaskSchema.safeParse({ task: taskParam });
    
    if (!validationResult.success) {
      secureLog('warn', 'Invalid cron task parameter', {
        task: taskParam,
        errors: validationResult.error.errors
      });
      return NextResponse.json(
        { error: 'Tarea no reconocida' },
        { status: 400 }
      );
    }

    const { task } = validationResult.data;

    secureLog('info', 'Executing scheduled cron task', { task });

    let checkAlertsResult = null;
    let cleanupResult = null;

    switch (task) {
      case 'check-alerts':
        checkAlertsResult = await runAutomaticAlertChecks();
        break;
      
      case 'cleanup':
        cleanupResult = await cleanupOldAlerts();
        break;
      
      case 'all':
        checkAlertsResult = await runAutomaticAlertChecks();
        cleanupResult = await cleanupOldAlerts();
        break;
    }

    const executionTime = Date.now() - startTime;

    secureLog('info', 'Cron task completed successfully', {
      task,
      executionTimeMs: executionTime,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true,
      task,
      timestamp: new Date().toISOString(),
      executionTimeMs: executionTime,
      results: {
        checkAlerts: checkAlertsResult,
        cleanup: cleanupResult
      }
    });
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    secureLog('error', 'Error executing cron job', {
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: executionTime
    });
    
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
