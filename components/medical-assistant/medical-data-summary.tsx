/**
 * Componente: Medical Data Summary
 * 
 * Muestra un resumen de la información médica disponible
 * para el Asistente IA
 */

'use client';

import { useEffect, useState } from 'react';
import { 
  FileText, 
  Pill, 
  ShieldAlert, 
  Syringe, 
  ClipboardList,
  Users,
  Loader2,
  Database 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { supabaseBrowserClient } from '@/lib/supabase';

interface DataCounts {
  documents: number;
  prescriptions: number;
  allergies: number;
  vaccinations: number;
  personalHistory: number;
  familyHistory: number;
}

export function MedicalDataSummary() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<DataCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      try {
        setIsLoading(true);

        // Consultar conteos en paralelo
        const [
          { count: docsCount },
          { count: rxCount },
          { count: allergiesCount },
          { count: vaxCount },
          { count: personalCount },
          { count: familyCount },
        ] = await Promise.all([
          supabaseBrowserClient.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabaseBrowserClient.from('prescriptions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabaseBrowserClient.from('user_allergies').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabaseBrowserClient.from('vaccinations').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabaseBrowserClient.from('user_personal_history').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabaseBrowserClient.from('user_family_history').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        ]);

        setCounts({
          documents: docsCount || 0,
          prescriptions: rxCount || 0,
          allergies: allergiesCount || 0,
          vaccinations: vaxCount || 0,
          personalHistory: personalCount || 0,
          familyHistory: familyCount || 0,
        });
      } catch (error) {
        console.error('Error fetching data counts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounts();
  }, [user]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!counts) return null;

  const dataItems = [
    { 
      label: 'Documentos', 
      count: counts.documents, 
      icon: FileText, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-950',
    },
    { 
      label: 'Recetas', 
      count: counts.prescriptions, 
      icon: Pill, 
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-950',
    },
    { 
      label: 'Alergias', 
      count: counts.allergies, 
      icon: ShieldAlert, 
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-950',
    },
    { 
      label: 'Vacunas', 
      count: counts.vaccinations, 
      icon: Syringe, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-950',
    },
    { 
      label: 'Ant. Personales', 
      count: counts.personalHistory, 
      icon: ClipboardList, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-950',
    },
    { 
      label: 'Ant. Familiares', 
      count: counts.familyHistory, 
      icon: Users, 
      color: 'text-pink-600',
      bgColor: 'bg-pink-100 dark:bg-pink-950',
    },
  ];

  const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <CardTitle className="text-sm sm:text-base">
              Datos Disponibles
            </CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm m-0">
            <span className="font-semibold text-foreground">{totalRecords}</span> registro{totalRecords !== 1 ? 's' : ''}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-3 sm:px-6 sm:py-4 pt-0">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5">
          {dataItems.map((item) => (
            <div
              key={item.label}
              className={`flex flex-col items-center justify-center gap-1.5 p-2.5 sm:p-3 rounded-lg ${item.bgColor} transition-all hover:scale-105 cursor-default`}
            >
              <div className={`p-1.5 rounded-md bg-white dark:bg-gray-900 ${item.color}`}>
                <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div className="text-center min-w-0 w-full">
                <p className="text-xl sm:text-2xl font-bold">{item.count}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        {totalRecords === 0 && (
          <div className="mt-3 p-3 sm:p-4 bg-muted rounded-lg text-center">
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">
              Aún no tienes información registrada. Agrega:
            </p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
              <Badge variant="outline" className="text-xs">Documentos</Badge>
              <Badge variant="outline" className="text-xs">Recetas</Badge>
              <Badge variant="outline" className="text-xs">Alergias</Badge>
              <Badge variant="outline" className="text-xs">Vacunas</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
