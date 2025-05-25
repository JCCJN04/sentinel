// startupv2/app/dashboard/subir/page.tsx
'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast' // This is the hook being used
import { UploadCloud, X, FileText, Loader2 } from 'lucide-react'
import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUserProfile as getUser } from '@/lib/user-service'
import { uploadDocument, type DocumentUpload } from '@/lib/document-service';
import { getCategoriesForUser, Category } from '@/lib/category-service';

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const formSchema = z.object({
  documentName: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
  file: z
    .custom<File | null>((val) => val instanceof File || val === null, 'Debes seleccionar un archivo.')
    .refine(
      (file) => file === null || file.size <= MAX_FILE_SIZE,
      `El tamaño máximo del archivo es ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
    )
    .refine(
      (file) => file === null || ACCEPTED_FILE_TYPES.includes(file.type),
      'Tipo de archivo no soportado. Sube PDF, DOC, DOCX, JPG, PNG, HEIC.'
    ),
  date: z.string().refine((val) => val === '' || !val || !isNaN(Date.parse(val)), { message: "Fecha inválida" }).optional(),
  expiry_date: z.string().optional(),
  notes: z.string().optional(),
  provider: z.string().optional(),
  amount: z.string().optional(),
  currency: z.string().optional(),
  patient_name: z.string().optional(),
  doctor_name: z.string().optional(),
  specialty: z.string().optional(),
  reminderDate: z.string().optional(),
  reminderNote: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function SubirDocumentoPage() {
  const [filePreview, setFilePreview] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string>('');
  const [isUploading, setIsUploading] = React.useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = React.useState(true);
  const [categoryError, setCategoryError] = React.useState<string | null>(null);
  const [categoryFromUrl, setCategoryFromUrl] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentName: '',
      category: '',
      description: '',
      tags: '',
      file: null,
      date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      provider: '',
      amount: '',
      currency: '',
      patient_name: '',
      doctor_name: '',
      specialty: '',
      reminderDate: '',
      reminderNote: '',
    },
  });

  const fetchUserCategories = React.useCallback(async () => {
    try {
      setIsLoadingCategories(true);
      const fetchedCategories = await getCategoriesForUser();
      setCategories(fetchedCategories);
      setCategoryError(null);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      const errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar las categorías.';
      setCategoryError(errorMessage);
      toast({
        title: 'Error al cargar categorías',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUserCategories();
  }, [fetchUserCategories]);

  React.useEffect(() => {
    const categoryNameFromQuery = searchParams.get('categoria');
    if (categoryNameFromQuery) {
      const categoryExists = categories.some(cat => cat.name === categoryNameFromQuery);
      if (categoryExists) {
        form.setValue('category', categoryNameFromQuery, { shouldValidate: true });
        setCategoryFromUrl(categoryNameFromQuery);
      } else if (!isLoadingCategories && categories.length > 0) {
        toast({
          title: 'Categoría no encontrada',
          description: `La categoría "${categoryNameFromQuery}" no existe. Puedes seleccionar otra o subir sin categoría.`,
          variant: 'default', // Changed from 'warning'
        });
      } else if (!isLoadingCategories && categories.length === 0 && categoryNameFromQuery) {
         toast({
          title: 'Sin Categorías',
          description: `No hay categorías disponibles. La categoría "${categoryNameFromQuery}" no se pudo preseleccionar.`,
          variant: 'default', // Changed from 'warning'
        });
      }
    }
  }, [searchParams, categories, form, isLoadingCategories]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('file', file, { shouldValidate: true });
      setFileName(file.name);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    } else {
      form.setValue('file', null, { shouldValidate: true });
      setFileName('');
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    form.setValue('file', null, { shouldValidate: true });
    setFileName('');
    setFilePreview(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  async function onSubmit(values: FormValues) {
    if (!values.file) {
      toast({ title: 'Archivo Requerido', description: 'Por favor, selecciona un archivo para subir.', variant: 'destructive' });
      form.setError('file', { type: 'manual', message: 'Debes seleccionar un archivo.' });
      return;
    }

    setIsUploading(true);
    try {
      const user = await getUser();
      if (!user) {
        toast({ title: 'Error', description: 'Usuario no autenticado.', variant: 'destructive' });
        setIsUploading(false);
        router.push('/login');
        return;
      }

      const docName = values.documentName?.trim() || values.file?.name || "Documento sin título";
      const categoryToAssign = values.category?.trim() || null;

      const documentDataForUpload: DocumentUpload = {
        name: docName,
        category: categoryToAssign,
        tags: values.tags?.split(',').map((tag) => tag.trim()).filter(tag => tag) || [],
        date: values.date || new Date().toISOString().split('T')[0],
        expiry_date: values.expiry_date || null,
        notes: values.description || null, // Ensure 'notes' from form (description) is passed to 'notes' in DocumentUpload
        file: values.file,
        provider: values.provider || null,
        amount: values.amount || null,
        currency: values.currency || null,
        patient_name: values.patient_name || null,
        doctor_name: values.doctor_name || null,
        specialty: values.specialty || null,
      };
      
      console.log("Enviando a uploadDocument:", documentDataForUpload);
      const uploadedDoc = await uploadDocument(documentDataForUpload);

      if (uploadedDoc) {
        toast({ title: 'Éxito', description: 'Documento subido y procesándose.' });
        form.reset(); 
        setFilePreview(null);
        setFileName('');
        setCategoryFromUrl(null); // Reset category from URL after successful upload
        router.push(`/dashboard/documentos/${uploadedDoc.id}`);
      }
    } catch (error: any) {
      console.error('Error en onSubmit al subir documento:', error);
      toast({
        title: 'Error al subir',
        description: error.message || 'Ocurrió un problema al intentar subir el documento.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Subir Nuevo Documento</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="documentName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Documento (Opcional)</FormLabel>
                <FormControl><Input placeholder="Ej: Radiografía de Tórax - Juan Pérez" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría (Opcional)</FormLabel>
                <Select
                  onValueChange={(selectedValue) => {
                    if (selectedValue === "_NONE_") {
                      field.onChange(""); 
                    } else {
                      field.onChange(selectedValue);
                    }
                  }}
                  value={field.value || ''} 
                  disabled={isLoadingCategories || !!categoryError || !!categoryFromUrl} // Disable if category came from URL
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        isLoadingCategories ? "Cargando categorías..."
                        : categoryError ? "Error al cargar"
                        : categoryFromUrl ? categoryFromUrl // Show category from URL if present
                        : "Selecciona una categoría (Opcional)"
                      } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="_NONE_">-- Ninguna --</SelectItem> 
                    {isLoadingCategories ? <SelectItem value="loading_cats" disabled>Cargando...</SelectItem>
                      : categoryError ? <SelectItem value="error_cats" disabled>{categoryError}</SelectItem>
                      : categories.length > 0 ? categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name} {cat.user_id === null ? '(global)' : ''}
                          </SelectItem>
                        ))
                      : <SelectItem value="no_cat_avail" disabled>No hay categorías disponibles.</SelectItem>}
                  </SelectContent>
                </Select>
                {categoryFromUrl && ( // Show message if category is from URL
                  <FormDescription className="mt-1 text-xs text-muted-foreground">
                    Categoría preseleccionada. Puedes cambiarla si es necesario.
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="file"
            render={({ fieldState }) => ( // field is not directly used here, but fieldState.error is
              <FormItem>
                <FormLabel>Archivo (Requerido para subir)</FormLabel>
                <FormControl>
                  <div className="flex flex-col items-center justify-center w-full">
                    <label htmlFor="file-upload" className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600 ${fieldState.error ? 'border-destructive' : ''}`}>
                      {filePreview && fileName.match(/\.(jpeg|jpg|png|gif|heic|heif)$/i) ? (
                        <div className="relative w-full h-full"><img src={filePreview} alt="Vista previa" className="object-contain w-full h-full rounded-lg" /><button type="button" onClick={removeFile} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600" aria-label="Remove file"><X size={16} /></button></div>
                      ) : fileName ? (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6"><FileText size={32} className="text-gray-500 dark:text-gray-400 mb-2" /><p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">{fileName}</span></p><p className="text-xs text-gray-500 dark:text-gray-400">PDF, DOC, DOCX, JPG, PNG, HEIC (MAX. 10MB)</p><button type="button" onClick={removeFile} className="mt-2 text-sm text-red-500 hover:text-red-700">Quitar archivo</button></div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6"><UploadCloud size={32} className="mb-4 text-gray-500 dark:text-gray-400" /><p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p><p className="text-xs text-gray-500 dark:text-gray-400">PDF, DOC, DOCX, JPG, PNG, HEIC (MAX. 10MB)</p></div>
                      )}
                      <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept={ACCEPTED_FILE_TYPES.join(',')} />
                    </label>
                  </div>
                </FormControl>
                <FormDescription>Selecciona el documento que deseas subir.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha del Documento (Opcional)</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description" // This field is for description/notes
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción / Notas (Opcional)</FormLabel>
                <FormControl><Textarea placeholder="Añade una breve descripción o notas..." className="resize-none" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Etiquetas (Opcional)</FormLabel>
                <FormControl><Input placeholder="Ej: importante, urgente, personal" {...field} /></FormControl>
                <FormDescription>Separa las etiquetas con comas.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <h2 className="text-xl font-semibold pt-4 border-t mt-6">Información Adicional (Opcional)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="patient_name" render={({ field }) => (<FormItem><FormLabel>Nombre del Paciente</FormLabel><FormControl><Input placeholder="Nombre completo del paciente" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="doctor_name" render={({ field }) => (<FormItem><FormLabel>Nombre del Médico</FormLabel><FormControl><Input placeholder="Nombre del médico tratante" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="specialty" render={({ field }) => (<FormItem><FormLabel>Especialidad Médica</FormLabel><FormControl><Input placeholder="Ej: Cardiología, Pediatría" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="provider" render={({ field }) => (<FormItem><FormLabel>Proveedor/Clínica</FormLabel><FormControl><Input placeholder="Nombre del hospital o clínica" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="expiry_date" render={({ field }) => (<FormItem><FormLabel>Fecha de Expiración del Documento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Monto (si aplica)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Moneda</FormLabel><FormControl><Input placeholder="Ej: MXN, USD" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>

          <h2 className="text-xl font-semibold pt-4 border-t mt-6">Programar Recordatorio (Opcional)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="reminderDate" render={({ field }) => (<FormItem><FormLabel>Fecha del Recordatorio</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="reminderNote" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Nota del Recordatorio</FormLabel><FormControl><Textarea placeholder="Ej: Programar cita de seguimiento, renovar receta" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>

          <Button type="submit" className="w-full" disabled={isUploading || isLoadingCategories}>
            {isUploading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Subiendo...</>) : ('Subir Documento')}
          </Button>
        </form>
      </Form>
    </div>
  )
}
