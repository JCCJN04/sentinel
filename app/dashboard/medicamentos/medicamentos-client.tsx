// app/dashboard/medicamentos/medicamentos-client.tsx
"use client";

import { useState, useMemo } from "react";
import { markDoseAsTaken, type UpcomingDose, type ActiveMedication, type DoseHistory } from "@/lib/actions/prescriptions.actions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Pill, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Search,
  Calendar,
  Filter,
  X,
  Activity,
  History,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDate(date: Date) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateStr = date.toDateString();
  if (dateStr === today.toDateString()) return "Hoy";
  if (dateStr === tomorrow.toDateString()) return "Mañana";
  if (dateStr === yesterday.toDateString()) return "Ayer";

  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatDelayTime(minutes: number): string {
  const absMinutes = Math.abs(minutes);
  
  // Menos de 60 minutos
  if (absMinutes < 60) {
    return `${absMinutes}min`;
  }
  
  // Menos de 24 horas
  if (absMinutes < 1440) {
    const hours = Math.floor(absMinutes / 60);
    const mins = absMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
  
  // Más de 24 horas
  const days = Math.floor(absMinutes / 1440);
  const remainingMinutes = absMinutes % 1440;
  const hours = Math.floor(remainingMinutes / 60);
  const mins = remainingMinutes % 60;
  
  let result = `${days}d`;
  if (hours > 0) result += ` ${hours}h`;
  if (mins > 0) result += ` ${mins}min`;
  
  return result;
}

type DoseStatus = "missed" | "due" | "soon" | "upcoming";

function getDoseStatus(target: Date, now: Date): DoseStatus {
  const diffMinutes = Math.round((target.getTime() - now.getTime()) / 60000);

  if (diffMinutes < -60) return "missed";
  if (diffMinutes <= 60) return "due";
  if (diffMinutes <= 120) return "soon";
  return "upcoming";
}

function calculateTimeProgress(scheduledAt: Date, now: Date): { progress: number; timeLeft: string } {
  const diffMs = scheduledAt.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  
  if (diffMinutes < 0) {
    const absMinutes = Math.abs(diffMinutes);
    if (absMinutes < 60) {
      return { progress: 100, timeLeft: `Hace ${absMinutes} min` };
    }
    const hours = Math.floor(absMinutes / 60);
    return { progress: 100, timeLeft: `Hace ${hours}h ${absMinutes % 60}min` };
  }
  
  const totalMinutesInDay = 24 * 60;
  const progress = Math.max(0, Math.min(100, ((totalMinutesInDay - diffMinutes) / totalMinutesInDay) * 100));
  
  let timeLeft = "";
  if (diffMinutes < 60) {
    timeLeft = `En ${diffMinutes} min`;
  } else if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    timeLeft = mins > 0 ? `En ${hours}h ${mins}min` : `En ${hours}h`;
  } else {
    const days = Math.floor(diffMinutes / 1440);
    const hours = Math.floor((diffMinutes % 1440) / 60);
    timeLeft = hours > 0 ? `En ${days}d ${hours}h` : `En ${days}d`;
  }
  
  return { progress, timeLeft };
}

const statusConfig = {
  missed: {
    label: "Atrasada",
    description: "Registra cuanto antes",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200",
    border: "border-red-200 dark:border-red-900/40",
    barColor: "bg-red-500",
    icon: AlertTriangle,
  },
  due: {
    label: "Urgente",
    description: "Es hora de tomarla",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
    border: "border-amber-200 dark:border-amber-900/40",
    barColor: "bg-amber-500",
    icon: Clock,
  },
  soon: {
    label: "Próxima",
    description: "Prepárate",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
    border: "border-emerald-200 dark:border-emerald-900/40",
    barColor: "bg-emerald-500",
    icon: CheckCircle2,
  },
  upcoming: {
    label: "Programada",
    description: "Aún falta tiempo",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200",
    border: "border-sky-200 dark:border-sky-900/40",
    barColor: "bg-sky-500",
    icon: Calendar,
  },
};

