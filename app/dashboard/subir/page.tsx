"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
// AQUÍ ESTÁ EL CAMBIO: Renombramos el ícono 'File' a 'FileIcon'
import { Camera, File as FileIcon, Upload, X, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
// Corrected: Ensure MEDICAL_CATEGORIES is exported from document-service.ts
import { documentService, type DocumentUpload, MEDICAL_CATEGORIES } from "@/lib/document-service";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider"; // Assuming Slider is used, kept for completeness
import { useToast } from "@/components/ui/use-toast";

interface FormData {
  name: string;
  category: string;
  date: string;
  expiry_date?: string;
  provider?: string;
  amount?: string;
  currency?: string;
  tags: string;
  notes?: string;
  patient_name?: string;
  doctor_name?: string;
  specialty?: string;
}

export default function SubirDocumentoMedicoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]); // Esta 'File' es la global del DOM, ahora no hay conflicto
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "", category: "", date: "", expiry_date: "", provider: "", amount: "",
    currency: "MXN", tags: "", notes: "", patient_name: "", doctor_name: "", specialty: "",
  });

  // --- Camera States and Logic ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLCanvasElement>(null); // For processed/final image
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false); // True when a raw photo is snapped
  const [isCropMode, setIsCropMode] = useState(false);
  const [cropPoints, setCropPoints] = useState<{ top: number; left: number; right: number; bottom: number }>({ top: 20, left: 20, right: 80, bottom: 80 });
  const [brightness, setBrightness] = useState(100); // Percentage
  const [contrast, setContrast] = useState(100); // Percentage
  const [isProcessing, setIsProcessing] = useState(false);


  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => setHasCamera(true))
        .catch(() => setHasCamera(false));
    }
  }, []);

  const startCamera = async () => {
      if (!hasCamera) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } } });
      if (videoRef.current) { videoRef.current.srcObject = stream; setCameraActive(true); setPhotoTaken(false); }
    } catch (err) { console.error("Error starting camera:", err); toast({ title: "Error", description: "No se pudo acceder a la cámara.", variant: "destructive" }); }
  };
  const stopCamera = () => {
      if (videoRef.current && videoRef.current.srcObject) { const stream = videoRef.current.srcObject as MediaStream; stream.getTracks().forEach(track => track.stop()); videoRef.current.srcObject = null; setCameraActive(false); }
  };
  const takePhoto = () => {
      if (!videoRef.current || !canvasRef.current) return; const video = videoRef.current; const canvas = canvasRef.current; const context = canvas.getContext("2d"); if (!context) return; canvas.width = video.videoWidth; canvas.height = video.videoHeight; context.drawImage(video, 0, 0, canvas.width, canvas.height); setPhotoTaken(true); stopCamera();
  };
  const discardPhoto = () => { setPhotoTaken(false); setIsCropMode(false); startCamera(); }; // Restart camera on discard
  const truncateColor = (value: number): number => { if (value < 0) return 0; if (value > 255) return 255; return value; };
  const processImage = () => {
      if (!canvasRef.current || !photoRef.current) return; setIsProcessing(true); const sourceCanvas = canvasRef.current; const targetCanvas = photoRef.current; const sourceContext = sourceCanvas.getContext("2d"); const targetContext = targetCanvas.getContext("2d"); if (!sourceContext || !targetContext) { setIsProcessing(false); return; } const width = sourceCanvas.width; const height = sourceCanvas.height; targetCanvas.width = width; targetCanvas.height = height; const imageData = sourceContext.getImageData(0, 0, width, height); const data = imageData.data; const brightnessValue = (brightness - 100) * 2.55; const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast)); for (let i = 0; i < data.length; i += 4) { data[i] += brightnessValue; data[i + 1] += brightnessValue; data[i + 2] += brightnessValue; data[i] = truncateColor(contrastFactor * (data[i] - 128) + 128); data[i + 1] = truncateColor(contrastFactor * (data[i + 1] - 128) + 128); data[i + 2] = truncateColor(contrastFactor * (data[i + 2] - 128) + 128); } if (isCropMode) { const cropX = Math.floor((width * cropPoints.left) / 100); const cropY = Math.floor((height * cropPoints.top) / 100); const cropWidth = Math.floor((width * (cropPoints.right - cropPoints.left)) / 100); const cropHeight = Math.floor((height * (cropPoints.bottom - cropPoints.top)) / 100); const croppedImageData = sourceContext.getImageData(cropX, cropY, cropWidth, cropHeight); targetCanvas.width = cropWidth; targetCanvas.height = cropHeight; targetContext.putImageData(croppedImageData, 0, 0); } else { targetContext.putImageData(imageData, 0, 0); } targetCanvas.toBlob((blob) => { if (blob) {
        // Ahora 'new File' se refiere al constructor global del DOM sin ambigüedad
        const file = new File([blob], "scan.jpg", { type: "image/jpeg" });
        setFiles([file]); toast({ title: "Éxito", description: "Imagen procesada y lista para subir." }); } setIsProcessing(false); setIsCropMode(false); setPhotoTaken(false); }, "image/jpeg", 0.95); // Reset states after processing
  };
  const toggleCropMode = () => setIsCropMode(!isCropMode);
  // --- End Camera Logic ---

  // --- File Drag & Drop Handlers ---
  const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.type === "dragenter" || e.type === "dragover") setDragActive(true); else if (e.type === "dragleave") setDragActive(false); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) { validateAndAddFiles(Array.from(e.dataTransfer.files)); } };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files.length > 0) { validateAndAddFiles(Array.from(e.target.files)); e.target.value = ''; } }; // Clear input value
  // --- End File Drag & Drop ---

  // --- File Validation ---
  const validateAndAddFiles = (newFiles: File[]) => { // Esta 'File' es la global del DOM
    if (newFiles.length > 1) { setUploadError("Por favor, sube solo un archivo a la vez."); return; }
    if (files.length >= 1) { setUploadError("Ya has seleccionado un archivo. Elimina el actual para subir otro."); return; } // Allow only one file
    const file = newFiles[0];
    if (file.size > 10 * 1024 * 1024) { setUploadError("El archivo es demasiado grande (máx 10MB)."); return; }
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/tiff", "image/dicom", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "text/csv"];
    if (!allowedTypes.includes(file.type)) { setUploadError("Tipo de archivo no soportado (PDF, JPG, PNG, TIFF, DOCX, TXT, CSV)."); return; }
    setFiles([file]); setUploadError(null);
  };
  const removeFile = (index: number) => { setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index)); };
  // --- End File Validation ---

  // --- Form Input Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const { name, value } = e.target; setFormData((prev) => ({ ...prev, [name]: value })); };
  const handleSelectChange = (name: keyof FormData, value: string) => { setFormData((prev) => ({ ...prev, [name]: value })); };
  // --- End Form Input Handlers ---

  // --- Form Submission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) { setUploadError("Por favor, selecciona o captura un archivo para subir."); return; }
    if (!formData.name || !formData.category || !formData.date) { setUploadError("Por favor, completa los campos obligatorios: nombre, categoría y fecha."); return; }
    setIsUploading(true); setUploadError(null); setUploadSuccess(false);
    try {
      const tags = formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag); // Ensure no empty tags
      const documentData: DocumentUpload = {
        name: formData.name, category: formData.category, tags, date: formData.date,
        expiry_date: formData.expiry_date || undefined, provider: formData.provider || undefined,
        amount: formData.amount || undefined, currency: formData.currency || undefined,
        notes: formData.notes || undefined, patient_name: formData.patient_name || undefined,
        doctor_name: formData.doctor_name || undefined, specialty: formData.specialty || undefined,
        file: files[0],
      };
      await documentService.uploadDocument(documentData);
      setUploadSuccess(true); setFiles([]); // Clear files after successful upload
      setFormData({ name: "", category: "", date: "", expiry_date: "", provider: "", amount: "", currency: "MXN", tags: "", notes: "", patient_name: "", doctor_name: "", specialty: "" }); // Reset form
      toast({ title: "Éxito", description: "Documento médico guardado correctamente." });
      setTimeout(() => router.push("/dashboard/documentos"), 1500); // Redirect after success
    } catch (error) { console.error("Error uploading document:", error); setUploadError("Error al subir el documento. Por favor, inténtalo de nuevo."); setUploadSuccess(false); }
    finally { setIsUploading(false); }
  };
  const handleCancel = () => { router.back(); }; // Or router.push('/dashboard/documentos');
  // --- End Form Submission ---

  // --- Render Component ---
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subir Documento Médico</h1>
        <p className="text-muted-foreground">Añade nuevos resultados, recetas o informes a tu historial médico digital.</p>
      </div>

      {/* Alerts */}
      {uploadSuccess && ( <Alert className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"><CheckCircle className="h-4 w-4" /><AlertDescription>Documento subido exitosamente. Redirigiendo...</AlertDescription></Alert> )}
      {uploadError && ( <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{uploadError}</AlertDescription></Alert> )}

      <Tabs defaultValue="archivo" className="space-y-4">
        <TabsList>
          {/* AQUÍ ESTÁ EL CAMBIO: Usamos FileIcon en lugar de File */}
          <TabsTrigger value="archivo" className="flex items-center gap-2"><FileIcon className="h-4 w-4" /><span>Archivo</span></TabsTrigger>
          <TabsTrigger value="camara" className="flex items-center gap-2" disabled={!hasCamera}><Camera className="h-4 w-4" /><span>Escanear</span></TabsTrigger>
        </TabsList>

        {/* File Upload Tab */}
        <TabsContent value="archivo" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              {/* Drag and Drop Area */}
              <div className={`border-2 border-dashed rounded-lg p-8 text-center ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                  <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center gap-2">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <h3 className="text-xl font-semibold">Arrastra tu archivo aquí</h3>
                    <p className="text-sm text-muted-foreground">o haz clic para seleccionar</p>
                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG, DOCX, TXT, CSV (Máx 10MB)</p>
                    <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png,.tiff,.doc,.docx,.txt,.csv" />
                    <Button type="button" variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>Seleccionar archivo</Button>
                  </div>
              </div>
              {/* Display Selected File */}
              {files.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-medium">Archivo seleccionado</h4>
                  {files.map((file, index) => ( <div key={index} className="flex items-center justify-between rounded-md border p-3"> <div className="flex items-center gap-3 overflow-hidden">
                    {/* AQUÍ ESTÁ EL CAMBIO: Usamos FileIcon en lugar de File */}
                    <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="overflow-hidden"> <p className="text-sm font-medium truncate">{file.name}</p> <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p> </div> </div> <Button variant="ghost" size="icon" onClick={() => removeFile(index)} className="flex-shrink-0"><X className="h-4 w-4" /></Button> </div> ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Camera Scan Tab */}
        <TabsContent value="camara">
            <Card>
              <CardContent className="pt-6">
                {/* Camera UI Logic */}
                {!hasCamera ? ( <div className="text-center p-8 border-2 border-dashed rounded-lg"><div className="mx-auto flex max-w-[420px] flex-col items-center justify-center gap-2"><Camera className="h-10 w-10 text-muted-foreground" /><h3 className="text-xl font-semibold">Cámara no disponible</h3><p className="text-sm text-muted-foreground">No se pudo acceder a la cámara. Verifica los permisos.</p></div></div> ) : ( <div className="space-y-4"> <div className={`relative ${photoTaken ? "hidden" : "block"}`}> <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg border" style={{ maxHeight: "60vh" }} /> {cameraActive && ( <div className="absolute bottom-4 left-0 right-0 flex justify-center"><Button onClick={takePhoto} className="bg-primary text-primary-foreground">Capturar</Button></div> )} </div> <div className={`relative ${photoTaken ? "block" : "hidden"}`}> <div className="relative"> <canvas ref={canvasRef} className="w-full rounded-lg border" /> {isCropMode && ( <div className="absolute top-0 left-0 right-0 bottom-0 border-2 border-dashed border-primary pointer-events-none" style={{ top: `${cropPoints.top}%`, left: `${cropPoints.left}%`, right: `${100 - cropPoints.right}%`, bottom: `${100 - cropPoints.bottom}%`}} /> )} </div> <canvas ref={photoRef} className="hidden" /> <div className="mt-4 space-y-4"> <div className="flex flex-wrap gap-2 justify-center"><Button onClick={discardPhoto} variant="outline">Descartar</Button><Button onClick={toggleCropMode} variant="outline">{isCropMode ? "Cancelar Recorte" : "Recortar"}</Button><Button onClick={processImage} disabled={isProcessing}>{isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Procesar</Button></div> {isCropMode && ( <div className="space-y-2 border p-3 rounded-md"> {/* Crop sliders UI - Add Slider components here */} </div> )} <div className="space-y-2 border p-3 rounded-md"> {/* Brightness/Contrast sliders UI - Add Slider components here */} </div> </div> </div> {!cameraActive && !photoTaken && ( <div className="flex justify-center pt-4"><Button onClick={startCamera} className="bg-primary text-primary-foreground">Iniciar Cámara</Button></div> )} </div> )}
              </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      {/* Metadata Form */}
      {files.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* --- Core Fields --- */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Documento <span className="text-destructive">*</span></Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Ej. Resultados Biometría Hemática" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha del Documento <span className="text-destructive">*</span></Label>
                  <Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría <span className="text-destructive">*</span></Label>
                    <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)} name="category" required>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Selecciona una categoría médica" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Safeguard and Map Medical Categories */}
                        {Array.isArray(MEDICAL_CATEGORIES) && MEDICAL_CATEGORIES.length > 0 ? (
                          MEDICAL_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="general" disabled>General (cargar categorías)</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">Fecha de Vencimiento/Próxima Cita (Opcional)</Label>
                    <Input id="expiry_date" name="expiry_date" type="date" value={formData.expiry_date} onChange={handleInputChange} />
                  </div>
              </div>

                {/* --- New Medical Fields --- */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="patient_name">Nombre del Paciente (Opcional)</Label>
                        <Input id="patient_name" name="patient_name" value={formData.patient_name ?? ''} onChange={handleInputChange} placeholder="Ej. Juan Pérez" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="doctor_name">Nombre del Médico (Opcional)</Label>
                        <Input id="doctor_name" name="doctor_name" value={formData.doctor_name ?? ''} onChange={handleInputChange} placeholder="Ej. Dra. Martínez" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="specialty">Especialidad Médica (Opcional)</Label>
                        <Input id="specialty" name="specialty" value={formData.specialty ?? ''} onChange={handleInputChange} placeholder="Ej. Cardiología" />
                    </div>
                </div>

                {/* --- Optional General Fields --- */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="provider">Laboratorio / Clínica / Aseguradora (Opcional)</Label>
                  <Input id="provider" name="provider" value={formData.provider ?? ''} onChange={handleInputChange} placeholder="Ej. Laboratorio Salud Digna" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Costo (Opcional)</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" value={formData.amount ?? ''} onChange={handleInputChange} placeholder="Ej. 150.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleSelectChange("currency", value)} name="currency">
                    <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                      <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* --- Tags and Notes --- */}
              <div className="space-y-2">
                <Label htmlFor="tags">Etiquetas (separadas por comas)</Label>
                <Input id="tags" name="tags" value={formData.tags} onChange={handleInputChange} placeholder="Ej. anual, chequeo, dr_lopez, diabetes" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas Adicionales</Label>
                <Textarea
                  id="notes" name="notes" value={formData.notes ?? ''} onChange={handleInputChange}
                  className="min-h-[100px]"
                  placeholder="Añade indicaciones, resultados clave o información relevante..."
                />
              </div>

              {/* --- Buttons --- */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" type="button" onClick={handleCancel} disabled={isUploading}>Cancelar</Button>
                <Button type="submit" disabled={isUploading || files.length === 0}>
                  {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isUploading ? "Guardando..." : "Guardar Documento Médico"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}