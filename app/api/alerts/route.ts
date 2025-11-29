import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener alertas del usuario
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const unreadOnly = searchParams.get('unread') === 'true';

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
      return NextResponse.json(
        { error: 'Error al obtener alertas' },
        { status: 500 }
      );
    }

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Error en GET /api/alerts:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear una nueva alerta
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      message,
      type = 'custom',
      priority = 'media',
      link,
      trigger_date,
      expiry_date,
      recurrence,
      metadata = {}
    } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Título y mensaje son requeridos' },
        { status: 400 }
      );
    }

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
        metadata
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Error al crear la alerta' },
        { status: 500 }
      );
    }

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/alerts:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar alertas en lote
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { alert_ids, updates } = body;

    if (!alert_ids || !Array.isArray(alert_ids) || alert_ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs de alertas requeridos' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('custom_alerts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .in('id', alert_ids)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: 'Error al actualizar alertas' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en PATCH /api/alerts:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar alertas en lote
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json(
        { error: 'IDs de alertas requeridos' },
        { status: 400 }
      );
    }

    const alertIds = idsParam.split(',');

    const { error } = await supabase
      .from('custom_alerts')
      .delete()
      .in('id', alertIds)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: 'Error al eliminar alertas' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en DELETE /api/alerts:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
