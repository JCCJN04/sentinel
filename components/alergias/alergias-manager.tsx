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
import { 
  Trash2, 
  Plus, 
  AlertTriangle, 
  Loader2, 
  Pill, 
  MapPin, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Edit,
  X,
  Shield
} from 'lucide-react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Tipos para las alergias del usuario
type UserAllergy = {
  id: string;
  allergy_name: string;
  reaction_description: string | null;
  notes: string | null;
  severity: 'leve' | 'moderada' | 'severa' | null;
  treatment: string | null;
  date_diagnosed: string | null;
  reaction_type: string | null;
  created_at: string;
};

// Esquema de validación para el formulario de nueva alergia
const allergySchema = z.object({
  allergy_name: z.string().min(2, { message: "El nombre del alérgeno es requerido (mín. 2 caracteres)." }),
  severity: z.string().optional(),
  reaction_description: z.string().optional(),
  reaction_type: z.string().optional(),
  treatment: z.string().optional(),
  notes: z.string().optional(),
  date_diagnosed: z.string().optional(),
});

type AllergyFormValues = z.infer<typeof allergySchema>;

const COMMON_ALLERGENS = [
  // MEDICAMENTOS
  { name: "Penicilina", icon: "💊", category: "Medicamentos" },
  { name: "Amoxicilina", icon: "💊", category: "Medicamentos" },
  { name: "Aspirina", icon: "💊", category: "Medicamentos" },
  { name: "Ibuprofeno", icon: "💊", category: "Medicamentos" },
  { name: "Paracetamol", icon: "💊", category: "Medicamentos" },
  { name: "Sulfonamidas", icon: "💊", category: "Medicamentos" },
  { name: "Cefalosporinas", icon: "💊", category: "Medicamentos" },
  { name: "Claritromicina", icon: "💊", category: "Medicamentos" },
  { name: "Ciprofloxacino", icon: "💊", category: "Medicamentos" },
  { name: "Dipirona", icon: "💊", category: "Medicamentos" },
  { name: "Ácido Acetilsalicílico", icon: "💊", category: "Medicamentos" },
  { name: "Naproxeno", icon: "💊", category: "Medicamentos" },
  
  // ALIMENTOS
  { name: "Cacahuates", icon: "🥜", category: "Alimentos" },
  { name: "Frutos secos", icon: "🌰", category: "Alimentos" },
  { name: "Mariscos", icon: "🦐", category: "Alimentos" },
  { name: "Camarones", icon: "🦐", category: "Alimentos" },
  { name: "Cangrejo", icon: "🦀", category: "Alimentos" },
  { name: "Leche de vaca", icon: "🥛", category: "Alimentos" },
  { name: "Huevos", icon: "🥚", category: "Alimentos" },
  { name: "Trigo", icon: "🌾", category: "Alimentos" },
  { name: "Soja", icon: "🫘", category: "Alimentos" },
  { name: "Pescado", icon: "🐟", category: "Alimentos" },
  { name: "Sesamo", icon: "�", category: "Alimentos" },
  { name: "Mostaza", icon: "🔴", category: "Alimentos" },
  { name: "Moluscos", icon: "🐚", category: "Alimentos" },
  { name: "Apio", icon: "🥬", category: "Alimentos" },
  { name: "Auyama/Calabaza", icon: "🎃", category: "Alimentos" },
  { name: "Kiwi", icon: "🥝", category: "Alimentos" },
  { name: "Plátano", icon: "🍌", category: "Alimentos" },
  { name: "Avellana", icon: "🌰", category: "Alimentos" },
  { name: "Chocolate", icon: "🍫", category: "Alimentos" },
  
  // AMBIENTALES
  { name: "Polen", icon: "�🌼", category: "Ambiental" },
  { name: "Ácaros del polvo", icon: "🦠", category: "Ambiental" },
  { name: "Moho", icon: "🍄", category: "Ambiental" },
  { name: "Polvo de casa", icon: "💨", category: "Ambiental" },
  { name: "Caspa de animales", icon: "🐱", category: "Ambiental" },
  { name: "Pasto", icon: "🌾", category: "Ambiental" },
  { name: "Humo", icon: "💨", category: "Ambiental" },
  
  // CONTACTO
  { name: "Látex", icon: "🧤", category: "Contacto" },
  { name: "Níquel", icon: "⌚", category: "Contacto" },
  { name: "Cobre", icon: "🪙", category: "Contacto" },
  { name: "Cromo", icon: "⌚", category: "Contacto" },
  { name: "Fragancia", icon: "💐", category: "Contacto" },
  { name: "Cosméticos", icon: "💄", category: "Contacto" },
  
  // INYECTABLES
  { name: "Anestésicos locales", icon: "💉", category: "Inyectables" },
  { name: "Vacunas", icon: "💉", category: "Inyectables" },
  { name: "Contraste radiológico", icon: "💉", category: "Inyectables" },
  { name: "Insulina", icon: "💉", category: "Inyectables" },
];

