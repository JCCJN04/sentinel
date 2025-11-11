'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { PlusCircle, Trash2, Heart, Users, Loader2 } from 'lucide-react'
import { addPersonalHistory, addFamilyHistory, deleteHistoryRecord, type PersonalHistory, type FamilyHistory } from '@/lib/actions/history.actions'

const familyRelationships = [
  'Madre', 'Padre', 'Hermano', 'Hermana', 'Abuelo materno', 'Abuela materna',
  'Abuelo paterno', 'Abuela paterna', 'Tío materno', 'Tía materna', 'Tío paterno',
  'Tía paterna', 'Primo', 'Prima', 'Hijo', 'Hija', 'Nieto', 'Nieta', 'Otro'
];

const personalHistorySchema = z.object({
  condition_name: z.string().min(2, 'El nombre es requerido.'),
  diagnosis_date: z.string().optional(),
  notes: z.string().optional(),
})

const familyHistorySchema = z.object({
  condition_name: z.string().min(2, 'El nombre es requerido.'),
  family_member: z.string().min(2, 'El parentesco es requerido.'),
  notes: z.string().optional(),
})

type PersonalForm = z.infer<typeof personalHistorySchema>
type FamilyForm = z.infer<typeof familyHistorySchema>

interface MedicalHistoryClientProps {
  initialPersonalHistory: PersonalHistory[];
  initialFamilyHistory: FamilyHistory[];
  conditionsCatalog: string[];
}

