'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlusCircle, Syringe, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { addVaccine, deleteVaccine, type VaccineRecord, type VaccineCatalogItem, type VaccineForm } from '@/lib/actions/vaccines.actions'

interface VaccineClientPageProps {
  initialVaccines: VaccineRecord[];
  vaccineCatalog: VaccineCatalogItem[];
}

const vaccineSchema = z.object({
  vaccine_name: z.string().min(1, 'Debes seleccionar una vacuna.'),
  disease_protected: z.string(),
  administration_date: z.string().min(1, 'La fecha es requerida.'),
  dose_details: z.string().optional(),
  lot_number: z.string().optional(),
  application_site: z.string().optional(),
});

export function VaccineClientPage({ initialVaccines, vaccineCatalog }: VaccineClientPageProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { register, handleSubmit, control, setValue, reset, formState: { errors, isSubmitting } } = useForm<VaccineForm>({
    resolver: zodResolver(vaccineSchema)
  });

  const handleVaccineSelection = (vaccineName: string) => {
    const selectedVaccine = vaccineCatalog.find(v => v.name === vaccineName);
    if (selectedVaccine) {
      setValue('vaccine_name', selectedVaccine.name);
      setValue('disease_protected', selectedVaccine.disease_protected);
    }
  };

  const onSubmit = async (data: VaccineForm) => {
    const result = await addVaccine(data)
    if (result.success) {
      toast.success('Vacuna añadida correctamente.')
      reset()
      setIsDialogOpen(false)
    } else {
      toast.error(result.error)
    }
  };

  const handleDelete = async (vaccineId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) return;
    const result = await deleteVaccine(vaccineId);
    if (result.success) {
      toast.success('Registro de vacuna eliminado.');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="mr-2 h-4 w-4" />Añadir Vacuna</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Registro de Vacuna</DialogTitle>
              <DialogDescription>Completa los detalles de la vacuna administrada.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="vaccine_name">Vacuna</Label>
                <Controller name="vaccine_name" control={control} render={({ field }) => (
                  <Select onValueChange={value => { field.onChange(value); handleVaccineSelection(value); }} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Selecciona una vacuna..." /></SelectTrigger>
                    <SelectContent>
                      {vaccineCatalog.map(v => <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}/>
                {errors.vaccine_name && <p className="text-xs text-destructive">{errors.vaccine_name.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="administration_date">Fecha de Aplicación</Label>
                <Input id="administration_date" type="date" {...register('administration_date')} />
                {errors.administration_date && <p className="text-xs text-destructive">{errors.administration_date.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dose_details">Dosis</Label>
                <Input id="dose_details" placeholder="Ej: 1ra Dosis, Refuerzo Anual" {...register('dose_details')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="lot_number">Lote</Label>
                  <Input id="lot_number" placeholder="Ej: A123BC" {...register('lot_number')} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="application_site">Lugar de Aplicación</Label>
                  <Input id="application_site" placeholder="Ej: Brazo izquierdo" {...register('application_site')} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                  Guardar Registro
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* MODIFICACIÓN: Se añade un div contenedor para el scroll horizontal solo en la tabla si fuera necesario */}
      <div className="w-full overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vacuna</TableHead>
              {/* MODIFICACIÓN: Columna oculta en móviles (hidden) y visible a partir de sm (sm:table-cell) */}
              <TableHead className="hidden sm:table-cell">Protege Contra</TableHead>
              <TableHead>Dosis</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialVaccines.length > 0 ? initialVaccines.map(v => (
              <TableRow key={v.id}>
                {/* MODIFICACIÓN: Se trunca el texto si es muy largo */}
                <TableCell className="font-medium max-w-[150px] truncate" title={v.vaccine_name}>{v.vaccine_name}</TableCell>
                {/* MODIFICACIÓN: Celda oculta en móviles */}
                <TableCell className="hidden sm:table-cell max-w-[200px] truncate" title={v.disease_protected}>{v.disease_protected}</TableCell>
                <TableCell className="max-w-[120px] truncate" title={v.dose_details || 'N/A'}>{v.dose_details || 'N/A'}</TableCell>
                <TableCell>{new Date(v.administration_date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">No hay registros de vacunas.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}