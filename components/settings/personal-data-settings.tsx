// components/settings/personal-data-settings.tsx
"use client"

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type User } from '@supabase/supabase-js'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// --- ESQUEMA ACTUALIZADO ---
// Se aplana la estructura de la dirección para que sea más fácil de manejar con react-hook-form
const personalDataSchema = z.object({
  curp: z.string().optional(),
  genero: z.string().optional(),
  tipo_de_sangre: z.string().optional(),
  estado_civil: z.string().optional(),
  ocupacion: z.string().optional(),
  fotografia_url: z.string().url().optional().or(z.literal('')),
  
  // Campos de dirección detallados
  calle_avenida: z.string().optional(),
  numero_exterior: z.string().optional(),
  numero_interior: z.string().optional(),
  colonia: z.string().optional(),
  codigo_postal: z.string().optional(),
  municipio_alcaldia: z.string().optional(),
  ciudad: z.string().optional(),
  estado: z.string().optional(),
  pais: z.string().optional(),

  // Contacto de emergencia
  contacto_emergencia_nombre: z.string().optional(),
  contacto_emergencia_telefono: z.string().optional(),
})

type PersonalDataFormValues = z.infer<typeof personalDataSchema>

export function PersonalDataSettings() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<PersonalDataFormValues>({
    resolver: zodResolver(personalDataSchema),
    defaultValues: {
      curp: '',
      genero: '',
      tipo_de_sangre: '',
      estado_civil: '',
      ocupacion: '',
      fotografia_url: '',
      calle_avenida: '',
      numero_exterior: '',
      numero_interior: '',
      colonia: '',
      codigo_postal: '',
      municipio_alcaldia: '',
      ciudad: '',
      estado: '',
      pais: 'México', // Valor por defecto
      contacto_emergencia_nombre: '',
      contacto_emergencia_telefono: '',
    },
  })

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        try {
          const { data, error, status } = await supabase
            .from('profiles')
            .select(`curp, genero, tipo_de_sangre, estado_civil, ocupacion, fotografia_url, direccion, contacto_emergencia`)
            .eq('id', user.id)
            .single()

          if (error && status !== 406) throw error

          if (data) {
            // Desestructuramos la dirección y el contacto para rellenar el formulario
            const { direccion, contacto_emergencia, ...profileData } = data
            reset({
              ...profileData,
              calle_avenida: direccion?.calle_avenida || '',
              numero_exterior: direccion?.numero_exterior || '',
              numero_interior: direccion?.numero_interior || '',
              colonia: direccion?.colonia || '',
              codigo_postal: direccion?.codigo_postal || '',
              municipio_alcaldia: direccion?.municipio_alcaldia || '',
              ciudad: direccion?.ciudad || '',
              estado: direccion?.estado || '',
              pais: direccion?.pais || 'México',
              contacto_emergencia_nombre: contacto_emergencia?.nombre || '',
              contacto_emergencia_telefono: contacto_emergencia?.telefono || '',
            })
          }
        } catch (error) {
          toast.error('Error al cargar tus datos personales.')
          console.error(error)
        }
      }
      setLoading(false)
    }

    fetchUserAndProfile()
  }, [supabase, reset])

  async function updateProfile(values: PersonalDataFormValues) {
    if (!user) return

    try {
      // Agrupamos los campos de dirección en un solo objeto JSON
      const direccion = {
        calle_avenida: values.calle_avenida,
        numero_exterior: values.numero_exterior,
        numero_interior: values.numero_interior,
        colonia: values.colonia,
        codigo_postal: values.codigo_postal,
        municipio_alcaldia: values.municipio_alcaldia,
        ciudad: values.ciudad,
        estado: values.estado,
        pais: values.pais,
      }

      const contacto_emergencia = {
        nombre: values.contacto_emergencia_nombre,
        telefono: values.contacto_emergencia_telefono,
      }
      
      const updates = {
        id: user.id,
        updated_at: new Date().toISOString(),
        curp: values.curp,
        genero: values.genero,
        tipo_de_sangre: values.tipo_de_sangre,
        estado_civil: values.estado_civil,
        ocupacion: values.ocupacion,
        fotografia_url: values.fotografia_url,
        direccion, // El objeto de dirección agrupado
        contacto_emergencia,
      }

      const { error } = await supabase.from('profiles').upsert(updates)
      if (error) throw error

      toast.success('Datos personales actualizados correctamente.')
      reset(values)
    } catch (error) {
      toast.error('Hubo un error al actualizar tus datos.')
      console.error(error)
    }
  }

  if (loading) {
    return <p>Cargando información...</p>
  }

  return (
    <form onSubmit={handleSubmit(updateProfile)}>
      <Card>
        <CardHeader>
          <CardTitle>Datos Personales</CardTitle>
          <CardDescription>
            Completa y gestiona tu información personal. Estos datos son privados y confidenciales.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {/* ... (otros campos como CURP, Género, etc. se mantienen igual) ... */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="curp">CURP</Label><Controller name="curp" control={control} render={({ field }) => <Input id="curp" {...field} />} /></div>
            <div className="space-y-2"><Label htmlFor="genero">Género</Label><Controller name="genero" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value || ''}><SelectTrigger><SelectValue placeholder="Selecciona tu género" /></SelectTrigger><SelectContent><SelectItem value="masculino">Masculino</SelectItem><SelectItem value="femenino">Femenino</SelectItem><SelectItem value="otro">Otro</SelectItem><SelectItem value="no_especificar">Prefiero no especificar</SelectItem></SelectContent></Select>)} /></div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="tipo_de_sangre">Tipo de Sangre</Label><Controller name="tipo_de_sangre" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value || ''}><SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger><SelectContent><SelectItem value="A+">A+</SelectItem><SelectItem value="A-">A-</SelectItem><SelectItem value="B+">B+</SelectItem><SelectItem value="B-">B-</SelectItem><SelectItem value="AB+">AB+</SelectItem><SelectItem value="AB-">AB-</SelectItem><SelectItem value="O+">O+</SelectItem><SelectItem value="O-">O-</SelectItem></SelectContent></Select>)} /></div>
            <div className="space-y-2"><Label htmlFor="estado_civil">Estado Civil</Label><Controller name="estado_civil" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value || ''}><SelectTrigger><SelectValue placeholder="Selecciona estado" /></SelectTrigger><SelectContent><SelectItem value="soltero">Soltero/a</SelectItem><SelectItem value="casado">Casado/a</SelectItem><SelectItem value="divorciado">Divorciado/a</SelectItem><SelectItem value="viudo">Viudo/a</SelectItem><SelectItem value="union_libre">Unión Libre</SelectItem></SelectContent></Select>)} /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="ocupacion">Ocupación</Label><Controller name="ocupacion" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value || ''}><SelectTrigger><SelectValue placeholder="Selecciona ocupación" /></SelectTrigger><SelectContent><SelectItem value="estudiante">Estudiante</SelectItem><SelectItem value="profesionista">Profesionista / Empleado</SelectItem><SelectItem value="independiente">Trabajador Independiente / Freelance</SelectItem><SelectItem value="empresario">Empresario / Dueño de Negocio</SelectItem><SelectItem value="hogar">Labores del Hogar</SelectItem><SelectItem value="jubilado">Jubilado / Pensionado</SelectItem><SelectItem value="desempleado">Desempleado</SelectItem><SelectItem value="otro">Otro</SelectItem></SelectContent></Select>)} /></div>

          {/* --- NUEVO FORMULARIO DE DIRECCIÓN --- */}
          <fieldset className="rounded-md border p-4">
            <legend className="px-1 text-sm font-medium">Dirección</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
              <div className="space-y-2 sm:col-span-4">
                <Label htmlFor="calle_avenida">Calle o Avenida</Label>
                <Controller name="calle_avenida" control={control} render={({ field }) => <Input id="calle_avenida" {...field} placeholder="Ej: Av. Revolución" />} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="numero_exterior">Número Exterior</Label>
                <Controller name="numero_exterior" control={control} render={({ field }) => <Input id="numero_exterior" {...field} placeholder="Ej: #123" />} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="numero_interior">Número Interior (opcional)</Label>
                <Controller name="numero_interior" control={control} render={({ field }) => <Input id="numero_interior" {...field} placeholder="Ej: Depto 4B" />} />
              </div>
              <div className="space-y-2 sm:col-span-4">
                <Label htmlFor="colonia">Colonia o Fraccionamiento</Label>
                <Controller name="colonia" control={control} render={({ field }) => <Input id="colonia" {...field} placeholder="Ej: Colonia Roma" />} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="codigo_postal">Código Postal</Label>
                <Controller name="codigo_postal" control={control} render={({ field }) => <Input id="codigo_postal" {...field} placeholder="Ej: 06700" />} />
              </div>
              <div className="space-y-2 sm:col-span-4">
                <Label htmlFor="municipio_alcaldia">Municipio o Alcaldía</Label>
                <Controller name="municipio_alcaldia" control={control} render={({ field }) => <Input id="municipio_alcaldia" {...field} placeholder="Ej: Alcaldía Cuauhtémoc" />} />
              </div>
              <div className="space-y-2 sm:col-span-3">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Controller name="ciudad" control={control} render={({ field }) => <Input id="ciudad" {...field} placeholder="Ej: Ciudad de México" />} />
              </div>
              <div className="space-y-2 sm:col-span-3">
                <Label htmlFor="estado">Estado</Label>
                <Controller name="estado" control={control} render={({ field }) => <Input id="estado" {...field} placeholder="Ej: Jalisco" />} />
              </div>
               <div className="space-y-2 sm:col-span-3">
                <Label htmlFor="pais">País</Label>
                <Controller name="pais" control={control} render={({ field }) => <Input id="pais" {...field} />} />
              </div>
            </div>
          </fieldset>

          <fieldset className="rounded-md border p-4">
            <legend className="px-1 text-sm font-medium">Contacto de Emergencia</legend>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="contacto_emergencia_nombre">Nombre completo</Label><Controller name="contacto_emergencia_nombre" control={control} render={({ field }) => <Input id="contacto_emergencia_nombre" {...field} />} /></div>
              <div className="space-y-2"><Label htmlFor="contacto_emergencia_telefono">Teléfono</Label><Controller name="contacto_emergencia_telefono" control={control} render={({ field }) => <Input id="contacto_emergencia_telefono" {...field} />} /></div>
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="fotografia_url">URL de la Fotografía (opcional)</Label>
            <Controller name="fotografia_url" control={control} render={({ field }) => <Input id="fotografia_url" type="url" placeholder="https://ejemplo.com/foto.jpg" {...field} />} />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button type="submit" disabled={!isDirty || isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}