'use client'

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { getAlertStats } from '@/lib/actions/alerts.actions';

export function AlertsBadge() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      const result = await getAlertStats();
      if (!result.error && result.data) {
        const { unread, pending } = result.data;
        setUnreadCount(unread || 0);
        setCriticalCount(pending || 0);
      }
    };

    loadStats();

    // Actualizar cada 30 segundos
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (unreadCount === 0 && criticalCount === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {criticalCount > 0 && (
        <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 text-xs flex items-center justify-center">
          {criticalCount}
        </Badge>
      )}
      {unreadCount > 0 && criticalCount === 0 && (
        <Badge variant="default" className="h-5 min-w-[20px] px-1.5 text-xs flex items-center justify-center">
          {unreadCount}
        </Badge>
      )}
    </div>
  );
}
