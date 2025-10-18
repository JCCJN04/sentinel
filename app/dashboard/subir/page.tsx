// app/dashboard/subir/page.tsx
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import React, { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUserProfile as getUser } from '@/lib/user-service'
import { uploadDocument, type DocumentUpload, type Document } from '@/lib/document-service';
import { getCategoriesForUser, addCategoryForUser, Category } from '@/lib/category-service';
import { cn } from '@/lib/utils'
import { useSmartToast } from '@/hooks/useSmartToast'
import { ToastContainer } from '@/components/documentos/toast-container'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { DocumentUploadZone } from '@/components/documentos/document-upload-zone'
import { UploadSuccessModal } from '@/components/documentos/upload-success-modal'
import { CategoryCombobox } from '@/components/documentos/category-combobox'
import { DynamicDocumentFields } from '@/components/documentos/dynamic-document-fields'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Stethoscope, Bell } from 'lucide-react'
import { useDocumentTypeDetection } from '@/hooks/useDocumentTypeDetection'

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
  const [isFileSelected, setIsFileSelected] = useState(false)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [uploadedDocument, setUploadedDocument] = useState<Document | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [categoryError, setCategoryError] = useState<string | null>(null)

  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)

  // Detección automática de tipo de documento
  const documentDetection = useDocumentTypeDetection(fileName)
  const smartToast = useSmartToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      file: null,
      date: new Date().toISOString().split('T')[0],
    },
    mode: 'onBlur',
  })

  const fetchUserCategories = useCallback(async () => {
    try {
      setIsLoadingCategories(true)
      const fetchedCategories = await getCategoriesForUser(undefined, true)
      setCategories(fetchedCategories)
      setCategoryError(null)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      const errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar las categorías.'
      setCategoryError(errorMessage)
    } finally {
      setIsLoadingCategories(false)
    }
  }, [])

  useEffect(() => {
    fetchUserCategories()
  }, [fetchUserCategories])

  useEffect(() => {
    const categoryNameFromQuery = searchParams.get('categoria')
    if (categoryNameFromQuery && categories.length > 0) {
      const categoryExists = categories.some(cat => cat.name === categoryNameFromQuery)
      if (categoryExists) {
        form.setValue('category', categoryNameFromQuery, { shouldValidate: true })
      }
    }
  }, [searchParams, categories, form])

  const handleFileSelect = (file: File) => {
    const cleanFileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
    form.setValue('documentName', cleanFileName.replace(/_/g, ' ').replace(/-/g, ' '), { shouldValidate: true })
    form.setValue('file', file, { shouldValidate: true })
    form.setValue('date', new Date().toISOString().split('T')[0])
    setFileName(file.name)
    setSelectedFile(file)
    setIsFileSelected(true)

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => setFilePreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setFilePreview(null)
    }
  }

  const removeFile = () => {
    form.setValue('file', null)
    form.clearErrors('file')
    setIsFileSelected(false)
    setFileName('')
    setFilePreview(null)
    setSelectedFile(null)
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: 'Nombre inválido',
        description: 'El nombre de la categoría no puede estar vacío.',
        variant: 'destructive',
      })
      return
    }
    setIsCreatingCategory(true)
    try {
      const newCategory = await addCategoryForUser(newCategoryName.trim())
      await fetchUserCategories()
      form.setValue('category', newCategory.name, { shouldValidate: true })
      toast({
        title: 'Éxito',
        description: `Categoría "${newCategory.name}" creada y seleccionada.`,
      })
      setIsCreateCategoryOpen(false)
      setNewCategoryName('')
    } catch (error: any) {
      toast({
        title: 'Error al crear',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsCreatingCategory(false)
    }
  }

  async function onSubmit(values: FormValues) {
    if (!values.file) {
      smartToast.error('Archivo Requerido', {
        description: 'Por favor, selecciona un archivo para subir.',
      })
      form.setError('file', { type: 'manual', message: 'Debes seleccionar un archivo.' })
      return
    }

    setIsUploading(true)
    try {
      const user = await getUser()
      if (!user) throw new Error('Usuario no autenticado.')

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
      }

      const uploadedDoc = await uploadDocument(documentDataForUpload)
      setUploadedDocument(uploadedDoc)
      setShowSuccessModal(true)
      smartToast.success('¡Documento subido!', {
        description: `"${values.documentName}" se subió correctamente.`,
        duration: 2000,
      })
    } catch (error: any) {
      console.error('Error en onSubmit al subir documento:', error)
      smartToast.error('Error al subir', {
        description: error.message || 'Ocurrió un problema al intentar subir el documento.',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleUploadAnother = () => {
    setShowSuccessModal(false)
    setUploadedDocument(null)
    form.reset()
    removeFile()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleGoToDocuments = () => {
    if (uploadedDocument) {
      const selectedCategory = categories.find(c => c.name === uploadedDocument.category)
      const categoryParams = selectedCategory ? `?category_id=${selectedCategory.id}` : ''
      router.push(`/dashboard/documentos${categoryParams}`)
    } else {
      router.push('/dashboard/documentos')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <ToastContainer toasts={smartToast.toasts} onDismiss={smartToast.removeToast} />
      
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        {/* Header Section */}
        <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="space-y-2 text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Subir Nuevo Documento
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Organiza y almacena de forma segura tus documentos médicos. Carga, categoriza y accede a ellos en cualquier momento.
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* PASO 1: SELECCIONAR ARCHIVO */}
          <Card className="border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-slate-800 dark:to-transparent border-b border-slate-200 dark:border-slate-700">
              <CardTitle className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
                  1
                </span>
                <span>Seleccionar archivo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="file"
                render={({ fieldState }) => (
                  <FormItem>
                    <FormControl>
                      <DocumentUploadZone
                        onFileSelect={handleFileSelect}
                        acceptedTypes={ACCEPTED_FILE_TYPES}
                        maxSize={MAX_FILE_SIZE}
                        onFileRemove={removeFile}
                        selectedFile={selectedFile}
                        filePreview={filePreview}
                        fileName={fileName}
                        error={fieldState.error?.message}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* PASOS 2-4: SOLO SI HAY ARCHIVO SELECCIONADO */}
          {isFileSelected && (
            <>
              <Tabs defaultValue="basic" className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 p-1 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                  <TabsTrigger value="basic" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Básica</span>
                  </TabsTrigger>
                  <TabsTrigger value="medical" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                    <Stethoscope className="w-4 h-4" />
                    <span className="hidden sm:inline">Médica</span>
                  </TabsTrigger>
                  <TabsTrigger value="reminders" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                    <Bell className="w-4 h-4" />
                    <span className="hidden sm:inline">Recordatorios</span>
                  </TabsTrigger>
                </TabsList>

              {/* TAB 1: INFORMACIÓN BÁSICA */}
              <TabsContent value="basic" className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                <Card className="border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-transparent dark:from-slate-800 dark:to-transparent border-b border-slate-200 dark:border-slate-700">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded bg-emerald-600 text-white text-xs font-bold">2</span>
                      Información Básica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                      <FormField
                        control={form.control}
                        name="documentName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del Documento *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej: Radiografía de Tórax"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Pon un nombre descriptivo para identificarlo fácilmente
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría *</FormLabel>
                            <FormControl>
                              <CategoryCombobox
                                value={field.value}
                                onValueChange={field.onChange}
                                categories={categories}
                                onCreateCategory={async (name: string) => {
                                  const newCategory = await addCategoryForUser(name)
                                  await fetchUserCategories()
                                  return newCategory.id
                                }}
                                placeholder="Seleccionar categoría..."
                                disabled={isLoadingCategories || !!categoryError}
                              />
                            </FormControl>
                            <FormDescription>
                              {documentDetection.confidence > 0.5 && (
                                <span className="text-blue-600 dark:text-blue-400">
                                  💡 Sugerida: {documentDetection.suggestedCategory}
                                </span>
                              )}
                              {!documentDetection.confidence && (
                                <span>Organiza tus documentos por tipo o especialidad</span>
                              )}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha del Documento</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormDescription>
                              Fecha en la que se generó el documento
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => {
                          const charCount = field.value?.length || 0
                          const maxChars = 500
                          const percentage = Math.round((charCount / maxChars) * 100)
                          return (
                            <FormItem>
                              <FormLabel>Descripción / Notas</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Añade detalles importantes sobre este documento..."
                                  className="resize-none"
                                  rows={3}
                                  maxLength={maxChars}
                                  {...field}
                                />
                              </FormControl>
                              <div className="flex justify-between items-center">
                                <FormDescription>
                                  Máximo 500 caracteres
                                </FormDescription>
                                <span className={cn(
                                  'text-xs font-medium',
                                  charCount === 0 && 'text-gray-400',
                                  charCount < 250 && charCount > 0 && 'text-blue-600 dark:text-blue-400',
                                  charCount >= 250 && charCount < 500 && 'text-amber-600 dark:text-amber-400',
                                  charCount === 500 && 'text-red-600 dark:text-red-400'
                                )}>
                                  {charCount} / {maxChars}
                                </span>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )
                        }}
                      />

                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Etiquetas</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej: urgente, cardiology, 2025"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Separa con comas. Útil para búsquedas rápidas
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB 2: INFORMACIÓN MÉDICA */}
                <TabsContent value="medical" className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                  <DynamicDocumentFields
                    form={form}
                    detectedType={documentDetection.type}
                    show={documentDetection.confidence > 0.3}
                  />
                  <Card className="border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="bg-gradient-to-r from-red-50 to-transparent dark:from-slate-800 dark:to-transparent border-b border-slate-200 dark:border-slate-700">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded bg-red-600 text-white text-xs font-bold">3</span>
                        Información Médica (Opcional)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="patient_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del Paciente</FormLabel>
                            <FormControl>
                              <Input placeholder="Nombre completo del paciente" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="doctor_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del Médico</FormLabel>
                            <FormControl>
                              <Input placeholder="Nombre del médico tratante" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="specialty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Especialidad Médica</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: Cardiología, Pediatría" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="provider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Proveedor / Clínica</FormLabel>
                            <FormControl>
                              <Input placeholder="Nombre del hospital o clínica" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monto</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Moneda</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: MXN, USD, EUR" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB 3: RECORDATORIOS */}
                <TabsContent value="reminders" className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                  <Card className="border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="bg-gradient-to-r from-amber-50 to-transparent dark:from-slate-800 dark:to-transparent border-b border-slate-200 dark:border-slate-700">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded bg-amber-600 text-white text-xs font-bold">4</span>
                        Fechas y Recordatorios (Opcional)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="expiry_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de Expiración</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormDescription>
                              Te avisaremos antes de que expire
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="reminderDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de Recordatorio</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormDescription>
                              Recibirás una notificación en esta fecha
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="reminderNote"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Nota del Recordatorio</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Ej: Programar cita de seguimiento, Llamar al doctor..."
                                className="resize-none"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              ¿Qué necesitas recordar sobre este documento?
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* BOTONES DE ACCIÓN */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={removeFile}
                  disabled={isUploading}
                  className="flex-1"
                >
                  Cambiar archivo
                </Button>
                <Button
                  type="submit"
                  disabled={isUploading || isLoadingCategories}
                  className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    'Subir Documento'
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
      </Form>

      {/* MODAL DE NUEVA CATEGORÍA */}
      <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Categoría</DialogTitle>
            <DialogDescription>
              Añade una nueva categoría para organizar tus documentos.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-category-name">Nombre de la Categoría</Label>
            <Input
              id="new-category-name"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="Ej: Laboratorios, Radiografías"
              disabled={isCreatingCategory}
              autoFocus
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isCreatingCategory}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              onClick={handleCreateCategory}
              disabled={isCreatingCategory || !newCategoryName.trim()}
            >
              {isCreatingCategory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE ÉXITO */}
      <UploadSuccessModal
        isOpen={showSuccessModal}
        document={uploadedDocument}
        onUploadAnother={handleUploadAnother}
        onGoToDocuments={handleGoToDocuments}
        onViewDocument={() => {
          handleGoToDocuments()
        }}
        onClose={() => setShowSuccessModal(false)}
      />
      </div>
    </div>
  )
}