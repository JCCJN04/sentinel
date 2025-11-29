'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getAlertStats } from '@/lib/actions/alerts.actions';

export function AlertsWidget() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    getAlertStats()
      .then((result) => {
        if (result.data) {
          setStats(result.data);
        }
      })
      .catch(err => console.error('Error loading alert stats:', err))
      .finally(() => setLoading(false));
  }, []);
  
  if (loading) {
    return (
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  if (!stats || stats.pending === 0) return null;
  
  const hasCritical = stats.byPriority?.crítica > 0;
  const hasHigh = stats.byPriority?.alta > 0;
  
  return (
    <Card className={`border-2 ${hasCritical ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : 'border-orange-300 bg-orange-50 dark:bg-orange-950/20'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {hasCritical ? (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          ) : (
            <Bell className="h-5 w-5 text-orange-600" />
          )}
          <span className={hasCritical ? 'text-red-900 dark:text-red-100' : 'text-orange-900 dark:text-orange-100'}>
            Alertas Pendientes
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-3xl font-bold ${hasCritical ? 'text-red-600' : 'text-orange-600'}`}>
              {stats.pending}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.unread > 0 && (
                <Badge variant="default" className="mr-2 text-xs">
                  {stats.unread} nuevas
                </Badge>
              )}
              {hasCritical && (
                <span className="text-red-700 dark:text-red-400 font-semibold">
                  {stats.byPriority.crítica} críticas
                </span>
              )}
              {hasCritical && hasHigh && <span className="mx-1">•</span>}
              {hasHigh && !hasCritical && (
                <span className="text-orange-700 dark:text-orange-400 font-semibold">
                  {stats.byPriority.alta} importantes
                </span>
              )}
            </p>
          </div>
        </div>
        
        <Link 
          href="/dashboard/alertas"
          className={`block w-full text-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            hasCritical 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : 'bg-orange-600 text-white hover:bg-orange-700'
          }`}
        >
          Ver todas las alertas →
        </Link>
      </CardContent>
    </Card>
  );
}
