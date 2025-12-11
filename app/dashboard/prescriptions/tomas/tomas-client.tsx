'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Pill, Clock, CheckCircle2, XCircle, Calendar, Search, Filter } from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabaseBrowserClient } from '@/lib/supabase';

interface MedicationDose {
  id: string;
  scheduled_at: string;
  taken_at: string | null;
  status: 'pending' | 'taken' | 'skipped';
  notes: string | null;
  created_at: string;
  prescription_medicine: {
    id: string;
    medicine_name: string;
    dosage: string;
    instructions: string | null;
    prescription: {
      id: string;
      doctor_name: string | null;
      diagnosis: string | null;
    } | null;
  } | null;
}

interface Props {
  initialDoses: MedicationDose[];
}

export function MedicationDosesClient({ initialDoses }: Props) {
  const [doses, setDoses] = useState<MedicationDose[]>(initialDoses);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDose, setSelectedDose] = useState<MedicationDose | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; doseId: string | null; action: 'take' | 'skip' | null }>({
    open: false,
    doseId: null,
    action: null,
  });
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return `Hoy, ${format(date, 'HH:mm')}`;
    if (isYesterday(date)) return `Ayer, ${format(date, 'HH:mm')}`;
    return format(date, "d 'de' MMMM, HH:mm", { locale: es });
  };

  const getStatusBadge = (dose: MedicationDose) => {
    if (dose.status === 'taken') {
      return <Badge className="bg-green-500 hover:bg-green-600">✓ Tomada</Badge>;
    }
    if (dose.status === 'skipped') {
      return <Badge variant="destructive">⊗ Omitida</Badge>;
    }
    const scheduledTime = new Date(dose.scheduled_at);
    const now = new Date();
    if (scheduledTime > now) {
      return <Badge variant="outline">⏱ Programada</Badge>;
    }
    return <Badge variant="secondary">⏰ Pendiente</Badge>;
  };

  const handleMarkAsTaken = async (doseId: string, withNotes: boolean = false) => {
    try {
      const { error } = await supabaseBrowserClient
        .from('medication_doses')
        .update({
          taken_at: new Date().toISOString(),
          status: 'taken',
          notes: withNotes ? notes : null,
        })
        .eq('id', doseId);

      if (error) throw error;

      setDoses((prev) =>
        prev.map((d) =>
          d.id === doseId
            ? { ...d, taken_at: new Date().toISOString(), status: 'taken' as const, notes: withNotes ? notes : null }
            : d
        )
      );

      toast({
        title: '✅ Toma registrada',
        description: 'La dosis ha sido marcada como tomada',
      });

      setNotes('');
      setSelectedDose(null);
      setConfirmDialog({ open: false, doseId: null, action: null });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar la toma',
        variant: 'destructive',
      });
    }
  };

  const handleSkipDose = async (doseId: string) => {
    try {
      const { error } = await supabaseBrowserClient
        .from('medication_doses')
        .update({
          status: 'skipped',
          notes: notes || 'Omitida',
        })
        .eq('id', doseId);

      if (error) throw error;

      setDoses((prev) =>
        prev.map((d) =>
          d.id === doseId ? { ...d, status: 'skipped' as const, notes: notes || 'Omitida' } : d
        )
      );

      toast({
        title: 'Dosis omitida',
        description: 'La dosis ha sido marcada como omitida',
      });

      setNotes('');
      setConfirmDialog({ open: false, doseId: null, action: null });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo omitir la dosis',
        variant: 'destructive',
      });
    }
  };

  const filteredDoses = doses.filter((dose) => {
    if (!searchQuery) return true;
    const medicineName = dose.prescription_medicine?.medicine_name?.toLowerCase() || '';
    const diagnosis = dose.prescription_medicine?.prescription?.diagnosis?.toLowerCase() || '';
    return medicineName.includes(searchQuery.toLowerCase()) || diagnosis.includes(searchQuery.toLowerCase());
  });

  const pendingDoses = filteredDoses.filter((d) => d.status === 'pending');
  const takenDoses = filteredDoses.filter((d) => d.status === 'taken');
  const skippedDoses = filteredDoses.filter((d) => d.status === 'skipped');

  const DoseCard = ({ dose }: { dose: MedicationDose }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Pill className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">{dose.prescription_medicine?.medicine_name || 'Medicamento'}</CardTitle>
              <CardDescription>
                {dose.prescription_medicine?.dosage}
                {dose.prescription_medicine?.prescription?.diagnosis && 
                  ` • ${dose.prescription_medicine.prescription.diagnosis}`
                }
              </CardDescription>
            </div>
          </div>
          {getStatusBadge(dose)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{formatDate(dose.scheduled_at)}</span>
        </div>

        {dose.taken_at && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>Tomada {formatDistanceToNow(parseISO(dose.taken_at), { addSuffix: true, locale: es })}</span>
          </div>
        )}

        {dose.prescription_medicine?.instructions && (
          <p className="text-sm text-muted-foreground border-l-2 border-blue-500 pl-3">
            {dose.prescription_medicine.instructions}
          </p>
        )}

        {dose.notes && (
          <p className="text-sm italic text-muted-foreground bg-muted p-2 rounded">
            💬 {dose.notes}
          </p>
        )}

        {dose.status === 'pending' && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => {
                setSelectedDose(dose);
                setConfirmDialog({ open: true, doseId: dose.id, action: 'take' });
              }}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Marcar como tomada
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedDose(dose);
                setConfirmDialog({ open: true, doseId: dose.id, action: 'skip' });
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Omitir
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Historial de Tomas</h1>
        <p className="text-muted-foreground">Registra y consulta todas tus tomas de medicamentos</p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por medicamento o diagnóstico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pendientes ({pendingDoses.length})
          </TabsTrigger>
          <TabsTrigger value="taken">
            Tomadas ({takenDoses.length})
          </TabsTrigger>
          <TabsTrigger value="skipped">
            Omitidas ({skippedDoses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingDoses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay dosis pendientes</p>
              </CardContent>
            </Card>
          ) : (
            pendingDoses.map((dose) => <DoseCard key={dose.id} dose={dose} />)
          )}
        </TabsContent>

        <TabsContent value="taken" className="space-y-4">
          {takenDoses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay tomas registradas</p>
              </CardContent>
            </Card>
          ) : (
            takenDoses.map((dose) => <DoseCard key={dose.id} dose={dose} />)
          )}
        </TabsContent>

        <TabsContent value="skipped" className="space-y-4">
          {skippedDoses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay dosis omitidas</p>
              </CardContent>
            </Card>
          ) : (
            skippedDoses.map((dose) => <DoseCard key={dose.id} dose={dose} />)
          )}
        </TabsContent>
      </Tabs>

      {/* Diálogo de confirmación */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ open, doseId: null, action: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'take' ? '¿Marcar como tomada?' : '¿Omitir dosis?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedDose && (
                <div className="space-y-2 py-2">
                  <p className="font-medium">{selectedDose.prescription_medicine?.medicine_name}</p>
                  <p className="text-sm">{selectedDose.prescription_medicine?.dosage}</p>
                  <p className="text-xs text-muted-foreground">
                    Programada: {formatDate(selectedDose.scheduled_at)}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
            <div className="py-4">
              <label className="text-sm font-medium">Notas (opcional)</label>
              <Textarea
                placeholder="Agrega algún comentario..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNotes('')}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog.doseId) {
                  if (confirmDialog.action === 'take') {
                    handleMarkAsTaken(confirmDialog.doseId, notes.length > 0);
                  } else {
                    handleSkipDose(confirmDialog.doseId);
                  }
                }
              }}
              className={confirmDialog.action === 'take' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {confirmDialog.action === 'take' ? 'Marcar como tomada' : 'Omitir dosis'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