const getSeverityColor = (severity?: string | null) => {
  switch (severity) {
    case 'leve':
      return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
    case 'moderada':
      return 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700';
    case 'severa':
      return 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700';
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600';
  }
};

const getSeverityLabel = (severity?: string | null) => {
  switch (severity) {
    case 'leve':
      return 'Leve';
    case 'moderada':
      return 'Moderada';
    case 'severa':
      return 'Severa ⚠️';
    default:
      return 'Sin especificar';
  }
};

export const AlergiasManager: FC = () => {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [userAllergies, setUserAllergies] = useState<UserAllergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAllergy, setEditingAllergy] = useState<UserAllergy | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
    setValue,
  } = useForm<AllergyFormValues>({
    resolver: zodResolver(allergySchema),
    defaultValues: {
      allergy_name: '',
      severity: '',
      reaction_description: '',
      reaction_type: '',
      treatment: '',
      notes: '',
      date_diagnosed: '',
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
      setUserAllergies(data || []);
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

    try {
      // Solo enviamos campos que sabemos que existen en la tabla
      const dataToInsert: any = {
        user_id: user.id,
        allergy_name: values.allergy_name.trim(),
        reaction_description: values.reaction_description && values.reaction_description.trim() ? values.reaction_description : null,
        notes: values.notes && values.notes.trim() ? values.notes : null,
        severity: values.severity && values.severity.trim() ? values.severity : null,
      };

      // Agregar campos opcionales solo si existen en la tabla
      if (values.reaction_type && values.reaction_type.trim()) {
        dataToInsert.reaction_type = values.reaction_type;
      }
      if (values.treatment && values.treatment.trim()) {
        dataToInsert.treatment = values.treatment;
      }
      if (values.date_diagnosed && values.date_diagnosed.trim()) {
        dataToInsert.date_diagnosed = values.date_diagnosed;
      }

      console.log('Enviando datos:', dataToInsert);
      const { data, error } = await supabase.from('user_allergies').insert([dataToInsert]).select();

      if (error) {
        console.error('Error de Supabase:', error);
        console.error('Detalles:', error.details, error.hint);
        toast.error(`No se pudo añadir la alergia: ${error.message}`);
      } else {
        console.log('Alergia agregada:', data);
        toast.success('¡Alergia añadida correctamente!');
        reset();
        setIsDialogOpen(false);
        await fetchUserAllergies(user.id);
      }
    } catch (err) {
      console.error('Error inesperado:', err);
      toast.error('Error inesperado al añadir la alergia.');
    }
  };

  // Función para manejar la actualización de una alergia
  const handleUpdateAllergy = async (values: AllergyFormValues) => {
    if (!user || !editingAllergy) return;

    try {
      // Solo actualizamos campos que sabemos que existen
      const dataToUpdate: any = {
        allergy_name: values.allergy_name.trim(),
        reaction_description: values.reaction_description && values.reaction_description.trim() ? values.reaction_description : null,
        notes: values.notes && values.notes.trim() ? values.notes : null,
        severity: values.severity && values.severity.trim() ? values.severity : null,
      };

      // Agregar campos opcionales solo si existen
      if (values.reaction_type && values.reaction_type.trim()) {
        dataToUpdate.reaction_type = values.reaction_type;
      }
      if (values.treatment && values.treatment.trim()) {
        dataToUpdate.treatment = values.treatment;
      }
      if (values.date_diagnosed && values.date_diagnosed.trim()) {
        dataToUpdate.date_diagnosed = values.date_diagnosed;
      }

      console.log('Actualizando con datos:', dataToUpdate);
      const { data, error } = await supabase
        .from('user_allergies')
        .update(dataToUpdate)
        .eq('id', editingAllergy.id)
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('Error de Supabase:', error);
        console.error('Detalles:', error.details, error.hint);
        toast.error(`No se pudo actualizar la alergia: ${error.message}`);
      } else {
        console.log('Alergia actualizada:', data);
        toast.success('¡Alergia actualizada correctamente!');
        reset();
        setIsDialogOpen(false);
        setEditingAllergy(null);
        await fetchUserAllergies(user.id);
      }
    } catch (err) {
      console.error('Error inesperado:', err);
      toast.error('Error inesperado al actualizar la alergia.');
    }
  };

  // Función para manejar la eliminación de una alergia
  const handleDeleteAllergy = async (allergyId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_allergies')
        .delete()
        .match({ id: allergyId, user_id: user.id });

      if (error) {
        console.error('Error de Supabase:', error);
        toast.error(`No se pudo eliminar la alergia: ${error.message}`);
      } else {
        toast.success('Alergia eliminada correctamente.');
        await fetchUserAllergies(user.id);
      }
    } catch (err) {
      console.error('Error inesperado:', err);
      toast.error('Error inesperado al eliminar la alergia.');
    }
  };

  const handleAddQuickAllergy = async (allergenName: string) => {
    if (!user) return;

    const { error } = await supabase.from('user_allergies').insert({
      user_id: user.id,
      allergy_name: allergenName,
      reaction_description: null,
      notes: null,
      severity: null,
    });

    if (error) {
      toast.error('No se pudo añadir la alergia.');
    } else {
      toast.success(`¡"${allergenName}" añadido!`);
      await fetchUserAllergies(user.id);
    }
  };

  const handleEditAllergy = (allergy: UserAllergy) => {
    setEditingAllergy(allergy);
    setValue('allergy_name', allergy.allergy_name);
    setValue('severity', allergy.severity as any);
    setValue('reaction_description', allergy.reaction_description || '');
    setValue('reaction_type', allergy.reaction_type || '');
    setValue('treatment', allergy.treatment || '');
    setValue('notes', allergy.notes || '');
    setValue('date_diagnosed', allergy.date_diagnosed || '');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAllergy(null);
    reset();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando información de alergias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-1">
              <p className="text-4xl font-bold text-red-600 dark:text-red-400">{userAllergies.length}</p>
              <p className="text-sm text-muted-foreground">Alergias registradas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-1">
              <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                {userAllergies.filter(a => a.severity === 'severa').length}
              </p>
              <p className="text-sm text-muted-foreground">Alergias severas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">100%</p>
                <p className="text-sm text-muted-foreground">Protegido</p>
              </div>
              <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="list" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Mis Alergias ({userAllergies.length})</span>
          </TabsTrigger>
          <TabsTrigger value="quick" className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Alérgenos Comunes</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: My Allergies */}
        <TabsContent value="list" className="space-y-4">
          {userAllergies.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {userAllergies.map((allergy) => (
                <Card key={allergy.id} className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                          <CardTitle className="text-xl">{allergy.allergy_name}</CardTitle>
                        </div>
                        {allergy.severity && (
                          <Badge className={`w-fit border ${getSeverityColor(allergy.severity)}`}>
                            {getSeverityLabel(allergy.severity)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleEditAllergy(allergy)}
                          className="h-9 w-9"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                ¿Eliminar alergia?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Se eliminará permanentemente la alergia a <strong>"{allergy.allergy_name}"</strong> de tu perfil. Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteAllergy(allergy.id)} 
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Sí, eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* TIPO DE REACCIÓN */}
                    {allergy.reaction_type && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <AlertTriangle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          Tipo de Reacción
                        </div>
                        <p className="text-sm text-muted-foreground ml-6 bg-purple-50 dark:bg-purple-950/20 p-2 rounded-lg border border-purple-200 dark:border-purple-800">
                          {allergy.reaction_type}
                        </p>
                      </div>
                    )}

                    {/* SÍNTOMAS/REACCIÓN DETALLADOS */}
                    {allergy.reaction_description && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          Síntomas/Reacción Detallados
                        </div>
                        <p className="text-sm text-muted-foreground ml-6 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800 whitespace-pre-wrap">
                          {allergy.reaction_description}
                        </p>
                      </div>
                    )}

                    {/* TRATAMIENTO */}
                    {allergy.treatment && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Pill className="h-4 w-4 text-green-600 dark:text-green-400" />
                          Tratamiento/Manejo
                        </div>
                        <p className="text-sm text-muted-foreground ml-6 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800 whitespace-pre-wrap">
                          {allergy.treatment}
                        </p>
                      </div>
                    )}

                    {/* FECHA DE DIAGNÓSTICO */}
                    {allergy.date_diagnosed && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          Fecha de Diagnóstico
                        </div>
                        <p className="text-sm text-muted-foreground ml-6">
                          {new Date(allergy.date_diagnosed).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    )}

                    {/* NOTAS ADICIONALES */}
                    {allergy.notes && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Pill className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          Notas Adicionales
                        </div>
                        <p className="text-sm text-muted-foreground ml-6 bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 whitespace-pre-wrap">
                          {allergy.notes}
                        </p>
                      </div>
                    )}

                    {/* FECHA DE REGISTRO */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-slate-200 dark:border-slate-800">
                      <Calendar className="h-3 w-3" />
                      Registrado: {new Date(allergy.created_at).toLocaleDateString('es-ES')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-300 ml-3">
                No tienes ninguna alergia registrada. Usa el botón "Nueva Alergia" para comenzar.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Tab 2: Quick Allergens */}
        <TabsContent value="quick" className="space-y-4">
          <Alert className="bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-3">
              Haz clic en cualquier alérgeno común para añadirlo rápidamente a tu perfil.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {COMMON_ALLERGENS.map((allergen) => {
              const isAdded = userAllergies.some(a => a.allergy_name === allergen.name);
              return (
                <Card 
                  key={allergen.name}
                  className="border-slate-200 dark:border-slate-800 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{allergen.icon}</span>
                        <div>
                          <p className="font-medium">{allergen.name}</p>
                          <p className="text-xs text-muted-foreground">{allergen.category}</p>
                        </div>
                      </div>
                      {isAdded ? (
                        <Badge variant="secondary" className="bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Añadido
                        </Badge>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAddQuickAllergy(allergen.name)}
                          className="gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Añadir
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              {editingAllergy ? 'Editar Alergia' : 'Añadir Nueva Alergia'}
            </DialogTitle>
            <DialogDescription>
              {editingAllergy ? 'Actualiza todos los detalles de tu alergia.' : 'Registra una alergia con todos sus detalles para mantener tu perfil seguro.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit((data) => {
            console.log('Formulario enviado con datos:', data);
            editingAllergy ? handleUpdateAllergy(data) : handleAddAllergy(data);
          })} className="space-y-4">
            {/* NOMBRE DEL ALÉRGENO */}
            <div className="space-y-2">
              <Label htmlFor="allergy_name" className="flex items-center gap-1">
                <Pill className="h-4 w-4" />
                Nombre del Alérgeno *
              </Label>
              <Controller
                name="allergy_name"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <Input 
                      id="allergy_name" 
                      placeholder="Ej: Penicilina, Cacahuates..." 
                      {...field} 
                      className="h-9"
                    />
                    {fieldState.error && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>

            {/* SEVERIDAD */}
            <div className="space-y-2">
              <Label htmlFor="severity" className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Severidad
              </Label>
              <Controller
                name="severity"
                control={control}
                render={({ field }) => (
                  <select
                    id="severity"
                    {...field}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">Sin especificar</option>
                    <option value="leve">Leve</option>
                    <option value="moderada">Moderada</option>
                    <option value="severa">Severa ⚠️</option>
                  </select>
                )}
              />
            </div>

            {/* TIPO DE REACCIÓN */}
            <div className="space-y-2">
              <Label htmlFor="reaction_type" className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Tipo de Reacción
              </Label>
              <Controller
                name="reaction_type"
                control={control}
                render={({ field }) => (
                  <select
                    id="reaction_type"
                    {...field}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">Selecciona un tipo</option>
                    <option value="cutanea">Cutánea (Rash, picazón)</option>
                    <option value="gastrointestinal">Gastrointestinal (Náusea, vómito)</option>
                    <option value="respiratoria">Respiratoria (Tos, asma)</option>
                    <option value="anafilactica">Anafiláctica (Severa, shock)</option>
                    <option value="otra">Otra</option>
                  </select>
                )}
              />
            </div>

            {/* SÍNTOMAS/REACCIÓN DETALLADOS */}
            <div className="space-y-2">
              <Label htmlFor="reaction_description" className="flex items-center gap-1">
                Síntomas/Reacción Detallados
              </Label>
              <Controller
                name="reaction_description"
                control={control}
                render={({ field }) => (
                  <Textarea 
                    id="reaction_description" 
                    placeholder="Ej: Urticaria en brazos, dificultad para respirar, hinchazón de labios..." 
                    {...field}
                    className="min-h-24 resize-none text-sm"
                  />
                )}
              />
            </div>

            {/* TRATAMIENTO */}
            <div className="space-y-2">
              <Label htmlFor="treatment" className="flex items-center gap-1">
                Tratamiento/Manejo
              </Label>
              <Controller
                name="treatment"
                control={control}
                render={({ field }) => (
                  <Textarea 
                    id="treatment" 
                    placeholder="Ej: Tomar antihistamínicos, usar EpiPen si es necesario, evitar completamente..." 
                    {...field}
                    className="min-h-24 resize-none text-sm"
                  />
                )}
              />
            </div>

            {/* FECHA DE DIAGNÓSTICO */}
            <div className="space-y-2">
              <Label htmlFor="date_diagnosed" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Fecha de Diagnóstico
              </Label>
              <Controller
                name="date_diagnosed"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="date_diagnosed" 
                    type="date"
                    {...field}
                    className="h-9"
                  />
                )}
              />
            </div>

            {/* NOTAS ADICIONALES */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-1">
                Notas Adicionales
              </Label>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <Textarea 
                    id="notes" 
                    placeholder="Ej: Informar a médicos, llevar identificación médica, reacciones previas..." 
                    {...field}
                    className="min-h-24 resize-none text-sm"
                  />
                )}
              />
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="gap-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : editingAllergy ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Actualizar
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Añadir Alergia
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8">
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl gap-2 bg-red-600 hover:bg-red-700 text-white"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};