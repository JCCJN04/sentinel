'use client'

import { useMemo, useState, useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { addVaccine, deleteVaccine, type VaccineRecord, type VaccineCatalogItem, type VaccineForm } from '@/lib/actions/vaccines.actions'
import { cn } from '@/lib/utils'
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  ListFilter,
  MapPin,
  PlusCircle,
  Shield,
  Sparkles,
  Syringe,
  Trash2,
} from 'lucide-react'

interface VaccineClientPageProps {
  initialVaccines: VaccineRecord[]
  vaccineCatalog: VaccineCatalogItem[]
}

const defaultFormValues: VaccineForm = {
  vaccine_name: '',
  disease_protected: '',
  administration_date: '',
  dose_details: '',
  lot_number: '',
  application_site: '',
}

const vaccineSchema = z.object({
  vaccine_name: z.string().min(1, 'Debes seleccionar una vacuna.'),
  disease_protected: z.string().optional().default(''),
  administration_date: z.string().min(1, 'La fecha es requerida.'),
  dose_details: z.string().optional(),
  lot_number: z.string().optional(),
  application_site: z.string().optional(),
})

const formatDate = (value: string) => {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

const getTimeValue = (value: string) => {
  if (!value) return 0
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

export function VaccineClientPage({ initialVaccines, vaccineCatalog }: VaccineClientPageProps) {
  const [vaccines, setVaccines] = useState<VaccineRecord[]>(initialVaccines)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedToDelete, setSelectedToDelete] = useState<VaccineRecord | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [quickSearchTerm, setQuickSearchTerm] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'overview' | 'records'>('overview')
  const [activeDisease, setActiveDisease] = useState<string>('all')
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    register,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VaccineForm>({
    resolver: zodResolver(vaccineSchema),
    defaultValues: defaultFormValues,
  })

  const vaccinesSorted = useMemo(
    () => [...vaccines].sort((a, b) => getTimeValue(b.administration_date) - getTimeValue(a.administration_date)),
    [vaccines],
  )

  const diseaseFilters = useMemo(() => {
    const options = new Map<string, string>()
    vaccinesSorted.forEach((record) => {
      const label = record.disease_protected?.trim()
      if (label) {
        options.set(label.toLowerCase(), label)
      }
    })
    return Array.from(options, ([value, label]) => ({ value, label }))
  }, [vaccinesSorted])

  const diseaseFilterOptions = useMemo(
    () => [{ value: 'all', label: 'Todas las enfermedades' }, ...diseaseFilters],
    [diseaseFilters],
  )

  const filteredVaccines = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    let dataset = vaccinesSorted

    if (activeDisease !== 'all') {
      dataset = dataset.filter((record) => (record.disease_protected ?? '').toLowerCase() === activeDisease)
    }

    if (!term) return dataset

    return dataset.filter((record) =>
      [
        record.vaccine_name,
        record.disease_protected ?? '',
        record.dose_details ?? '',
        record.application_site ?? '',
        record.lot_number ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [activeDisease, searchTerm, vaccinesSorted])

  const lastDoseDate = vaccinesSorted[0]?.administration_date ?? null
  const uniqueVaccines = useMemo(() => new Set(vaccines.map((item) => item.vaccine_name)).size, [vaccines])
  const uniqueDiseases = useMemo(
    () => new Set(vaccines.map((item) => (item.disease_protected ?? '').toLowerCase()).filter(Boolean)).size,
    [vaccines],
  )
  const uniqueApplicationSites = useMemo(
    () => new Set(vaccines.map((item) => (item.application_site ?? '').toLowerCase()).filter(Boolean)).size,
    [vaccines],
  )

  const recommendations = useMemo(
    () =>
      vaccineCatalog
        .filter((item) => !vaccines.some((record) => record.vaccine_name === item.name))
        .slice(0, 6),
    [vaccineCatalog, vaccines],
  )

  const catalogMatches = useMemo(() => {
    const term = quickSearchTerm.trim().toLowerCase()
    if (!term) return vaccineCatalog
    return vaccineCatalog.filter((item) =>
      [item.name, item.disease_protected]
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [quickSearchTerm, vaccineCatalog])

  const allSuggestionsAdded = useMemo(
    () => vaccineCatalog.every((item) => vaccines.some((record) => record.vaccine_name === item.name)),
    [vaccines, vaccineCatalog],
  )

  const catalogSize = vaccineCatalog.length
  const coverageValue = catalogSize === 0 ? 0 : Math.min(100, Math.round((uniqueVaccines / catalogSize) * 100))
  const coverageLabel =
    coverageValue === 0
      ? 'Aún no registras vacunas de tu catálogo.'
      : coverageValue < 100
        ? `Ya cubres el ${coverageValue}% de las vacunas recomendadas.`
        : '¡Excelente! Has registrado todo el catálogo disponible.'
  const nextRecommendation = recommendations[0] ?? null
  const latestRecord = vaccinesSorted[0] ?? null

  const timelineGroups = useMemo(() => {
    const groups = new Map<string, VaccineRecord[]>()

    vaccinesSorted.forEach((record) => {
      const yearDate = new Date(record.administration_date)
      const isValidDate = !Number.isNaN(yearDate.getTime())
      const key = isValidDate ? String(yearDate.getFullYear()) : 'Sin fecha'
      const items = groups.get(key) ?? []
      items.push(record)
      groups.set(key, items)
    })

    return Array.from(groups.entries())
      .map(([year, items]) => ({
        year,
        items: [...items].sort((a, b) => getTimeValue(b.administration_date) - getTimeValue(a.administration_date)),
      }))
      .sort((a, b) => {
        if (a.year === 'Sin fecha') return 1
        if (b.year === 'Sin fecha') return -1
        return Number(b.year) - Number(a.year)
      })
  }, [vaccinesSorted])

  const hasTimeline = timelineGroups.length > 0

  const diseaseFilterButtonClass = (value: string, isExpanded?: boolean) =>
    cn(
      'rounded-full border-slate-200 font-medium transition dark:border-slate-700',
      isExpanded ? 'w-full px-5 py-2.5 text-sm sm:text-base' : 'px-5 py-2 text-sm sm:text-base',
      activeDisease === value && 'bg-emerald-600 text-white hover:bg-emerald-600 dark:text-white',
    )

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      reset(defaultFormValues)
      setQuickSearchTerm('')
    }
  }

  const handleVaccineSelection = (vaccineName: string) => {
    const selected = vaccineCatalog.find((item) => item.name === vaccineName)
    setValue('vaccine_name', vaccineName)
    setValue('disease_protected', selected?.disease_protected ?? '')
  }

  const openDialogPrefilled = (vaccineName: string) => {
    const selected = vaccineCatalog.find((item) => item.name === vaccineName)
    reset({
      ...defaultFormValues,
      vaccine_name: selected?.name ?? '',
      disease_protected: selected?.disease_protected ?? '',
    })
    setIsDialogOpen(true)
  }

  const onSubmit = handleSubmit((formData) => {
    startTransition(() => {
      addVaccine(formData).then((result) => {
        if (!result.success) {
          toast.error(result.error ?? 'No se pudo guardar la vacuna.')
          return
        }

        if (result.data) {
          setVaccines((prev) => [result.data!, ...prev])
        }

        toast.success('Vacuna añadida correctamente.')
        handleDialogChange(false)
      })
    })
  })

  const requestDelete = (record: VaccineRecord) => {
    setSelectedToDelete(record)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedToDelete) return
    setIsDeleting(true)
    const result = await deleteVaccine(selectedToDelete.id)
    if (result.success) {
      setVaccines((prev) => prev.filter((item) => item.id !== selectedToDelete.id))
      toast.success('Registro de vacuna eliminado.')
    } else {
      toast.error(result.error ?? 'No se pudo eliminar la vacuna.')
    }
    setIsDeleting(false)
    setDeleteDialogOpen(false)
    setSelectedToDelete(null)
  }

  const hasRecords = vaccines.length > 0
  const isSaving = isSubmitting || isPending

  return (
    <div className="space-y-3 pb-24 md:space-y-6">
      <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-3 shadow-sm dark:border-slate-800 dark:from-emerald-950/40 dark:via-slate-950 dark:to-slate-900 sm:rounded-2xl sm:p-4 md:flex md:items-center md:justify-between md:gap-8 md:p-6">
        <div className="flex flex-1 flex-col gap-3 sm:gap-4">
          <div className="space-y-2 sm:space-y-3">
            <Badge variant="outline" className="w-fit gap-1 border-emerald-200 bg-white/80 text-emerald-700 text-xs sm:text-sm dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Sparkles className="h-3 w-3" />
              Módulo de vacunación
            </Badge>
            <div className="space-y-1.5 sm:space-y-3">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl md:text-4xl">
                Organiza tus vacunas
              </h2>
              <p className="text-sm text-muted-foreground sm:text-base md:text-lg">
                Visualiza tu progreso y registra nuevas dosis en segundos.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button onClick={() => handleDialogChange(true)} className="h-10 w-full gap-2 text-sm sm:h-11 sm:w-auto sm:gap-3 sm:text-base">
                <PlusCircle className="h-4 w-4" />
                Registrar
              </Button>
              <Button
                variant="outline"
                className="h-10 w-full gap-2 text-sm sm:h-11 sm:w-auto sm:gap-3 sm:text-base"
                onClick={() => setActiveTab('records')}
              >
                <ListFilter className="h-4 w-4" />
                Historial
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-3 rounded-lg border border-emerald-100/70 bg-white/80 p-3 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80 sm:mt-4 sm:rounded-2xl sm:p-5 md:mt-0 md:w-[340px] md:flex-shrink-0 md:p-6">
          <div className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-200 sm:text-base sm:flex-row sm:items-center sm:justify-between">
            <span>Progreso</span>
            <span className="text-emerald-600 dark:text-emerald-300">{coverageValue}%</span>
          </div>
          <Progress
            value={coverageValue}
            className="mt-2 h-2 bg-emerald-100 dark:bg-emerald-950/40 sm:mt-4 sm:h-2.5"
            indicatorClassName="bg-emerald-500 dark:bg-emerald-400"
          />
          <p className="mt-2 text-xs text-muted-foreground sm:mt-3 sm:text-sm">{coverageLabel}</p>
          <div className="mt-3 space-y-2 text-xs sm:mt-5 sm:space-y-3 sm:text-sm">
            <div className="flex items-start gap-2 text-slate-700 dark:text-slate-200 line-clamp-2">
              <CalendarDays className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500 dark:text-emerald-300" />
              {latestRecord ? (
                <span className="text-xs sm:text-sm">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatDate(latestRecord.administration_date)}
                  </span>{' '}
                  · {latestRecord.vaccine_name}
                </span>
              ) : (
                <span className="text-xs sm:text-sm">Sin dosis registradas</span>
              )}
            </div>
            <div className="flex items-start gap-2 text-slate-700 dark:text-slate-200 line-clamp-2">
              <Shield className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500 dark:text-emerald-300" />
              {nextRecommendation ? (
                <span className="text-xs sm:text-sm">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{nextRecommendation.name}</span>
                </span>
              ) : (
                <span className="text-xs sm:text-sm">¡Todas cubiertas!</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'overview' | 'records')}
        className="space-y-3 sm:space-y-5"
      >
        <TabsList className="w-full justify-start gap-2 overflow-x-auto rounded-full border border-slate-200 bg-white p-1 shadow-md dark:border-slate-800 dark:bg-slate-950/70 sm:gap-3 sm:p-1.5">
          <TabsTrigger
            value="overview"
            className="flex-1 rounded-full px-3 py-2 text-xs sm:text-base sm:px-5 sm:py-2.5 font-medium transition data-[state=active]:bg-emerald-600 data-[state=active]:text-white md:flex-none"
          >
            Resumen
          </TabsTrigger>
          <TabsTrigger
            value="records"
            className="flex-1 rounded-full px-3 py-2 text-xs sm:text-base sm:px-5 sm:py-2.5 font-medium transition data-[state=active]:bg-emerald-600 data-[state=active]:text-white md:flex-none"
          >
            Registros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3 sm:space-y-5">
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Card className="border-slate-200 shadow-md dark:border-slate-800">
              <CardContent className="flex items-start justify-between gap-4 px-4 pb-4 pt-5 sm:px-6 sm:pb-6 sm:pt-7">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground sm:text-sm">Vacunas registradas</p>
                  <p className="text-3xl sm:text-5xl font-bold text-emerald-600 dark:text-emerald-300">{vaccines.length}</p>
                  <p className="text-xs sm:text-base text-muted-foreground">
                    {uniqueVaccines} únicas · {uniqueDiseases || 0} enfermedades
                  </p>
                </div>
                <Syringe className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-500/70 dark:text-emerald-400/80 flex-shrink-0" />
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-md dark:border-slate-800">
              <CardContent className="flex items-start justify-between gap-4 px-4 pb-4 pt-5 sm:px-6 sm:pb-6 sm:pt-7">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground sm:text-sm">Última dosis</p>
                  <p className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {lastDoseDate ? formatDate(lastDoseDate) : 'Sin historial'}
                  </p>
                  <p className="text-xs sm:text-base text-muted-foreground">
                    Se actualiza cada vez que registras una vacuna.
                  </p>
                </div>
                <CalendarDays className="h-8 w-8 sm:h-9 sm:w-9 text-blue-500 dark:text-blue-300 flex-shrink-0" />
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-md dark:border-slate-800">
              <CardContent className="flex items-start justify-between gap-4 px-4 pb-4 pt-5 sm:px-6 sm:pb-6 sm:pt-7">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground sm:text-sm">Diversidad</p>
                  <p className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {uniqueApplicationSites || 0} lugares
                  </p>
                  <p className="text-xs sm:text-base text-muted-foreground">
                    Documentadas en tu historial.
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 sm:h-9 sm:w-9 text-purple-500 dark:text-purple-300 flex-shrink-0" />
              </CardContent>
            </Card>
          </div>

          {recommendations.length > 0 && (
            <Card className="border-slate-200 shadow-md dark:border-slate-800">
              <CardHeader className="gap-2 p-4 sm:gap-3 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base sm:text-lg md:text-xl font-semibold">Vacunas sugeridas</CardTitle>
                  <CardDescription className="text-xs sm:text-base text-muted-foreground">
                    Añade estas dosis cuando las recibas.
                  </CardDescription>
                </div>
                <div className="w-full sm:w-72">
                  <Input
                    type="search"
                    value={quickSearchTerm}
                    onChange={(event) => setQuickSearchTerm(event.target.value)}
                    placeholder="Buscar en catálogo"
                    className="h-9 pl-3 text-sm sm:h-10 sm:text-base"
                  />
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 sm:gap-3 sm:p-6 lg:grid-cols-3">
                {catalogMatches.length === 0 ? (
                  <p className="col-span-full text-sm sm:text-base text-muted-foreground">No hay coincidencias con tu búsqueda.</p>
                ) : (
                  catalogMatches.map((item) => {
                    const alreadyAdded = vaccines.some((record) => record.vaccine_name === item.name)
                    return (
                      <Button
                        key={item.name}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(
                          'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs sm:text-sm shadow-sm transition justify-start h-auto',
                          alreadyAdded
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                            : 'border-slate-200 bg-white hover:border-emerald-200 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-950',
                        )}
                        disabled={alreadyAdded}
                        onClick={() => openDialogPrefilled(item.name)}
                      >
                        <Syringe className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate text-left">{item.name}</span>
                      </Button>
                    )
                  })
                )}
                {!quickSearchTerm && allSuggestionsAdded && (
                  <p className="col-span-full text-xs text-emerald-600 dark:text-emerald-300">
                    Ya registraste todo el catálogo disponible.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {hasTimeline && (
            <Card className="border-slate-200 shadow-sm dark:border-slate-800">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Línea de tiempo</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Revisa cómo ha evolucionado tu esquema a lo largo de los años.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <Accordion type="single" collapsible className="w-full">
                  {timelineGroups.map((group) => (
                    <AccordionItem value={group.year} key={group.year}>
                      <AccordionTrigger className="text-xs sm:text-sm font-semibold py-2 sm:py-3">
                        <span className="flex items-center gap-2">
                          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-xs dark:border-slate-700 dark:bg-slate-900">
                            {group.year}
                          </Badge>
                          <span className="text-muted-foreground text-xs sm:text-sm">{group.items.length} registros</span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 sm:space-y-3">
                          {group.items.map((record) => (
                            <div
                              key={record.id}
                              className="flex flex-col gap-2 rounded-lg sm:rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
                            >
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Syringe className="h-4 w-4 text-emerald-500 dark:text-emerald-300 flex-shrink-0" />
                                  <span className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm sm:text-base">{record.vaccine_name}</span>
                                </div>
                                <span className="text-xs sm:text-sm text-muted-foreground">{formatDate(record.administration_date)}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Shield className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-300 flex-shrink-0" />
                                  <span className="truncate">{record.disease_protected || 'No especificada'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <PlusCircle className="h-3.5 w-3.5 text-blue-500 dark:text-blue-300 flex-shrink-0" />
                                  <span className="truncate">{record.dose_details || 'No especificada'}</span>
                                </div>
                                {record.application_site && (
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <MapPin className="h-3.5 w-3.5 text-rose-500 dark:text-rose-300 flex-shrink-0" />
                                    <span className="truncate">{record.application_site}</span>
                                  </div>
                                )}
                                {record.lot_number && (
                                  <Badge variant="outline" className="border-slate-200 bg-slate-50 text-xs dark:border-slate-700 dark:bg-slate-900">
                                    Lote {record.lot_number}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="records" className="space-y-3 sm:space-y-5">
          <div className="flex flex-col gap-3 sm:gap-5 rounded-lg sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-6 shadow-md dark:border-slate-800 dark:bg-slate-950/70">
            <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1 sm:space-y-2">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100">Historial</h2>
                <p className="text-xs sm:text-base text-muted-foreground">
                  Filtra, busca o añade nuevas dosis.
                </p>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <div className="relative w-72 max-w-full">
                  <Input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar vacuna o nota"
                    className="h-10 pl-3 text-sm"
                    aria-label="Buscar registros de vacunación"
                  />
                </div>
                <Button onClick={() => handleDialogChange(true)} className="h-10 gap-2 whitespace-nowrap text-sm">
                  <PlusCircle className="h-4 w-4" />
                  Añadir
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:hidden">
              <Input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar vacuna o nota"
                className="h-10 pl-3 text-sm"
                aria-label="Buscar registros de vacunación"
              />
              <div className="flex gap-2">
                <Button onClick={() => handleDialogChange(true)} className="flex-1 gap-2 text-sm h-10" size="sm">
                  <PlusCircle className="h-4 w-4" />
                  Añadir
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2 text-sm h-10"
                  onClick={() => setIsFilterSheetOpen(true)}
                  aria-label="Abrir filtros de historial"
                  size="sm"
                >
                  <ListFilter className="h-4 w-4" />
                  Filtros
                </Button>
              </div>
            </div>

            {diseaseFilters.length > 0 && (
              <div className="hidden items-center gap-2 overflow-x-auto pb-1 sm:flex">
                {diseaseFilterOptions.map((filter) => (
                  <Button
                    key={filter.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={diseaseFilterButtonClass(filter.value)}
                    onClick={() => setActiveDisease(filter.value)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetContent
              side="bottom"
              className="max-h-[75vh] overflow-y-auto space-y-4 rounded-t-2xl border-t border-slate-200 bg-background p-4 shadow-2xl dark:border-slate-800 sm:max-w-lg sm:rounded-2xl sm:border sm:p-6"
            >
              <SheetHeader className="space-y-1">
                <SheetTitle className="text-base sm:text-lg">Personaliza tu vista</SheetTitle>
                <SheetDescription className="text-xs sm:text-sm">Filtra por enfermedad y busca registros.</SheetDescription>
              </SheetHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="mobile-history-search" className="text-sm">Buscar</Label>
                  <Input
                    id="mobile-history-search"
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar vacuna o nota"
                    className="h-10 pl-3 text-sm"
                    autoComplete="off"
                  />
                </div>
                {diseaseFilters.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Filtrar por enfermedad</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {diseaseFilterOptions.map((filter) => (
                        <Button
                          key={filter.value}
                          type="button"
                          variant="outline"
                          size="sm"
                          className={diseaseFilterButtonClass(filter.value, true)}
                          onClick={() => {
                            setActiveDisease(filter.value)
                            setIsFilterSheetOpen(false)
                          }}
                        >
                          {filter.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button type="button" className="w-full h-10 text-sm">
                    Listo
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {filteredVaccines.length === 0 ? (
            <Alert className="flex flex-col items-start gap-2 sm:gap-3 rounded-lg sm:rounded-2xl border-dashed border-slate-300 bg-white p-3 sm:p-4 text-slate-800 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Syringe className="h-5 w-5 flex-shrink-0" />
                <AlertDescription className="text-xs sm:text-base">
                  {hasRecords
                    ? 'No hay registros con los filtros aplicados.'
                    : 'Aún no has registrado vacunas. Añade tu primera dosis para comenzar.'}
                </AlertDescription>
              </div>
              <Button variant="outline" onClick={() => handleDialogChange(true)} className="gap-2 h-9 sm:h-10 text-xs sm:text-sm w-full md:w-auto">
                <PlusCircle className="h-4 w-4" />
                Registrar
              </Button>
            </Alert>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div className="hidden overflow-hidden rounded-lg sm:rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-900/60">
                      <TableHead className="w-40 text-xs sm:text-sm font-semibold">Vacuna</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold">Protección</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold">Dosis</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold">Fecha</TableHead>
                      <TableHead className="w-16 text-right text-xs sm:text-sm font-semibold">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVaccines.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">{record.vaccine_name}</div>
                          {record.lot_number && (
                            <p className="text-xs text-muted-foreground">Lote: {record.lot_number}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm text-muted-foreground">
                          {record.disease_protected || 'No especificado'}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm text-muted-foreground">
                          {record.dose_details || 'Sin detalles'}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm text-muted-foreground">
                          {formatDate(record.administration_date)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => requestDelete(record)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:gap-3 md:hidden">
                {filteredVaccines.map((record) => (
                  <Card key={record.id} className="border-slate-200 shadow-sm dark:border-slate-800">
                    <CardContent className="space-y-3 p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="space-y-1 min-w-0">
                          <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate">{record.vaccine_name}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{formatDate(record.administration_date)}</p>
                        </div>
                        <Badge className="flex-shrink-0 items-center gap-1 bg-emerald-100 px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                          <Shield className="h-3 w-3" />
                          {record.disease_protected || 'Protección'}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-start gap-2">
                          <Syringe className="h-4 w-4 flex-shrink-0" />
                          <span>{record.dose_details || 'Dosis no especificada'}</span>
                        </div>
                        {record.application_site && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span>{record.application_site}</span>
                          </div>
                        )}
                        {record.lot_number && (
                          <div className="flex items-start gap-2">
                            <span className="font-medium flex-shrink-0">Lote</span>
                            <span>{record.lot_number}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end pt-1">
                        <Button variant="ghost" size="sm" className="gap-2 text-xs sm:text-sm text-destructive h-8" onClick={() => requestDelete(record)}>
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-lg sm:max-w-2xl w-full mx-auto max-h-[90vh] overflow-y-auto rounded-lg sm:rounded-2xl">
          <DialogHeader className="space-y-1 sm:space-y-2">
            <DialogTitle className="text-base sm:text-lg md:text-xl">Registrar vacuna</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Completa los datos y guarda el registro.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="vaccine_name" className="text-sm">Vacuna</Label>
              <Controller
                name="vaccine_name"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                      handleVaccineSelection(value)
                    }}
                  >
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Selecciona una vacuna" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {vaccineCatalog.map((item) => (
                        <SelectItem key={item.name} value={item.name}>
                          <div className="flex flex-col">
                            <span className="text-sm">{item.name}</span>
                            <span className="text-xs text-muted-foreground">{item.disease_protected}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.vaccine_name && (
                <p className="text-xs text-destructive">{errors.vaccine_name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="disease_protected" className="text-sm">Protección</Label>
              <Input
                id="disease_protected"
                readOnly
                placeholder="Se completará automáticamente"
                {...register('disease_protected')}
                className="h-10 text-sm"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="administration_date" className="text-sm">Fecha</Label>
                <Input id="administration_date" type="date" max={new Date().toISOString().slice(0, 10)} {...register('administration_date')} className="h-10 text-sm" />
                {errors.administration_date && (
                  <p className="text-xs text-destructive">{errors.administration_date.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dose_details" className="text-sm">Dosis</Label>
                <Input id="dose_details" placeholder="Ej: 1ª dosis" {...register('dose_details')} className="h-10 text-sm" />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="lot_number" className="text-sm">Lote</Label>
                <Input id="lot_number" placeholder="Ej: A123BC" {...register('lot_number')} className="h-10 text-sm" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="application_site" className="text-sm">Lugar de aplicación</Label>
                <Input id="application_site" placeholder="Ej: Brazo izquierdo" {...register('application_site')} className="h-10 text-sm" />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => handleDialogChange(false)} className="h-10 text-sm">
                Cancelar
              </Button>
              <Button type="submit" className="gap-2 h-10 text-sm" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-[90vw] max-w-sm rounded-lg sm:rounded-2xl">
          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="text-base sm:text-lg">¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Se eliminará el registro de {selectedToDelete?.vaccine_name ?? 'la vacuna'}. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isDeleting} className="h-9 sm:h-10 text-sm">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 sm:h-10 text-sm"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="fixed bottom-24 right-4 sm:bottom-28 sm:right-6 md:hidden z-50">
        <Button
          className="rounded-full w-16 h-16 bg-emerald-600 text-white shadow-lg hover:bg-emerald-700"
          onClick={() => handleDialogChange(true)}
          title="Registrar vacuna"
        >
          <PlusCircle className="h-8 w-8" />
        </Button>
      </div>
    </div>
  )
}