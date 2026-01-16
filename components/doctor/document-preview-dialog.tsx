"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { 
  ExternalLink, 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  StickyNote,
  Calendar,
  Loader2,
  Save,
  User,
  Award,
  Briefcase,
  DollarSign,
  Stethoscope,
  Phone,
  Mail,
  MapPin
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

interface DocumentPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: {
    id: string
    title: string
    category: string
    fileType: string
    uploadedAt: string
    url: string
  }
  patientId: string
  patientName: string
}

export function DocumentPreviewDialog({ 
  open, 
  onOpenChange, 
  document,
  patientId,
  patientName
}: DocumentPreviewDialogProps) {
  const [zoom, setZoom] = useState(100)
  const [notes, setNotes] = useState("")
  const [savedNotes, setSavedNotes] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingNotes, setIsLoadingNotes] = useState(true)
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  const [doctorSheetOpen, setDoctorSheetOpen] = useState(false)
  const { toast } = useToast()

  const isPDF = document.fileType?.toLowerCase().includes('pdf')
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => 
    document.fileType?.toLowerCase().includes(ext)
  )

  // Load existing notes when dialog opens
  useEffect(() => {
    if (open && document.id) {
      loadNotes()
    }
  }, [open, document.id])

  const loadNotes = async () => {
    setIsLoadingNotes(true)
    try {
      const response = await fetch(`/api/doctor/document-notes?documentId=${document.id}&patientId=${patientId}`)
      if (response.ok) {
        const data = await response.json()
        setSavedNotes(data.notes || [])
      }
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      setIsLoadingNotes(false)
    }
  }

  const handleSaveNote = async () => {
    if (!notes.trim()) {
      toast({
        title: "Campo vacío",
        description: "Por favor escribe una nota antes de guardar",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/doctor/document-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          patientId: patientId,
          note: notes.trim()
        })
      })

      if (response.ok) {
        toast({
          title: "Nota guardada",
          description: "Tu nota se ha guardado correctamente"
        })
        setNotes("")
        await loadNotes()
      } else {
        throw new Error('Failed to save note')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la nota. Intenta de nuevo.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[95vh] flex flex-col p-0 gap-0 bg-background">
        {/* Premium Header */}
        <DialogHeader className="px-6 sm:px-8 py-6 sm:py-8 border-b bg-gradient-to-b from-muted/30 to-transparent">
          <div className="space-y-4">
            {/* Title & Actions Row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-2">
                <DialogTitle className="text-3xl sm:text-2xl font-bold tracking-tight leading-tight">
                  {document.title}
                </DialogTitle>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Badge 
                    variant="secondary" 
                    className="text-sm font-medium px-3 py-1.5 bg-primary/10 text-primary border-primary/20"
                  >
                    {document.category}
                  </Badge>
                  <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                  <span className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(document.uploadedAt), "d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                </div>
              </div>
              
              {/* Zoom Controls - Desktop Only */}
              <div className="hidden sm:flex items-center gap-2 bg-muted/50 rounded-xl p-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  className="h-9 w-9"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold min-w-[3.5rem] text-center px-2">
                  {zoom}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                  className="h-9 w-9"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Patient Info */}
            <div className="flex items-center gap-3 text-base sm:text-sm text-muted-foreground bg-muted/30 rounded-xl px-4 py-3 border border-border/50">
              <div className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 sm:h-4 sm:w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground/70 font-medium">Paciente</p>
                <p className="font-semibold text-foreground">{patientName}</p>
              </div>
            </div>

            {/* Action Button - Mobile */}
            <Button
              variant="outline"
              size="lg"
              asChild
              className="w-full sm:hidden h-12 text-base font-medium"
            >
              <a href={document.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-5 w-5 mr-2" />
                Abrir en pantalla completa
              </a>
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="preview" className="h-full flex flex-col">
            {/* Premium Tabs */}
            <div className="px-6 sm:px-8 pt-6 pb-2 border-b">
              <TabsList className="w-full grid grid-cols-2 h-14 sm:h-12 bg-muted/50 p-1.5 rounded-xl">
                <TabsTrigger 
                  value="preview" 
                  className="gap-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm text-base sm:text-sm font-semibold h-full rounded-lg"
                >
                  <FileText className="h-5 w-5 sm:h-4 sm:w-4" />
                  Vista previa
                </TabsTrigger>
                <TabsTrigger 
                  value="notes" 
                  className="gap-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm text-base sm:text-sm font-semibold h-full rounded-lg"
                >
                  <StickyNote className="h-5 w-5 sm:h-4 sm:w-4" />
                  Mis notas
                  {savedNotes.length > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="ml-1.5 text-xs px-2 py-0.5 bg-primary/20 text-primary border-0"
                    >
                      {savedNotes.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="preview" className="flex-1 overflow-auto m-0 p-6 sm:p-8 focus-visible:outline-none">
              <div className="w-full h-full flex items-center justify-center">
                {isPDF ? (
                  <div className="w-full h-full rounded-2xl overflow-hidden border border-border/50 bg-muted/20 shadow-lg">
                    <iframe
                      src={document.url}
                      className="w-full h-full"
                      style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                      title={document.title}
                    />
                  </div>
                ) : isImage ? (
                  <div className="overflow-auto w-full h-full flex items-center justify-center">
                    <img
                      src={document.url}
                      alt={document.title}
                      className="max-w-full h-auto rounded-2xl shadow-2xl border border-border/50"
                      style={{ transform: `scale(${zoom / 100})` }}
                    />
                  </div>
                ) : (
                  <div className="text-center space-y-6 py-12">
                    <div className="w-24 h-24 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center border border-border/50">
                      <FileText className="h-12 w-12 text-muted-foreground/70" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-xl">Vista previa no disponible</p>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        Este tipo de archivo no puede previsualizarse en el navegador
                      </p>
                    </div>
                    <Button size="lg" asChild className="h-12 px-6 text-base font-medium">
                      <a href={document.url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-5 w-5 mr-2" />
                        Descargar archivo
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="flex-1 overflow-auto m-0 p-6 sm:p-8 focus-visible:outline-none">
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Add New Note - Premium Design */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <StickyNote className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-lg font-bold">Agregar nota médica</h3>
                      <p className="text-sm text-muted-foreground">Registra observaciones, diagnósticos o seguimiento</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 border-2 border-dashed border-border/50 rounded-2xl p-6 sm:p-5 space-y-4 hover:border-primary/50 transition-colors">
                    <Textarea
                      id="note"
                      placeholder="Escribe aquí tus observaciones profesionales sobre este documento&#10;&#10;Ejemplo: Resultados muestran mejoría en... / Se recomienda seguimiento... / Hallazgos relevantes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[160px] resize-none text-base sm:text-sm bg-background/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl"
                    />
                    <Button 
                      onClick={handleSaveNote} 
                      disabled={isSaving || !notes.trim()}
                      size="lg"
                      className="w-full h-12 sm:h-11 text-base sm:text-sm font-semibold shadow-sm"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 mr-2 animate-spin" />
                          Guardando nota...
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                          Guardar nota médica
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Saved Notes */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <h3 className="font-bold text-lg sm:text-base text-muted-foreground">
                      Historial de notas
                    </h3>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  
                  {isLoadingNotes ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="h-10 w-10 animate-spin text-muted-foreground/50" />
                    </div>
                  ) : savedNotes.length === 0 ? (
                    <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-border/50">
                      <div className="w-20 h-20 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                        <StickyNote className="h-10 w-10 text-muted-foreground/50" />
                      </div>
                      <p className="font-medium text-base sm:text-sm text-muted-foreground">
                        Aún no hay notas médicas registradas
                      </p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        Las notas que agregues aparecerán aquí
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {savedNotes.map((note: any, index: number) => {
                        const doctorProfile = note.doctor_profiles
                        const doctorName = doctorProfile?.profiles 
                          ? `${doctorProfile.profiles.first_name || ''} ${doctorProfile.profiles.last_name || ''}`.trim() || 'Doctor'
                          : 'Doctor'
                        const doctorInitials = doctorName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                        
                        return (
                          <div 
                            key={note.id} 
                            className="group bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 sm:p-4 space-y-4 hover:shadow-lg hover:border-primary/30 transition-all"
                          >
                            {/*button 
                                onClick={() => {
                                  setSelectedDoctor(doctorProfile)
                                  setDoctorSheetOpen(true)
                                }}
                                className="flex-shrink-0 cursor-pointer group/avatar"
                              >
                                <Avatar className="h-12 w-12 border-2 border-primary/20 ring-2 ring-background group-hover/avatar:border-primary/50 transition-all group-hover/avatar:scale-105">
                                  <AvatarImage 
                                    src={doctorProfile?.profiles?.avatar_url} 
                                    alt={doctorName}
                                  />
                                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {doctorInitials}
                                  </AvatarFallback>
                                </Avatar>
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <button
                                    onClick={() => {
                                      setSelectedDoctor(doctorProfile)
                                      setDoctorSheetOpen(true)
                                    }}
                                    className="font-semibold text-base sm:text-sm truncate hover:text-primary transition-colors"
                                  >
                                    {doctorName}
                                  </button
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-base sm:text-sm truncate">{doctorName}</p>
                                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                                    Doctor
                                  </Badge>
                                </div>
                                {doctorProfile?.specialty && (
                                  <p className="text-xs text-muted-foreground">{doctorProfile.specialty}</p>
                                )}
                              </div>

                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-primary">#{savedNotes.length - index}</span>
                              </div>
                            </div>

                            {/* Note Content */}
                            <div className="pl-[60px]">
                              <p className="text-base sm:text-sm whitespace-pre-wrap leading-relaxed">
                                {note.note}
                              </p>
                            </div>

                            {/* Timestamp */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground pl-[60px]">
                              <Calendar className="h-3.5 w-3.5" />
                              <time>
                                {format(new Date(note.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                              </time>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>

      {/* Premium Doctor Profile Sheet */}
      {selectedDoctor && (
        <Sheet open={doctorSheetOpen} onOpenChange={setDoctorSheetOpen}>
          <SheetContent 
            side="bottom" 
            className="h-[85vh] sm:h-auto sm:max-w-2xl sm:mx-auto rounded-t-3xl sm:rounded-2xl border-t-4 border-primary/20 p-0"
          >
            <div className="h-full overflow-auto">
              {/* Premium Header with Gradient */}
              <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 sm:px-8 pt-8 pb-6">
                {/* Drag Handle - Mobile Only */}
                <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full mx-auto mb-6 sm:hidden" />
                
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Large Avatar */}
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-background shadow-2xl ring-4 ring-primary/10">
                      <AvatarImage 
                        src={selectedDoctor?.profiles?.avatar_url} 
                        alt={`${selectedDoctor?.profiles?.first_name || ''} ${selectedDoctor?.profiles?.last_name || ''}`}
                      />
                      <AvatarFallback className="bg-primary/20 text-primary text-3xl font-bold">
                        {`${selectedDoctor?.profiles?.first_name || 'D'} ${selectedDoctor?.profiles?.last_name || ''}`.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-3 border-background shadow-lg">
                      <Stethoscope className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>

                  {/* Doctor Name & Title */}
                  <div className="space-y-2">
                    <SheetTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
                      {`${selectedDoctor?.profiles?.first_name || ''} ${selectedDoctor?.profiles?.last_name || ''}`.trim() || 'Doctor'}
                    </SheetTitle>
                    {selectedDoctor?.specialty && (
                      <SheetDescription className="text-base sm:text-lg font-medium text-foreground/80">
                        {selectedDoctor.specialty}
                      </SheetDescription>
                    )}
                    <Badge 
                      variant="secondary" 
                      className="text-sm font-medium px-4 py-1.5 bg-primary/10 text-primary border-primary/20"
                    >
                      Médico Profesional
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator className="my-0" />

              {/* Information Cards */}
              <div className="px-6 sm:px-8 py-6 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Información Profesional
                </h3>

                <div className="grid gap-3">
                  {/* Professional ID Card */}
                  {selectedDoctor?.professional_id && (
                    <div className="group flex items-center gap-4 p-4 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 hover:shadow-md transition-all">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Cédula Profesional</p>
                        <p className="text-base font-semibold truncate">{selectedDoctor.professional_id}</p>
                      </div>
                    </div>
                  )}

                  {/* Experience Card */}
                  {selectedDoctor?.years_experience && (
                    <div className="group flex items-center gap-4 p-4 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 hover:shadow-md transition-all">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Briefcase className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Años de Experiencia</p>
                        <p className="text-base font-semibold">{selectedDoctor.years_experience} años de práctica médica</p>
                      </div>
                    </div>
                  )}

                  {/* Consultation Fee Card */}
                  {selectedDoctor?.consultation_fee && (
                    <div className="group flex items-center gap-4 p-4 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 hover:shadow-md transition-all">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Tarifa de Consulta</p>
                        <p className="text-base font-semibold">${selectedDoctor.consultation_fee} MXN</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Verification Badge */}
                <div className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Award className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">Profesional Verificado</p>
                      <p className="text-xs text-muted-foreground">Credenciales validadas por HealthPal</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="px-6 sm:px-8 pb-8 pt-2">
                <Button 
                  onClick={() => setDoctorSheetOpen(false)}
                  size="lg"
                  className="w-full h-14 text-base font-semibold rounded-2xl shadow-lg"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </Dialog>
  )
}