function DoseCard({ dose, onDoseTaken }: { dose: UpcomingDose; onDoseTaken?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const medicine = dose.prescription_medicines;
  const scheduledAt = new Date(dose.scheduled_at);
  const now = new Date();
  const status = getDoseStatus(scheduledAt, now);
  const { progress, timeLeft } = calculateTimeProgress(scheduledAt, now);
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const handleMarkAsTaken = async () => {
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('doseId', dose.id);
      
      const result = await markDoseAsTaken(formData);
      
      if (result?.success === false) {
        toast({
          title: "Error",
          description: result.error || "No se pudo registrar la toma",
          variant: "destructive",
        });
      } else {
        toast({
          title: "✅ Toma registrada",
          description: `${medicine?.medicine_name} ha sido registrada correctamente`,
        });
        onDoseTaken?.();
      }
    } catch (error) {
      console.error('Error al marcar toma:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al registrar la toma",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-lg", config.border)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn("rounded-lg p-2.5", config.badge)}>
              <Pill className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <CardTitle className="text-lg">{medicine?.medicine_name || "Medicamento"}</CardTitle>
              <CardDescription className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn("gap-1", config.badge)}>
                  <StatusIcon className="h-3 w-3" />
                  {config.label}
                </Badge>
                <span className="text-xs">
                  {formatDate(scheduledAt)} • {formatTime(scheduledAt)}
                </span>
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={handleMarkAsTaken}
            disabled={isSubmitting}
            size="sm"
            className={cn(
              status === "missed" && "bg-red-600 hover:bg-red-700",
              status === "due" && "bg-amber-600 hover:bg-amber-700",
              status === "soon" && "bg-emerald-600 hover:bg-emerald-700",
              status === "upcoming" && "bg-sky-600 hover:bg-sky-700"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Registrando...
              </>
            ) : (
              "Registrar"
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dosis y frecuencia */}
        <div className="grid grid-cols-2 gap-3">
          {medicine?.dosage && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Dosis</p>
              <p className="font-semibold">{medicine.dosage}</p>
            </div>
          )}
          {medicine?.frequency_hours && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Frecuencia</p>
              <p className="font-semibold">Cada {medicine.frequency_hours}h</p>
            </div>
          )}
        </div>

        {/* Barra de progreso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Tiempo restante</span>
            <span className={cn("text-sm font-bold", config.badge.split(" ")[1])}>
              {timeLeft}
            </span>
          </div>
          <Progress 
            value={progress} 
            className="h-3"
            indicatorClassName={config.barColor}
          />
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>

        {/* Instrucciones */}
        {medicine?.instructions && medicine.instructions.toLowerCase() !== "no especificado" && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Instrucciones</p>
            <p className="text-sm">{medicine.instructions}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MedicamentosClient({ doses, medications, history }: { 
  doses: UpcomingDose[]; 
  medications: ActiveMedication[];
  history: DoseHistory[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"medications" | "doses" | "history">("medications");

  const now = new Date();

  const filteredDoses = useMemo(() => {
    let filtered = doses;

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(dose => 
        dose.prescription_medicines?.medicine_name?.toLowerCase().includes(query)
      );
    }

    // Filtrar por tab
    if (activeTab !== "all") {
      filtered = filtered.filter(dose => {
        const status = getDoseStatus(new Date(dose.scheduled_at), now);
        return status === activeTab;
      });
    }

    // Ordenar por fecha
    return filtered.sort((a, b) => 
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );
  }, [doses, searchQuery, activeTab, now]);

  const counts = useMemo(() => ({
    all: doses.length,
    missed: doses.filter(d => getDoseStatus(new Date(d.scheduled_at), now) === "missed").length,
    due: doses.filter(d => getDoseStatus(new Date(d.scheduled_at), now) === "due").length,
    soon: doses.filter(d => getDoseStatus(new Date(d.scheduled_at), now) === "soon").length,
    upcoming: doses.filter(d => getDoseStatus(new Date(d.scheduled_at), now) === "upcoming").length,
  }), [doses, now]);

  const filteredMedications = useMemo(() => {
    if (!searchQuery) return medications;
    const query = searchQuery.toLowerCase();
    return medications.filter(med => 
      med.medicine_name?.toLowerCase().includes(query) ||
      med.diagnosis?.toLowerCase().includes(query)
    );
  }, [medications, searchQuery]);

  // Separar medicamentos activos e inactivos
  const activeMeds = useMemo(() => 
    filteredMedications.filter(m => m.is_active !== false),
    [filteredMedications]
  );
  
  const completedMeds = useMemo(() => 
    filteredMedications.filter(m => m.is_active === false),
    [filteredMedications]
  );

  if (medications.length === 0 && doses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Pill className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No hay medicamentos programados</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Agrega prescripciones médicas para comenzar a gestionar tus dosis
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector de vista */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Button
              variant={viewMode === "medications" ? "default" : "outline"}
              onClick={() => setViewMode("medications")}
              className="flex-1"
            >
              <Activity className="mr-2 h-4 w-4" />
              Medicamentos ({activeMeds.length})
            </Button>
            <Button
              variant={viewMode === "doses" ? "default" : "outline"}
              onClick={() => setViewMode("doses")}
              className="flex-1"
            >
              <Clock className="mr-2 h-4 w-4" />
              Próximas ({doses.length})
            </Button>
            <Button
              variant={viewMode === "history" ? "default" : "outline"}
              onClick={() => setViewMode("history")}
              className="flex-1"
            >
              <History className="mr-2 h-4 w-4" />
              Historial
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar medicamento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vista de Medicamentos Activos */}
      {viewMode === "medications" && (
        <div className="space-y-6">
          {/* Medicamentos Activos */}
          {activeMeds.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Medicamentos Activos ({activeMeds.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeMeds.map((med) => {
                  const progress = med.total_doses > 0 
                    ? Math.round((med.completed_doses / med.total_doses) * 100)
                    : 0;
                  
                  return (
                    <Card key={med.id} className="border-indigo-200 dark:border-indigo-900/40">
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-indigo-100 dark:bg-indigo-900/30 p-2.5">
                            <Pill className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{med.medicine_name}</CardTitle>
                            <CardDescription>{med.diagnosis}</CardDescription>
                          </div>
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200">
                            Activo
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Progreso de tomas */}
                        {med.total_doses > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progreso de tomas</span>
                              <span className="font-semibold">{med.completed_doses}/{med.total_doses}</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {progress}% completado • Faltan {med.total_doses - med.completed_doses} dosis
                            </p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3">
                          {med.dosage && (
                            <div className="rounded-lg bg-muted/50 p-3">
                              <p className="text-xs text-muted-foreground mb-1">Dosis</p>
                              <p className="font-semibold text-sm">{med.dosage}</p>
                            </div>
                          )}
                          {med.frequency_hours && (
                            <div className="rounded-lg bg-muted/50 p-3">
                              <p className="text-xs text-muted-foreground mb-1">Frecuencia</p>
                              <p className="font-semibold text-sm">Cada {med.frequency_hours}h</p>
                            </div>
                          )}
                        </div>
                        
                        {med.doctor_name && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Médico:</strong> {med.doctor_name}
                          </div>
                        )}
                        
                        {med.instructions && med.instructions !== "No especificado" && (
                          <div className="rounded-lg border bg-muted/30 p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Instrucciones</p>
                            <p className="text-sm">{med.instructions}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                          <span>Inicio: {new Date(med.start_date).toLocaleDateString('es-MX')}</span>
                          {med.end_date && (
                            <span>Fin: {new Date(med.end_date).toLocaleDateString('es-MX')}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Medicamentos Completados */}
          {completedMeds.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-gray-600" />
                Tratamientos Completados ({completedMeds.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedMeds.map((med) => (
                  <Card key={med.id} className="border-gray-200 dark:border-gray-800 opacity-75">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-gray-100 dark:bg-gray-900/30 p-2.5">
                          <Pill className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{med.medicine_name}</CardTitle>
                          <CardDescription>{med.diagnosis}</CardDescription>
                        </div>
                        <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-200">
                          Completado
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Indicador de completado */}
                      <div className="rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/40 p-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <p className="text-sm font-medium text-green-700 dark:text-green-400">
                            Tratamiento finalizado
                          </p>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                          {med.total_doses} dosis completadas
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {med.dosage && (
                          <div className="rounded-lg bg-muted/50 p-3">
                            <p className="text-xs text-muted-foreground mb-1">Dosis</p>
                            <p className="font-semibold text-sm">{med.dosage}</p>
                          </div>
                        )}
                        {med.frequency_hours && (
                          <div className="rounded-lg bg-muted/50 p-3">
                            <p className="text-xs text-muted-foreground mb-1">Frecuencia</p>
                            <p className="font-semibold text-sm">Cada {med.frequency_hours}h</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                        <span>Inicio: {new Date(med.start_date).toLocaleDateString('es-MX')}</span>
                        {med.end_date && (
                          <span>Fin: {new Date(med.end_date).toLocaleDateString('es-MX')}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Mensaje si no hay medicamentos */}
          {activeMeds.length === 0 && completedMeds.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Filter className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  No se encontraron medicamentos
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Vista de Próximas Dosis */}
      {viewMode === "doses" && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="gap-2">
              Todas
              <Badge variant="secondary" className="rounded-full px-2 py-0">
                {counts.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="missed" className="gap-2">
              Atrasadas
              {counts.missed > 0 && (
                <Badge className="rounded-full px-2 py-0 bg-red-500">
                  {counts.missed}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="due" className="gap-2">
              Urgentes
              {counts.due > 0 && (
                <Badge className="rounded-full px-2 py-0 bg-amber-500">
                  {counts.due}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="soon" className="gap-2">
              Próximas
              {counts.soon > 0 && (
                <Badge className="rounded-full px-2 py-0 bg-emerald-500">
                  {counts.soon}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              Programadas
              {counts.upcoming > 0 && (
                <Badge className="rounded-full px-2 py-0 bg-sky-500">
                  {counts.upcoming}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredDoses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Filter className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    No se encontraron dosis {activeTab !== "all" && `en esta categoría`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredDoses.map((dose) => (
                  <DoseCard key={dose.id} dose={dose} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Vista de Historial */}
      {viewMode === "history" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              Historial de Tomas ({history.length})
            </h3>
          </div>

          {history.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <History className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay historial de tomas aún</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {history.map((dose) => {
                const scheduledDate = new Date(dose.scheduled_at);
                const takenDate = dose.taken_at ? new Date(dose.taken_at) : null;
                const delayMinutes = dose.delay_minutes || 0;
                
                // Determinar el tipo de badge según el estado
                let statusBadge;
                let delayBadge;
                
                if (dose.status === 'taken') {
                  statusBadge = (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Tomada
                    </Badge>
                  );
                  
                  // Badge de puntualidad
                  if (delayMinutes === null || delayMinutes === 0) {
                    delayBadge = (
                      <Badge variant="outline" className="gap-1">
                        <Minus className="h-3 w-3" />
                        A tiempo
                      </Badge>
                    );
                  } else if (delayMinutes > 0) {
                    const formattedDelay = formatDelayTime(delayMinutes);
                    delayBadge = (
                      <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
                        <TrendingUp className="h-3 w-3" />
                        +{formattedDelay} tarde
                      </Badge>
                    );
                  } else {
                    const formattedAdvance = formatDelayTime(delayMinutes);
                    delayBadge = (
                      <Badge variant="outline" className="gap-1 text-blue-600 border-blue-300">
                        <TrendingDown className="h-3 w-3" />
                        {formattedAdvance} antes
                      </Badge>
                    );
                  }
                } else if (dose.status === 'scheduled') {
                  statusBadge = (
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                      <Clock className="h-3 w-3 mr-1" />
                      Programada
                    </Badge>
                  );
                } else if (dose.status === 'pending') {
                  statusBadge = (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Pendiente
                    </Badge>
                  );
                } else {
                  statusBadge = (
                    <Badge variant="outline">{dose.status}</Badge>
                  );
                }

                return (
                  <Card key={dose.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          {/* Medicamento y diagnóstico */}
                          <div>
                            <p className="font-semibold text-base">{dose.medicine_name}</p>
                            {dose.dosage && (
                              <p className="text-sm text-muted-foreground">{dose.dosage}</p>
                            )}
                            {dose.diagnosis && (
                              <p className="text-xs text-muted-foreground">{dose.diagnosis}</p>
                            )}
                          </div>

                          {/* Horarios */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">Programada</p>
                              <p className="font-medium">
                                {scheduledDate.toLocaleDateString('es-MX', { 
                                  day: '2-digit', 
                                  month: 'short' 
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {scheduledDate.toLocaleTimeString('es-MX', { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  hour12: false
                                })}
                              </p>
                            </div>

                            {takenDate && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Tomada</p>
                                <p className="font-medium">
                                  {takenDate.toLocaleDateString('es-MX', { 
                                    day: '2-digit', 
                                    month: 'short' 
                                  })}
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  {takenDate.toLocaleTimeString('es-MX', { 
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    hour12: false
                                  })}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Badges de estado */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {statusBadge}
                            {delayBadge}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
