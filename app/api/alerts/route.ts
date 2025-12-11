import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { secureLog } from '@/middleware/security';

// Database query timeout helper
const DB_TIMEOUT_MS = 10000;
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = DB_TIMEOUT_MS
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Database query timeout')), timeoutMs)
    ),
  ]);
}

// Validation schemas
const getAlertsSchema = z.object({
  status: z.enum(['active', 'dismissed', 'expired']).optional(),
  type: z.enum([
    'custom',
    'document_reminder',
    'medication',
    'vaccine',
    'appointment',
    'insurance',
    'family_activity',
    'security_alert'
  ]).optional(),
  priority: z.enum(['baja', 'media', 'alta', 'crítica']).optional(),
  unread: z.enum(['true', 'false']).optional()
});

// GET - Obtener alertas del usuario
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      secureLog('warn', 'Unauthenticated alert access attempt', {
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const validationResult = getAlertsSchema.safeParse({
      status: searchParams.get('status'),
      type: searchParams.get('type'),
      priority: searchParams.get('priority'),
      unread: searchParams.get('unread')
    });

    if (!validationResult.success) {
      secureLog('warn', 'Invalid alert query parameters', {
        userId: user.id,
        errors: validationResult.error.errors
      });
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }

    const { status, type, priority, unread } = validationResult.data;
    const unreadOnly = unread === 'true';

    let query = supabase
      .from('custom_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: alerts, error } = await query;

    if (error) {
      secureLog('error', 'Failed to fetch alerts', {
        userId: user.id,
        errorMessage: error.message
      });
      return NextResponse.json(
        { error: 'Error al obtener alertas' },
        { status: 500 }
      );
    }

    secureLog('info', 'Alerts fetched successfully', {
      userId: user.id,
      count: alerts?.length || 0
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    secureLog('error', 'Unexpected error in GET /api/alerts', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

const createAlertSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  type: z.enum([
    'custom',
    'document_reminder',
    'medication',
    'vaccine',
    'appointment',
    'insurance',
    'family_activity',
    'security_alert'
  ]).default('custom'),
  priority: z.enum(['baja', 'media', 'alta', 'crítica']).default('media'),
  link: z.string().url().optional().or(z.string().regex(/^\//).optional()),
  trigger_date: z.string().datetime().optional(),
  expiry_date: z.string().datetime().optional(),
  recurrence: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'none']).optional(),
  metadata: z.record(z.unknown()).optional()
});

// POST - Crear una nueva alerta
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      secureLog('warn', 'Unauthenticated alert creation attempt', {
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = createAlertSchema.safeParse(body);
    if (!validationResult.success) {
      secureLog('warn', 'Invalid alert creation data', {
        userId: user.id,
        errors: validationResult.error.errors
      });
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    const {
      title,
      message,
      type,
      priority,
      link,
      trigger_date,
      expiry_date,
      recurrence,
      metadata
    } = validationResult.data;

    const { data: alert, error } = await supabase
      .from('custom_alerts')
      .insert({
        user_id: user.id,
        title,
        message,
        type,
        priority,
        link,
        trigger_date,
        expiry_date,
        recurrence,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) {
      secureLog('error', 'Failed to create alert', {
        userId: user.id,
        errorMessage: error.message
      });
      return NextResponse.json(
        { error: 'Error al crear la alerta' },
        { status: 500 }
      );
    }

    secureLog('info', 'Alert created successfully', {
      userId: user.id,
      alertId: alert.id,
      type: alert.type
    });

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    secureLog('error', 'Unexpected error in POST /api/alerts', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

const updateAlertsSchema = z.object({
  alert_ids: z.array(z.string().uuid()).min(1).max(100),
  updates: z.object({
    is_read: z.boolean().optional(),
    status: z.enum(['active', 'dismissed', 'expired']).optional(),
    priority: z.enum(['baja', 'media', 'alta', 'crítica']).optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'Al menos un campo debe ser actualizado'
  })
});

// PATCH - Actualizar alertas en lote
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      secureLog('warn', 'Unauthenticated alert update attempt', {
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = updateAlertsSchema.safeParse(body);
    if (!validationResult.success) {
      secureLog('warn', 'Invalid alert update data', {
        userId: user.id,
        errors: validationResult.error.errors
      });
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    const { alert_ids, updates } = validationResult.data;

    const { error } = await supabase
      .from('custom_alerts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .in('id', alert_ids)
      .eq('user_id', user.id);

    if (error) {
      secureLog('error', 'Failed to update alerts', {
        userId: user.id,
        errorMessage: error.message
      });
      return NextResponse.json(
        { error: 'Error al actualizar alertas' },
        { status: 500 }
      );
    }

    secureLog('info', 'Alerts updated successfully', {
      userId: user.id,
      count: alert_ids.length
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    secureLog('error', 'Unexpected error in PATCH /api/alerts', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

const deleteAlertsSchema = z.object({
  ids: z.string()
    .transform(str => str.split(','))
    .pipe(z.array(z.string().uuid()).min(1).max(100))
});

// DELETE - Eliminar alertas en lote
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      secureLog('warn', 'Unauthenticated alert deletion attempt', {
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    // Validate input
    const validationResult = deleteAlertsSchema.safeParse({ ids: idsParam });
    if (!validationResult.success) {
      secureLog('warn', 'Invalid alert deletion data', {
        userId: user.id,
        errors: validationResult.error.errors
      });
      return NextResponse.json(
        { error: 'IDs de alertas inválidos' },
        { status: 400 }
      );
    }

    const alertIds = validationResult.data.ids;

    const { error } = await supabase
      .from('custom_alerts')
      .delete()
      .in('id', alertIds)
      .eq('user_id', user.id);

    if (error) {
      secureLog('error', 'Failed to delete alerts', {
        userId: user.id,
        errorMessage: error.message
      });
      return NextResponse.json(
        { error: 'Error al eliminar alertas' },
        { status: 500 }
      );
    }

    secureLog('info', 'Alerts deleted successfully', {
      userId: user.id,
      count: alertIds.length
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    secureLog('error', 'Unexpected error in DELETE /api/alerts', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
