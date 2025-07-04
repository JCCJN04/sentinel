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
  
  const personalForm = useForm<PersonalForm>({ resolver: zodResolver(personalHistorySchema) })
  const familyForm = useForm<FamilyForm>({ resolver: zodResolver(familyHistorySchema) })

  const onPersonalSubmit = async (data: PersonalForm) => {
    setLoading('personal')
    
    // --- INICIO DE LA CORRECCIÓN ---
    // Se convierten los valores 'undefined' a 'null' para que coincidan con el tipo esperado.
    const payload = {
      ...data,
      diagnosis_date: data.diagnosis_date || null,
      notes: data.notes || null,
    };
    // --- FIN DE LA CORRECCIÓN ---

    const result = await addPersonalHistory(payload) // Se envía el payload corregido
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

    // --- INICIO DE LA CORRECCIÓN ---
    // Se convierten los valores 'undefined' a 'null'
    const payload = {
        ...data,
        notes: data.notes || null,
    };
    // --- FIN DE LA CORRECCIÓN ---

    const result = await addFamilyHistory(payload) // Se envía el payload corregido
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

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Columna de Antecedentes Personales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Heart className="mr-2 h-5 w-5 text-red-500" />Antecedentes Personales</CardTitle>
          <CardDescription>Enfermedades o condiciones que te han diagnosticado.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={personalForm.handleSubmit(onPersonalSubmit)} className="space-y-4 pb-6 border-b">
            <Controller name="condition_name" control={personalForm.control} render={({ field }) => (
                <Input placeholder="Nombre de la enfermedad (ej: Asma)" {...field} />
            )}/>
            <Controller name="diagnosis_date" control={personalForm.control} render={({ field }) => (
                <Input type="date" {...field} />
            )}/>
            <Controller name="notes" control={personalForm.control} render={({ field }) => (
                <Textarea placeholder="Notas adicionales (tratamiento, estado, etc.)" {...field} />
            )}/>
            <Button type="submit" disabled={!!loading}>
                {loading === 'personal' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />}
                Añadir Antecedente
            </Button>
          </form>
          <div className="mt-6 space-y-2">
            {initialPersonalHistory.map(item => (
              <div key={item.id} className="flex justify-between items-start p-2 rounded-md hover:bg-muted">
                <div>
                    <p className="font-semibold">{item.condition_name}</p>
                    <p className="text-sm text-muted-foreground">
                        {item.diagnosis_date ? `Diagnosticado: ${new Date(item.diagnosis_date).toLocaleDateString('es-MX')}` : 'Fecha no registrada'}
                    </p>
                    {item.notes && <p className="text-xs italic text-muted-foreground mt-1">Nota: {item.notes}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id, 'personal')}><Trash2 className="h-4 w-4 text-destructive"/></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Columna de Antecedentes Familiares */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-blue-500" />Antecedentes Familiares</CardTitle>
          <CardDescription>Enfermedades importantes en tus familiares directos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={familyForm.handleSubmit(onFamilySubmit)} className="space-y-4 pb-6 border-b">
            <Controller name="condition_name" control={familyForm.control} render={({ field }) => (
                 <Select onValueChange={field.onChange} value={field.value || ''}>
                    <SelectTrigger><SelectValue placeholder="Selecciona una enfermedad..." /></SelectTrigger>
                    <SelectContent>
                        {conditionsCatalog.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                    </SelectContent>
                 </Select>
            )}/>
            <Controller name="family_member" control={familyForm.control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                    <SelectTrigger>
                        <SelectValue placeholder="Parentesco..." />
                    </SelectTrigger>
                    <SelectContent>
                        {familyRelationships.map(relationship => (
                            <SelectItem key={relationship} value={relationship}>{relationship}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}/>
            <Controller name="notes" control={familyForm.control} render={({ field }) => (
                <Textarea placeholder="Notas adicionales" {...field} />
            )}/>
            <Button type="submit" disabled={!!loading}>
                {loading === 'family' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />}
                Añadir Antecedente
            </Button>
          </form>
           <div className="mt-6 space-y-2">
            {initialFamilyHistory.map(item => (
              <div key={item.id} className="flex justify-between items-start p-2 rounded-md hover:bg-muted">
                <div>
                    <p className="font-semibold">{item.condition_name}</p>
                    <p className="text-sm text-muted-foreground">Familiar: {item.family_member}</p>
                    {item.notes && <p className="text-xs italic text-muted-foreground mt-1">Nota: {item.notes}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id, 'family')}><Trash2 className="h-4 w-4 text-destructive"/></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}