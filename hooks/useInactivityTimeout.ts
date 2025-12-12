import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';

interface UseInactivityTimeoutOptions {
  timeoutMinutes?: number;
  onTimeout?: () => void;
  enabled?: boolean;
}

/**
 * Hook para detectar inactividad del usuario y cerrar sesión automáticamente
 * @param options - Configuración del timeout de inactividad
 */
export function useInactivityTimeout({
  timeoutMinutes = 2,
  onTimeout,
  enabled = true,
}: UseInactivityTimeoutOptions = {}) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: 'Sesión cerrada',
        description: 'Tu sesión se cerró por inactividad',
      });
      router.push('/login');
      if (onTimeout) {
        onTimeout();
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }, [supabase, router, toast, onTimeout]);

  const showWarning = useCallback(() => {
    toast({
      title: 'Sesión por expirar',
      description: 'Tu sesión se cerrará en 30 segundos por inactividad',
      variant: 'destructive',
    });
  }, [toast]);

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    // Limpiar timers existentes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Convertir minutos a milisegundos
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = timeoutMs - 30000; // Advertencia 30 segundos antes

    // Configurar advertencia
    if (warningMs > 0) {
      warningTimeoutRef.current = setTimeout(() => {
        showWarning();
      }, warningMs);
    }

    // Configurar timeout de cierre de sesión
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, timeoutMs);
  }, [enabled, timeoutMinutes, handleLogout, showWarning]);

  useEffect(() => {
    if (!enabled) return;

    // Verificar si hay una sesión activa
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Iniciar el timer
      resetTimer();
    };

    checkSession();

    // Eventos que detectan actividad del usuario
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Agregar listeners
    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [enabled, resetTimer, supabase]);

  return {
    resetTimer,
  };
}
