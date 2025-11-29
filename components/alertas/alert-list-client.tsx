'use client'

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  updateReminderStatus, 
  updateCustomAlertStatus,
  deleteCustomAlert,
  deleteMultipleAlerts,
  markAlertsAsRead,
  createCustomAlert,
  snoozeAlert,
  type UnifiedAlert,
  type CreateCustomAlertParams
} from '@/lib/actions/alerts.actions';
import { 
  AlertTriangle, 
  Users, 
  ShieldCheck, 
  CheckCircle, 
  Clock, 
  Loader2, 
  Plus,
  Trash2,
  Filter,
  Search,
  X,
  Bell,
  Pill,
  Syringe,
  Calendar,
  FileText,
  Timer,
  Layers,
  type LucideIcon 
} from 'lucide-react';
import { groupAlertsByPriority, getPriorityOrder } from '@/lib/utils/alert-grouping';
import { PriorityGroup } from './priority-group';

const alertMetadata: Record<string, { icon: LucideIcon, color: string, bgColor: string }> = {
  document_reminder: { icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-950/40' },
  family_activity: { icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/40' },
  security_alert: { icon: ShieldCheck, color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-950/40' },
  custom: { icon: Bell, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950/40' },
  medication: { icon: Pill, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950/40' },
  vaccine: { icon: Syringe, color: 'text-cyan-600', bgColor: 'bg-cyan-50 dark:bg-cyan-950/40' },
  appointment: { icon: Calendar, color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950/40' },
  insurance: { icon: FileText, color: 'text-indigo-600', bgColor: 'bg-indigo-50 dark:bg-indigo-950/40' },
};

const statusBadgeConfig = {
  pendiente: { label: 'Pendiente', variant: 'destructive' as const },
  info: { label: 'Información', variant: 'secondary' as const },
  completada: { label: 'Completada', variant: 'outline' as const },
  pospuesta: { label: 'Pospuesta', variant: 'outline' as const },
  cancelada: { label: 'Cancelada', variant: 'outline' as const },
};

const priorityBadgeConfig = {
  crítica: { label: 'Crítica', variant: 'destructive' as const },
  alta: { label: 'Alta', variant: 'default' as const },
  media: { label: 'Media', variant: 'secondary' as const },
  baja: { label: 'Baja', variant: 'outline' as const },
};

export function AlertListClient({ alerts }: { alerts: UnifiedAlert[] }) {
  const [activeTab, setActiveTab] = useState('pendientes');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showGroupByPriority, setShowGroupByPriority] = useState(true);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAlert, setNewAlert] = useState<CreateCustomAlertParams>({
    title: '',
    message: '',
    type: 'custom',
    priority: 'media',
  });

  const handleUpdateStatus = async (alert: UnifiedAlert, status: 'completada' | 'pospuesta' | 'cancelada') => {
    setLoadingAction(alert.id);
    
    let result;
    if (alert.original_table === 'document_reminders') {
      result = await updateReminderStatus(alert.id, status as 'completada' | 'pospuesta');
    } else if (alert.original_table === 'custom_alerts') {
      result = await updateCustomAlertStatus(alert.id, status);
    } else {
      setLoadingAction(null);
      return;
    }
    
    if (result.success) {
      toast.success(`Alerta marcada como ${status}.`);
    } else {
      toast.error(result.error);
    }
    setLoadingAction(null);
  };

  const handleDeleteAlert = async (alertId: string, table: UnifiedAlert['original_table']) => {
    setLoadingAction(alertId);
    
    if (table === 'custom_alerts') {
      const result = await deleteCustomAlert(alertId);
      if (result.success) {
        toast.success('Alerta eliminada correctamente');
      } else {
        toast.error(result.error);
      }
    } else if (table === 'document_reminders') {
      const result = await deleteMultipleAlerts([alertId], 'document_reminders');
      if (result.success) {
        toast.success('Recordatorio eliminado correctamente');
      } else {
        toast.error(result.error);
      }
    }
    
    setLoadingAction(null);
  };

  const handleSnooze = async (alertId: string, duration: '1hour' | '3hours' | '1day' | '3days' | '1week') => {
    setLoadingAction(alertId);
    
    const durationLabels = {
      '1hour': '1 hora',
      '3hours': '3 horas',
      '1day': '1 día',
      '3days': '3 días',
      '1week': '1 semana'
    };
    
    const result = await snoozeAlert(alertId, duration);
    if (result.success) {
      toast.success(`Alerta pospuesta por ${durationLabels[duration]}`);
    } else {
      toast.error(result.error || 'No se pudo posponer la alerta');
    }
    
    setLoadingAction(null);
  };

  const handleBulkDelete = async () => {
    if (selectedAlerts.size === 0) return;
    
    setLoadingAction('bulk-delete');
    const customAlertIds = alerts
      .filter(a => selectedAlerts.has(a.id) && a.original_table === 'custom_alerts')
      .map(a => a.id);
    const documentReminderIds = alerts
      .filter(a => selectedAlerts.has(a.id) && a.original_table === 'document_reminders')
      .map(a => a.id);
    
    if (customAlertIds.length > 0) {
      await deleteMultipleAlerts(customAlertIds, 'custom_alerts');
    }
    if (documentReminderIds.length > 0) {
      await deleteMultipleAlerts(documentReminderIds, 'document_reminders');
    }
    
    toast.success(`${selectedAlerts.size} alertas eliminadas`);
    setSelectedAlerts(new Set());
    setLoadingAction(null);
  };

  const handleMarkAsRead = async () => {
    if (selectedAlerts.size === 0) return;
    
    const unreadAlertIds = alerts
      .filter(a => selectedAlerts.has(a.id) && a.original_table === 'custom_alerts' && !a.is_read)
      .map(a => a.id);
    
    if (unreadAlertIds.length === 0) {
      toast.info('No hay alertas sin leer seleccionadas');
      return;
    }
    
    const result = await markAlertsAsRead(unreadAlertIds);
    if (result.success) {
      toast.success(`${unreadAlertIds.length} alertas marcadas como leídas`);
      setSelectedAlerts(new Set());
    } else {
      toast.error(result.error);
    }
  };

  const handleCreateAlert = async () => {
    if (!newAlert.title || !newAlert.message) {
      toast.error('Completa todos los campos requeridos');
      return;
    }
    
    const result = await createCustomAlert(newAlert);
    if (result.success) {
      toast.success('Alerta creada correctamente');
      setShowCreateDialog(false);
      setNewAlert({
        title: '',
        message: '',
        type: 'custom',
        priority: 'media',
      });
    } else {
      toast.error(result.error);
    }
  };

  const toggleAlertSelection = (alertId: string) => {
    const newSet = new Set(selectedAlerts);
    if (newSet.has(alertId)) {
      newSet.delete(alertId);
    } else {
      newSet.add(alertId);
    }
    setSelectedAlerts(newSet);
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || alert.priority === filterPriority;
    const matchesType = filterType === 'all' || alert.type === filterType;
    return matchesSearch && matchesPriority && matchesType;
  });

  const renderAlerts = (filterStatus: UnifiedAlert['status'][]) => {
    const filtered = filteredAlerts.filter(alert => filterStatus.includes(alert.status));

    if (filtered.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
          <div className="mb-3 p-3 bg-slate-100 dark:bg-slate-900 rounded-full">
            <CheckCircle className="h-6 w-6 text-slate-400 dark:text-slate-600" />
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            No hay alertas en esta categoría.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2 sm:space-y-3">
        {filtered.map((alert) => {
          const metadata = alertMetadata[alert.type] || alertMetadata.custom;
          const Icon = metadata.icon;
          const statusConfig = statusBadgeConfig[alert.status];
          const priorityConfig = alert.priority ? priorityBadgeConfig[alert.priority] : null;
          const canDelete = alert.original_table === 'custom_alerts' || alert.original_table === 'document_reminders';
          const canUpdate = alert.type === 'document_reminder' || alert.original_table === 'custom_alerts';

          const AlertBody = (
            <div className="flex items-start gap-3 w-full">
              {canDelete && (
                <Checkbox
                  checked={selectedAlerts.has(alert.id)}
                  onCheckedChange={() => toggleAlertSelection(alert.id)}
                  className="mt-1"
                />
              )}
              <div className={cn("p-2 rounded-lg flex-shrink-0", metadata.bgColor)}>
                <Icon className={cn("h-5 w-5", metadata.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100 break-words">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString('es-ES', { 
                          dateStyle: 'short', 
                          timeStyle: 'short' 
                        })}
                      </p>
                      {!alert.is_read && alert.original_table === 'custom_alerts' && (
                        <Badge variant="default" className="text-xs">Nueva</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {priorityConfig && (
                      <Badge variant={priorityConfig.variant} className="text-xs w-fit flex-shrink-0">
                        {priorityConfig.label}
                      </Badge>
                    )}
                    <Badge variant={statusConfig.variant} className="text-xs w-fit flex-shrink-0">
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {canUpdate && alert.status === 'pendiente' && (
                  <>
                    {/* Botón Snooze con dropdown */}
                    {alert.original_table === 'custom_alerts' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            disabled={loadingAction === alert.id}
                            className="h-8 text-xs gap-1"
                          >
                            {loadingAction === alert.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Timer className="h-3 w-3" />
                                <span className="hidden sm:inline">Posponer</span>
                              </>
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Posponer por:</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSnooze(alert.id, '1hour');
                          }}>
                            1 hora
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSnooze(alert.id, '3hours');
                          }}>
                            3 horas
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSnooze(alert.id, '1day');
                          }}>
                            1 día
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSnooze(alert.id, '3days');
                          }}>
                            3 días
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSnooze(alert.id, '1week');
                          }}>
                            1 semana
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    
                    <Button 
                      size="sm" 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        handleUpdateStatus(alert, 'completada'); 
                      }} 
                      disabled={loadingAction === alert.id}
                      className="h-8 text-xs gap-1"
                    >
                      {loadingAction === alert.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                    </Button>
                  </>
                )}
                {canDelete && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      handleDeleteAlert(alert.id, alert.original_table); 
                    }} 
                    disabled={loadingAction === alert.id}
                    className="h-8 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {loadingAction === alert.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </Button>
                )}
              </div>
            </div>
          );

          return (
            <Card 
              key={alert.id} 
              className={cn(
                "border-slate-200 shadow-sm dark:border-slate-800 transition-opacity",
                alert.status !== 'pendiente' && alert.status !== 'info' && 'opacity-60',
                selectedAlerts.has(alert.id) && 'ring-2 ring-blue-500'
              )}
            >
              <CardContent className="p-0">
                {alert.link ? (
                  <Link href={alert.link} className="block p-3 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition">
                    {AlertBody}
                  </Link>
                ) : (
                  <div className="p-3 sm:p-4">{AlertBody}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderAlertsGrouped = (filterStatus: UnifiedAlert['status'][]) => {
    const filtered = filteredAlerts.filter(alert => filterStatus.includes(alert.status));

    if (filtered.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
          <div className="mb-3 p-3 bg-slate-100 dark:bg-slate-900 rounded-full">
            <CheckCircle className="h-6 w-6 text-slate-400 dark:text-slate-600" />
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            No hay alertas en esta categoría.
          </p>
        </div>
      );
    }

    const grouped = groupAlertsByPriority(filtered);
    const priorities = getPriorityOrder();

    return (
      <div className="space-y-3 sm:space-y-4">
        {priorities.map((priority) => {
          const alertsInGroup = grouped[priority];
          return (
            <PriorityGroup
              key={priority}
              priority={priority}
              count={alertsInGroup.length}
              defaultExpanded={priority === 'crítica' || priority === 'alta'}
            >
              <div className="space-y-2 sm:space-y-3">
                {alertsInGroup.map((alert) => {
                  const metadata = alertMetadata[alert.type] || alertMetadata.custom;
                  const Icon = metadata.icon;
                  const statusConfig = statusBadgeConfig[alert.status];
                  const priorityConfig = alert.priority ? priorityBadgeConfig[alert.priority] : null;
                  const canDelete = alert.original_table === 'custom_alerts' || alert.original_table === 'document_reminders';
                  const canUpdate = alert.type === 'document_reminder' || alert.original_table === 'custom_alerts';

                  const AlertBody = (
                    <div className="flex items-start gap-3 w-full">
                      {canDelete && (
                        <Checkbox
                          checked={selectedAlerts.has(alert.id)}
                          onCheckedChange={() => toggleAlertSelection(alert.id)}
                          className="mt-1"
                        />
                      )}
                      <div className={cn("p-2 rounded-lg flex-shrink-0", metadata.bgColor)}>
                        <Icon className={cn("h-5 w-5", metadata.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100 break-words">
                              {alert.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-muted-foreground">
                                {new Date(alert.created_at).toLocaleString('es-ES', { 
                                  dateStyle: 'short', 
                                  timeStyle: 'short' 
                                })}
                              </p>
                              {!alert.is_read && alert.original_table === 'custom_alerts' && (
                                <Badge variant="default" className="text-xs">Nueva</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant={statusConfig.variant} className="text-xs w-fit flex-shrink-0">
                              {statusConfig.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {canUpdate && alert.status === 'pendiente' && (
                          <>
                            {alert.original_table === 'custom_alerts' && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    disabled={loadingAction === alert.id}
                                    className="h-8 text-xs gap-1"
                                  >
                                    {loadingAction === alert.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <>
                                        <Timer className="h-3 w-3" />
                                        <span className="hidden sm:inline">Posponer</span>
                                      </>
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Posponer por:</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSnooze(alert.id, '1hour');
                                  }}>
                                    1 hora
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSnooze(alert.id, '3hours');
                                  }}>
                                    3 horas
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSnooze(alert.id, '1day');
                                  }}>
                                    1 día
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSnooze(alert.id, '3days');
                                  }}>
                                    3 días
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSnooze(alert.id, '1week');
                                  }}>
                                    1 semana
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                            
                            <Button 
                              size="sm" 
                              onClick={(e) => { 
                                e.preventDefault(); 
                                handleUpdateStatus(alert, 'completada'); 
                              }} 
                              disabled={loadingAction === alert.id}
                              className="h-8 text-xs gap-1"
                            >
                              {loadingAction === alert.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                            </Button>
                          </>
                        )}
                        {canDelete && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={(e) => { 
                              e.preventDefault(); 
                              handleDeleteAlert(alert.id, alert.original_table); 
                            }} 
                            disabled={loadingAction === alert.id}
                            className="h-8 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {loadingAction === alert.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  );

                  return (
                    <Card 
                      key={alert.id} 
                      className={cn(
                        "border-slate-200 shadow-sm dark:border-slate-800 transition-opacity",
                        alert.status !== 'pendiente' && alert.status !== 'info' && 'opacity-60',
                        selectedAlerts.has(alert.id) && 'ring-2 ring-blue-500'
                      )}
                    >
                      <CardContent className="p-0">
                        {alert.link ? (
                          <Link href={alert.link} className="block p-3 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition">
                            {AlertBody}
                          </Link>
                        ) : (
                          <div className="p-3 sm:p-4">{AlertBody}</div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </PriorityGroup>
          );
        })}
      </div>
    );
  };

  const pendingCount = filteredAlerts.filter(a => a.status === 'pendiente').length;
  const infoCount = filteredAlerts.filter(a => a.status === 'info').length;
  const completedCount = filteredAlerts.filter(a => a.status === 'completada' || a.status === 'pospuesta').length;
  const unreadCount = filteredAlerts.filter(a => !a.is_read && a.original_table === 'custom_alerts').length;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Barra de herramientas */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar alertas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="crítica">Crítica</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="document_reminder">Documentos</SelectItem>
              <SelectItem value="medication">Medicamentos</SelectItem>
              <SelectItem value="vaccine">Vacunas</SelectItem>
              <SelectItem value="appointment">Citas</SelectItem>
              <SelectItem value="custom">Personalizadas</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={showGroupByPriority ? "default" : "outline"}
            size="sm"
            onClick={() => setShowGroupByPriority(!showGroupByPriority)}
            className="flex items-center gap-1"
          >
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Agrupar</span>
          </Button>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {selectedAlerts.size > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAsRead}
                className="flex-1 sm:flex-none"
              >
                Marcar leídas
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={loadingAction === 'bulk-delete'}
                className="flex-1 sm:flex-none"
              >
                {loadingAction === 'bulk-delete' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar ({selectedAlerts.size})
                  </>
                )}
              </Button>
            </>
          )}
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex-1 sm:flex-none">
                <Plus className="h-4 w-4 mr-1" />
                Nueva Alerta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Crear Nueva Alerta</DialogTitle>
                <DialogDescription>
                  Crea una alerta personalizada para recordarte algo importante.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={newAlert.title}
                    onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                    placeholder="Ej: Renovar seguro médico"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="message">Mensaje *</Label>
                  <Textarea
                    id="message"
                    value={newAlert.message}
                    onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                    placeholder="Describe los detalles de tu alerta..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select 
                      value={newAlert.type} 
                      onValueChange={(value) => setNewAlert({ ...newAlert, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Personalizada</SelectItem>
                        <SelectItem value="medication">Medicamento</SelectItem>
                        <SelectItem value="vaccine">Vacuna</SelectItem>
                        <SelectItem value="appointment">Cita</SelectItem>
                        <SelectItem value="insurance">Seguro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="priority">Prioridad</Label>
                    <Select 
                      value={newAlert.priority} 
                      onValueChange={(value: any) => setNewAlert({ ...newAlert, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baja">Baja</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="crítica">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="trigger_date">Fecha de activación (opcional)</Label>
                  <Input
                    id="trigger_date"
                    type="datetime-local"
                    value={newAlert.trigger_date || ''}
                    onChange={(e) => setNewAlert({ ...newAlert, trigger_date: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="link">Enlace (opcional)</Label>
                  <Input
                    id="link"
                    value={newAlert.link || ''}
                    onChange={(e) => setNewAlert({ ...newAlert, link: e.target.value })}
                    placeholder="/dashboard/documentos/..."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateAlert}>
                  Crear Alerta
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      {unreadCount > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardContent className="p-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Tienes {unreadCount} alerta{unreadCount !== 1 ? 's' : ''} nueva{unreadCount !== 1 ? 's' : ''} sin leer
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 gap-1 sm:gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
          <TabsTrigger 
            value="pendientes"
            className="data-[state=active]:bg-white data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-950 dark:data-[state=active]:text-slate-100 text-xs sm:text-sm py-2 relative"
          >
            Pendientes
            {pendingCount > 0 && (
              <span className="absolute top-1 right-1 sm:top-0 sm:right-0 h-5 w-5 sm:h-6 sm:w-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="informativas"
            className="data-[state=active]:bg-white data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-950 dark:data-[state=active]:text-slate-100 text-xs sm:text-sm py-2 relative"
          >
            Info
            {infoCount > 0 && (
              <span className="absolute top-1 right-1 sm:top-0 sm:right-0 h-5 w-5 sm:h-6 sm:w-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                {infoCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="completadas"
            className="data-[state=active]:bg-white data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-950 dark:data-[state=active]:text-slate-100 text-xs sm:text-sm py-2 relative"
          >
            Historial
            {completedCount > 0 && (
              <span className="absolute top-1 right-1 sm:top-0 sm:right-0 h-5 w-5 sm:h-6 sm:w-6 bg-slate-500 text-white text-xs rounded-full flex items-center justify-center">
                {completedCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes" className="mt-4 space-y-3 sm:space-y-4">
          {showGroupByPriority ? renderAlertsGrouped(['pendiente']) : renderAlerts(['pendiente'])}
        </TabsContent>
        <TabsContent value="informativas" className="mt-4 space-y-3 sm:space-y-4">
          {showGroupByPriority ? renderAlertsGrouped(['info']) : renderAlerts(['info'])}
        </TabsContent>
        <TabsContent value="completadas" className="mt-4 space-y-3 sm:space-y-4">
          {showGroupByPriority ? renderAlertsGrouped(['completada', 'pospuesta', 'cancelada']) : renderAlerts(['completada', 'pospuesta', 'cancelada'])}
        </TabsContent>
      </Tabs>
    </div>
  );
}