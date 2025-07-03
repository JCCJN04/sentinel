// components/alergias/alergias-manager.tsx
"use client"

import { useEffect, useState, type FC } from 'react';
import { createClient } from '@/lib/supabase/client';
import { type User } from '@supabase/supabase-js';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Tipos para las alergias del usuario
type UserAllergy = {
  id: string;
  allergy_name: string;
  reaction_description: string | null;
  notes: string | null;
  created_at: string;
};

// Esquema de validación para el formulario de nueva alergia
const allergySchema = z.object({
  allergy_name: z.string().min(2, { message: "El nombre del alérgeno es requerido (mín. 2 caracteres)." }),
  reaction_description: z.string().optional(),
  notes: z.string().optional(),
});

type AllergyFormValues = z.infer<typeof allergySchema>;

export const AlergiasManager: FC = () => {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [userAllergies, setUserAllergies] = useState<UserAllergy[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<AllergyFormValues>({
    resolver: zodResolver(allergySchema),
    defaultValues: {
      allergy_name: '',
      reaction_description: '',
      notes: '',
    },
  });

  // Función para obtener las alergias del usuario
  const fetchUserAllergies = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_allergies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error al cargar tus alergias.');
      console.error(error);
    } else {
      setUserAllergies(data);
    }
  };
  
  // Hook inicial para obtener usuario y sus alergias
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchUserAllergies(user.id);
      }
      setLoading(false);
    };

    initialize();
  }, [supabase]);

  // Función para manejar la creación de una nueva alergia
  const handleAddAllergy = async (values: AllergyFormValues) => {
    if (!user) return;

    const { error } = await supabase.from('user_allergies').insert({
      user_id: user.id,
      allergy_name: values.allergy_name,
      reaction_description: values.reaction_description,
      notes: values.notes,
    });

    if (error) {
      toast.error('No se pudo añadir la alergia. Inténtalo de nuevo.');
      console.error(error);
    } else {
      toast.success('¡Alergia añadida correctamente!');
      reset();
      await fetchUserAllergies(user.id); // Recargar la lista
    }
  };

  // Función para manejar la eliminación de una alergia
  const handleDeleteAllergy = async (allergyId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_allergies')
      .delete()
      .match({ id: allergyId, user_id: user.id });

    if (error) {
      toast.error('Error al eliminar la alergia.');
      console.error(error);
    } else {
      toast.success('Alergia eliminada.');
      await fetchUserAllergies(user.id); // Recargar la lista
    }
  };

  if (loading) {
    return <p>Cargando información de alergias...</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      {/* Columna para añadir alergia */}
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Añadir Nueva Alergia</CardTitle>
            <CardDescription>Registra una alergia que conozcas.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(handleAddAllergy)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="allergy_name">Nombre del Alérgeno</Label>
                <Controller
                  name="allergy_name"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <Input id="allergy_name" placeholder="Ej: Penicilina, Cacahuates" {...field} />
                      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                    </>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reaction_description">Reacción (Opcional)</Label>
                <Controller
                  name="reaction_description"
                  control={control}
                  render={({ field }) => <Textarea id="reaction_description" placeholder="Ej: Urticaria, dificultad para respirar" {...field} />}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas (Opcional)</Label>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => <Textarea id="notes" placeholder="Ej: Evitar medicamentos que contengan..." {...field} />}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Añadir Alergia'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Columna para mostrar alergias */}
      <div className="md:col-span-2">
        <h2 className="text-2xl font-semibold mb-4">Mis Alergias Registradas</h2>
        {userAllergies.length > 0 ? (
          <div className="space-y-4">
            {userAllergies.map((allergy) => (
              <Card key={allergy.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{allergy.allergy_name}</CardTitle>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la alergia a <strong>{allergy.allergy_name}</strong> de tu perfil.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteAllergy(allergy.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Sí, eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  {allergy.reaction_description && <p><strong>Reacción:</strong> {allergy.reaction_description}</p>}
                  {allergy.notes && <p className="mt-2"><strong>Notas:</strong> {allergy.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No tienes ninguna alergia registrada.</p>
        )}
      </div>
    </div>
  );
};