export function MedicalHistoryClient({ initialPersonalHistory, initialFamilyHistory, conditionsCatalog }: MedicalHistoryClientProps) {
  const [loading, setLoading] = useState<'personal' | 'family' | null>(null)
  const [activeTab, setActiveTab] = useState('personal')
  
  const personalForm = useForm<PersonalForm>({ resolver: zodResolver(personalHistorySchema) })
  const familyForm = useForm<FamilyForm>({ resolver: zodResolver(familyHistorySchema) })

  const onPersonalSubmit = async (data: PersonalForm) => {
    setLoading('personal')
    
    const payload = {
      ...data,
      diagnosis_date: data.diagnosis_date || null,
      notes: data.notes || null,
    };

    const result = await addPersonalHistory(payload)
    if (result.success) {
      toast.success('Antecedente personal añadido.')
      personalForm.reset({ condition_name: '', diagnosis_date: '', notes: '' })
    } else {
      toast.error(result.error)
    }
    setLoading(null)
  }

  const onFamilySubmit = async (data: FamilyForm) => {
    setLoading('family')

    const payload = {
        ...data,
        notes: data.notes || null,
    };

    const result = await addFamilyHistory(payload)
    if (result.success) {
      toast.success('Antecedente familiar añadido.')
      familyForm.reset({ condition_name: '', family_member: '', notes: '' })
    } else {
      toast.error(result.error)
    }
    setLoading(null)
  }

  const handleDelete = async (id: string, type: 'personal' | 'family') => {
    const result = await deleteHistoryRecord(id, type)
    if (result.success) {
      toast.success('Registro eliminado.')
    } else {
      toast.error(result.error)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Fecha no registrada'
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      })
    } catch {
      return 'Fecha no registrada'
    }
  }

  return (
    <div className="space-y-3 sm:space-y-6 pb-20">
      {/* Vista Desktop: Grid de 2 columnas */}
      <div className="hidden lg:grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        {/* Antecedentes Personales */}
        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
              <Heart className="h-5 w-5 text-red-500 flex-shrink-0" />
              Antecedentes Personales
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Enfermedades o condiciones diagnosticadas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={personalForm.handleSubmit(onPersonalSubmit)} className="space-y-3 pb-4 border-b">
              <div className="space-y-2">
                <Label htmlFor="personal-condition" className="text-xs sm:text-sm">Enfermedad o condición</Label>
                <Controller name="condition_name" control={personalForm.control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <SelectTrigger id="personal-condition" className="h-9 sm:h-10 text-sm">
                        <SelectValue placeholder="Selecciona una condición..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] overflow-y-auto">
                        {conditionsCatalog.map(name => (
                          <SelectItem key={name} value={name} className="text-sm">{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                )}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="personal-date" className="text-xs sm:text-sm">Fecha de diagnóstico</Label>
                <Controller name="diagnosis_date" control={personalForm.control} render={({ field }) => (
                    <Input 
                      id="personal-date"
                      type="date" 
                      className="h-9 sm:h-10 text-sm"
                      {...field} 
                    />
                )}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="personal-notes" className="text-xs sm:text-sm">Notas</Label>
                <Controller name="notes" control={personalForm.control} render={({ field }) => (
                    <Textarea 
                      id="personal-notes"
                      placeholder="Tratamiento, estado actual, etc." 
                      className="text-sm resize-none"
                      rows={2}
                      {...field} 
                    />
                )}/>
              </div>
              <Button type="submit" disabled={!!loading} className="w-full h-9 sm:h-10 text-xs sm:text-sm">
                  {loading === 'personal' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />}
                  Añadir
              </Button>
            </form>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {initialPersonalHistory.length === 0 ? (
                <Alert className="border-dashed">
                  <AlertDescription className="text-xs sm:text-sm">No hay antecedentes personales registrados.</AlertDescription>
                </Alert>
              ) : (
                initialPersonalHistory.map(item => (
                  <div key={item.id} className="flex justify-between items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition">
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{item.condition_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Diagnosticado: {formatDate(item.diagnosis_date)}
                        </p>
                        {item.notes && <p className="text-xs italic text-muted-foreground mt-1 line-clamp-2">Nota: {item.notes}</p>}
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0" onClick={() => handleDelete(item.id, 'personal')}>
                      <Trash2 className="h-4 w-4 text-destructive"/>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Antecedentes Familiares */}
        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
              <Users className="h-5 w-5 text-blue-500 flex-shrink-0" />
              Antecedentes Familiares
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Enfermedades en familiares directos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={familyForm.handleSubmit(onFamilySubmit)} className="space-y-3 pb-4 border-b">
              <div className="space-y-2">
                <Label htmlFor="family-condition" className="text-xs sm:text-sm">Enfermedad</Label>
                <Controller name="condition_name" control={familyForm.control} render={({ field }) => (
                     <Select onValueChange={field.onChange} value={field.value || ''}>
                        <SelectTrigger id="family-condition" className="h-9 sm:h-10 text-sm">
                          <SelectValue placeholder="Selecciona una enfermedad..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] overflow-y-auto">
                            {conditionsCatalog.map(name => <SelectItem key={name} value={name} className="text-sm">{name}</SelectItem>)}
                        </SelectContent>
                     </Select>
                )}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="family-member" className="text-xs sm:text-sm">Parentesco</Label>
                <Controller name="family_member" control={familyForm.control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                        <SelectTrigger id="family-member" className="h-9 sm:h-10 text-sm">
                            <SelectValue placeholder="Selecciona parentesco..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] overflow-y-auto">
                            {familyRelationships.map(relationship => (
                                <SelectItem key={relationship} value={relationship} className="text-sm">{relationship}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="family-notes" className="text-xs sm:text-sm">Notas</Label>
                <Controller name="notes" control={familyForm.control} render={({ field }) => (
                    <Textarea 
                      id="family-notes"
                      placeholder="Detalles adicionales..." 
                      className="text-sm resize-none"
                      rows={2}
                      {...field} 
                    />
                )}/>
              </div>
              <Button type="submit" disabled={!!loading} className="w-full h-9 sm:h-10 text-xs sm:text-sm">
                  {loading === 'family' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />}
                  Añadir
              </Button>
            </form>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {initialFamilyHistory.length === 0 ? (
                <Alert className="border-dashed">
                  <AlertDescription className="text-xs sm:text-sm">No hay antecedentes familiares registrados.</AlertDescription>
                </Alert>
              ) : (
                initialFamilyHistory.map(item => (
                  <div key={item.id} className="flex justify-between items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition">
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{item.condition_name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs px-2 py-0.5">{item.family_member}</Badge>
                        </div>
                        {item.notes && <p className="text-xs italic text-muted-foreground mt-1 line-clamp-2">Nota: {item.notes}</p>}
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0" onClick={() => handleDelete(item.id, 'family')}>
                      <Trash2 className="h-4 w-4 text-destructive"/>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vista Mobile: Tabs */}
      <div className="lg:hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
            <TabsTrigger 
              value="personal" 
              className="data-[state=active]:bg-white data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-950 dark:data-[state=active]:text-slate-100 text-xs sm:text-sm py-2"
            >
              <Heart className="h-4 w-4 mr-2" />
              Personales
            </TabsTrigger>
            <TabsTrigger 
              value="family"
              className="data-[state=active]:bg-white data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-950 dark:data-[state=active]:text-slate-100 text-xs sm:text-sm py-2"
            >
              <Users className="h-4 w-4 mr-2" />
              Familiares
            </TabsTrigger>
          </TabsList>

          {/* Tab: Antecedentes Personales */}
          <TabsContent value="personal" className="space-y-4">
            <Card className="border-slate-200 shadow-sm dark:border-slate-800">
              <CardHeader className="space-y-2 pb-3">
                <CardTitle className="text-base sm:text-lg">Mis Antecedentes</CardTitle>
                <CardDescription className="text-xs">Enfermedades diagnosticadas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={personalForm.handleSubmit(onPersonalSubmit)} className="space-y-3 pb-4 border-b">
                  <div className="space-y-2">
                    <Label htmlFor="mobile-personal-condition" className="text-xs">Enfermedad</Label>
                    <Controller name="condition_name" control={personalForm.control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <SelectTrigger id="mobile-personal-condition" className="h-10 text-sm">
                            <SelectValue placeholder="Selecciona..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] overflow-y-auto">
                            {conditionsCatalog.map(name => (
                              <SelectItem key={name} value={name} className="text-sm">{name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    )}/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile-personal-date" className="text-xs">Fecha</Label>
                    <Controller name="diagnosis_date" control={personalForm.control} render={({ field }) => (
                        <Input 
                          id="mobile-personal-date"
                          type="date" 
                          className="h-10 text-sm"
                          {...field} 
                        />
                    )}/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile-personal-notes" className="text-xs">Notas</Label>
                    <Controller name="notes" control={personalForm.control} render={({ field }) => (
                        <Textarea 
                          id="mobile-personal-notes"
                          placeholder="Detalles..." 
                          className="text-sm resize-none"
                          rows={2}
                          {...field} 
                        />
                    )}/>
                  </div>
                  <Button type="submit" disabled={!!loading} className="w-full h-10 text-sm">
                      {loading === 'personal' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />}
                      Añadir
                  </Button>
                </form>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {initialPersonalHistory.length === 0 ? (
                    <Alert className="border-dashed">
                      <AlertDescription className="text-xs">Sin registros aún.</AlertDescription>
                    </Alert>
                  ) : (
                    initialPersonalHistory.map(item => (
                      <div key={item.id} className="flex justify-between items-start gap-2 p-3 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{item.condition_name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(item.diagnosis_date)}
                            </p>
                            {item.notes && <p className="text-xs italic text-muted-foreground mt-1 line-clamp-2">{item.notes}</p>}
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0" onClick={() => handleDelete(item.id, 'personal')}>
                          <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Antecedentes Familiares */}
          <TabsContent value="family" className="space-y-4">
            <Card className="border-slate-200 shadow-sm dark:border-slate-800">
              <CardHeader className="space-y-2 pb-3">
                <CardTitle className="text-base sm:text-lg">Antecedentes Familiares</CardTitle>
                <CardDescription className="text-xs">Historial de familiares.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={familyForm.handleSubmit(onFamilySubmit)} className="space-y-3 pb-4 border-b">
                  <div className="space-y-2">
                    <Label htmlFor="mobile-family-condition" className="text-xs">Enfermedad</Label>
                    <Controller name="condition_name" control={familyForm.control} render={({ field }) => (
                         <Select onValueChange={field.onChange} value={field.value || ''}>
                            <SelectTrigger id="mobile-family-condition" className="h-10 text-sm">
                              <SelectValue placeholder="Selecciona..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px] overflow-y-auto">
                                {conditionsCatalog.map(name => <SelectItem key={name} value={name} className="text-sm">{name}</SelectItem>)}
                            </SelectContent>
                         </Select>
                    )}/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile-family-member" className="text-xs">Parentesco</Label>
                    <Controller name="family_member" control={familyForm.control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                            <SelectTrigger id="mobile-family-member" className="h-10 text-sm">
                                <SelectValue placeholder="Selecciona..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px] overflow-y-auto">
                                {familyRelationships.map(relationship => (
                                    <SelectItem key={relationship} value={relationship} className="text-sm">{relationship}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile-family-notes" className="text-xs">Notas</Label>
                    <Controller name="notes" control={familyForm.control} render={({ field }) => (
                        <Textarea 
                          id="mobile-family-notes"
                          placeholder="Detalles..." 
                          className="text-sm resize-none"
                          rows={2}
                          {...field} 
                        />
                    )}/>
                  </div>
                  <Button type="submit" disabled={!!loading} className="w-full h-10 text-sm">
                      {loading === 'family' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />}
                      Añadir
                  </Button>
                </form>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {initialFamilyHistory.length === 0 ? (
                    <Alert className="border-dashed">
                      <AlertDescription className="text-xs">Sin registros aún.</AlertDescription>
                    </Alert>
                  ) : (
                    initialFamilyHistory.map(item => (
                      <div key={item.id} className="flex justify-between items-start gap-2 p-3 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{item.condition_name}</p>
                            <Badge variant="outline" className="text-xs px-2 py-0.5 mt-1">{item.family_member}</Badge>
                            {item.notes && <p className="text-xs italic text-muted-foreground mt-1 line-clamp-2">{item.notes}</p>}
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0" onClick={() => handleDelete(item.id, 'family')}>
                          <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}