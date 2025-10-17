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
import { toast } from '@/components/ui/use-toast'
import { UploadCloud, X, FileText, Loader2, PlusCircle } from 'lucide-react'
import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUserProfile as getUser } from '@/lib/user-service'
import { uploadDocument, type DocumentUpload } from '@/lib/document-service';
import { getCategoriesForUser, addCategoryForUser, Category } from '@/lib/category-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

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
  documentName: z.string().min(1, 'El nombre del documento es requerido.'),
  category: z.string().optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
  file: z
    .custom<File | null>((val) => val instanceof File, 'Debes seleccionar un archivo.')
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      `El tamaño máximo del archivo es ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
    )
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
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
  const [isFileSelected, setIsFileSelected] = React.useState(false);
  const [filePreview, setFilePreview] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string>('');
  const [isUploading, setIsUploading] = React.useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = React.useState(true);
  const [categoryError, setCategoryError] = React.useState<string | null>(null);
  const [categoryFromUrl, setCategoryFromUrl] = React.useState<string | null>(null);

  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const [isCreatingCategory, setIsCreatingCategory] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const fetchUserCategories = React.useCallback(async () => {
    try {
      setIsLoadingCategories(true);
      // CORRECCIÓN: Usamos una nueva función para traer todas las categorías a la vez
      const fetchedCategories = await getCategoriesForUser(null, true); // Asumiendo que getCategoriesForUser puede traer todas
      setCategories(fetchedCategories);
      setCategoryError(null);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      const errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar las categorías.';
      setCategoryError(errorMessage);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUserCategories();
  }, [fetchUserCategories]);

  React.useEffect(() => {
    const categoryNameFromQuery = searchParams.get('categoria');
    if (categoryNameFromQuery && categories.length > 0) {
      const categoryExists = categories.some(cat => cat.name === categoryNameFromQuery);
      if (categoryExists) {
        form.setValue('category', categoryNameFromQuery, { shouldValidate: true });
        setCategoryFromUrl(categoryNameFromQuery);
      }
    }
  }, [searchParams, categories, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const cleanFileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      form.setValue('documentName', cleanFileName.replace(/_/g, ' ').replace(/-/g, ' '));
      
      form.setValue('file', file, { shouldValidate: true });
      form.setValue('date', new Date().toISOString().split('T')[0]);
      setFileName(file.name);
      setIsFileSelected(true);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };
  
  const removeFile = () => {
    form.reset();
    setIsFileSelected(false);
    setFileName('');
    setFilePreview(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };
  
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({ title: "Nombre inválido", description: "El nombre de la categoría no puede estar vacío.", variant: "destructive" });
      return;
    }
    setIsCreatingCategory(true);
    try {
      const newCategory = await addCategoryForUser(newCategoryName.trim());
      await fetchUserCategories();
      form.setValue('category', newCategory.name, { shouldValidate: true });
      toast({ title: "Éxito", description: `Categoría "${newCategory.name}" creada y seleccionada.` });
      setIsCreateCategoryOpen(false);
      setNewCategoryName('');
    } catch (error: any) {
      toast({ title: "Error al crear", description: error.message, variant: "destructive" });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  async function onSubmit(values: FormValues) {
    if (!values.file) {
      toast({ title: 'Archivo Requerido', description: 'Por favor, selecciona un archivo para subir.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const user = await getUser();
      if (!user) throw new Error('Usuario no autenticado.');

      const documentDataForUpload: DocumentUpload = {
        name: values.documentName,
        category: values.category?.trim() || null,
        tags: values.tags?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
        date: values.date || new Date().toISOString().split('T')[0],
        expiry_date: values.expiry_date || null,
        notes: values.description || null,
        file: values.file,
        provider: values.provider || null,
        amount: values.amount || null,
        currency: values.currency || null,
        patient_name: values.patient_name || null,
        doctor_name: values.doctor_name || null,
        specialty: values.specialty || null,
      };
      
      const uploadedDoc = await uploadDocument(documentDataForUpload);

      if (uploadedDoc) {
        // --- INICIO DE LA CORRECCIÓN ---
        // Buscamos la categoría seleccionada en nuestro estado para obtener su ID.
        const selectedCategory = categories.find(c => c.name === uploadedDoc.category);
        
        // Creamos los parámetros para la URL.
        const successParams = `upload_success=true&doc_name=${encodeURIComponent(uploadedDoc.name)}`;
        const categoryParams = selectedCategory ? `&category_id=${selectedCategory.id}&category_name=${encodeURIComponent(selectedCategory.name)}` : '';

        // Redirigimos con todos los parámetros necesarios.
        router.push(`/dashboard/documentos?${successParams}${categoryParams}`);
        // --- FIN DE LA CORRECCIÓN ---
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
      <h1 className="text-3xl font-bold mb-6 text-center">Subir Nuevo Documento</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          <Card className={isFileSelected ? 'border-green-500' : ''}>
            <CardContent className="p-6">
              <FormField
                control={form.control}
                name="file"
                render={({ fieldState }) => (
                  <FormItem>
                    {!isFileSelected && <FormLabel className="text-base">Empieza por aquí</FormLabel>}
                    <FormControl>
                      <div className="flex flex-col items-center justify-center w-full">
                        {isFileSelected && fileName ? (
                          <div className="w-full text-center p-4 border rounded-md bg-muted">
                            {filePreview ? (
                              <div className="relative w-48 h-48 mx-auto mb-4"><img src={filePreview} alt="Vista previa" className="object-contain w-full h-full rounded-lg" /></div>
                            ) : (
                              <FileText size={48} className="mx-auto text-gray-500 dark:text-gray-400 mb-2" />
                            )}
                            <p className="font-semibold">{fileName}</p>
                            <Button type="button" variant="link" className="text-red-500 hover:text-red-700 h-auto p-0 mt-2" onClick={removeFile}>
                              <X size={14} className="mr-1"/> Cambiar archivo
                            </Button>
                          </div>
                        ) : (
                          <label htmlFor="file-upload" className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 ${fieldState.error ? 'border-destructive' : ''}`}>
                            <UploadCloud size={32} className="mb-4 text-gray-500" />
                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
                            <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG, HEIC (MAX. 10MB)</p>
                            <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept={ACCEPTED_FILE_TYPES.join(',')} />
                          </label>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {isFileSelected && (
            <>
              <Card>
                <CardHeader><CardTitle>Detalles Básicos</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="documentName" render={({ field }) => (<FormItem><FormLabel>Nombre del Documento</FormLabel><FormControl><Input placeholder="Ej: Radiografía de Tórax" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <div className="flex gap-2">
                        <Select onValueChange={field.onChange} value={field.value || ''} disabled={isLoadingCategories || !!categoryError}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder={isLoadingCategories ? "Cargando..." : "Selecciona una categoría"} /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.length > 0 ? categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                            )) : <SelectItem value="no-cat" disabled>No hay categorías</SelectItem>}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="icon" onClick={() => setIsCreateCategoryOpen(true)}><PlusCircle className="h-4 w-4" /></Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormLabel>Fecha del Documento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción / Notas</FormLabel><FormControl><Textarea placeholder="Añade una breve descripción o notas..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="tags" render={({ field }) => (<FormItem><FormLabel>Etiquetas</FormLabel><FormControl><Input placeholder="Ej: importante, personal" {...field} /></FormControl><FormDescription>Separa las etiquetas con comas.</FormDescription><FormMessage /></FormItem>)}/>
                </CardContent>
              </Card>

              <Card>
                  <CardHeader><CardTitle>Información Adicional (Opcional)</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="patient_name" render={({ field }) => (<FormItem><FormLabel>Nombre del Paciente</FormLabel><FormControl><Input placeholder="Nombre completo" {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="doctor_name" render={({ field }) => (<FormItem><FormLabel>Nombre del Médico</FormLabel><FormControl><Input placeholder="Nombre del tratante" {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="specialty" render={({ field }) => (<FormItem><FormLabel>Especialidad Médica</FormLabel><FormControl><Input placeholder="Ej: Cardiología" {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="provider" render={({ field }) => (<FormItem><FormLabel>Proveedor/Clínica</FormLabel><FormControl><Input placeholder="Nombre del hospital" {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Monto</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Moneda</FormLabel><FormControl><Input placeholder="Ej: MXN, USD" {...field} /></FormControl></FormItem>)} />
                  </CardContent>
              </Card>

              <Card>
                  <CardHeader><CardTitle>Fechas y Recordatorios (Opcional)</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="expiry_date" render={({ field }) => (<FormItem><FormLabel>Fecha de Expiración</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="reminderDate" render={({ field }) => (<FormItem><FormLabel>Fecha de Recordatorio</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="reminderNote" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Nota del Recordatorio</FormLabel><FormControl><Textarea placeholder="Ej: Programar cita de seguimiento" {...field} /></FormControl></FormItem>)} />
                  </CardContent>
              </Card>

              <Button type="submit" className="w-full" disabled={isUploading || isLoadingCategories}>
                {isUploading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Subiendo...</>) : ('Subir Documento')}
              </Button>
            </>
          )}
        </form>
      </Form>

      <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Categoría</DialogTitle>
            <DialogDescription>Añade una nueva categoría para organizar tus documentos.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-category-name">Nombre de la Categoría</Label>
            <Input id="new-category-name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Ej: Laboratorios" disabled={isCreatingCategory} />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={isCreatingCategory}>Cancelar</Button></DialogClose>
            <Button onClick={handleCreateCategory} disabled={isCreatingCategory || !newCategoryName.trim()}>
              {isCreatingCategory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}