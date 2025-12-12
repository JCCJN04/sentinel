"use client";

import { useState, useRef } from "react";
import { Camera, Upload, X, Check, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface RecipePhotoCapperProps {
  onPhotoCapture?: (base64: string) => void;
  onDataExtracted?: (data: any) => void;
}

export function RecipePhotoCapper({ onPhotoCapture, onDataExtracted }: RecipePhotoCapperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [photoMode, setPhotoMode] = useState<"camera" | "upload" | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const normalizeText = (value: any): string => {
    const collect = (input: any): string[] => {
      if (input === null || input === undefined) return [];
      if (typeof input === 'string') {
        const trimmed = input.trim();
        return trimmed ? [trimmed] : [];
      }
      if (typeof input === 'number' || typeof input === 'boolean') {
        return [String(input)];
      }
      if (Array.isArray(input)) {
        return input.flatMap(item => collect(item));
      }
      if (typeof input === 'object') {
        return Object.values(input).flatMap(item => collect(item));
      }
      return [];
    };

    return collect(value).join('. ');
  };
  const toNumericValue = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    if (typeof value === 'string') {
      const match = value.match(/\d+(?:[\.,]\d+)?/);
      return match ? Number(match[0].replace(',', '.')) : null;
    }
    return null;
  };
  const extractedGeneralNotes = normalizeText(extractedData?.additional_notes);

  // Iniciar cámara
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Cámara trasera en móvil
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setPhotoMode("camera");
    } catch (error) {
      console.error("Error al acceder a la cámara:", error);
      alert("No se pudo acceder a la cámara. Por favor, verifica los permisos.");
    }
  };

  // Capturar foto desde cámara
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const photoData = canvasRef.current.toDataURL("image/jpeg");
        setCapturedPhoto(photoData);
        if (onPhotoCapture) onPhotoCapture(photoData);
        stopCamera();
        setPhotoMode(null);
      }
    }
  };

  // Detener cámara
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Manejar carga de archivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const photoData = event.target?.result as string;
        setCapturedPhoto(photoData);
        if (onPhotoCapture) onPhotoCapture(photoData);
        setPhotoMode(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Procesar imagen con API de análisis segura (server-side)
  const processRecipeImage = async () => {
    if (!capturedPhoto) return;

    setIsProcessing(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Debes iniciar sesión para analizar recetas");
        setIsProcessing(false);
        return;
      }

      // Llamar a API route segura (server-side)
      const response = await fetch('/api/ai/analyze-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          base64Image: capturedPhoto,
          imageType: 'image/jpeg',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al analizar receta');
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error('Respuesta inválida del servidor');
      }

      const data = result.data;
      
      setExtractedData(data);
      if (onDataExtracted) onDataExtracted(data);
      
      toast.success(`Receta analizada con ${(data.confidence * 100).toFixed(0)}% de confianza`);
    } catch (error: any) {
      console.error("Error al procesar imagen:", error);
      toast.error(error.message || "Error al analizar la receta. Intenta con otra imagen.");
      setExtractedData({
        diagnosis: "",
        doctor_name: "",
        medicines: [],
        prescription_date: new Date().toISOString().split("T")[0],
        end_date: null,
        additional_notes: "Error al procesar la imagen. Por favor, verifica la calidad o intenta de nuevo.",
        confidence: 0,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCapture = () => {
    setCapturedPhoto(null);
    setExtractedData(null);
    setPhotoMode(null);
    stopCamera();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Capturar Receta Médica</DialogTitle>
          </DialogHeader>

          {!capturedPhoto && !photoMode && (
            <div className="grid grid-cols-2 gap-4 py-6">
              <Button
                onClick={() => startCamera()}
                className="h-32 flex flex-col gap-2"
                variant="outline"
              >
                <Camera className="h-8 w-8" />
                <span>Tomar Foto</span>
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="h-32 flex flex-col gap-2"
                variant="outline"
              >
                <Upload className="h-8 w-8" />
                <span>Subir Imagen</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {photoMode === "camera" && (
            <div className="space-y-4 py-6">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg bg-black"
              />
              <div className="flex gap-2 justify-center">
                <Button onClick={capturePhoto} className="gap-2">
                  <Camera className="h-4 w-4" />
                  Capturar
                </Button>
                <Button
                  onClick={() => {
                    stopCamera();
                    setPhotoMode(null);
                  }}
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {capturedPhoto && (
            <div className="space-y-4 py-6">
              <img src={capturedPhoto} alt="Receta capturada" className="w-full rounded-lg" />

              {!extractedData && (
                <div className="space-y-3">
                  <Button
                    onClick={processRecipeImage}
                    disabled={isProcessing}
                    className="w-full gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analizando con IA...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        Extraer Datos con IA
                      </>
                    )}
                  </Button>
                  <div className="flex gap-2">
                    <Button onClick={resetCapture} variant="outline" className="flex-1">
                      <X className="h-4 w-4" />
                      Nueva foto
                    </Button>
                  </div>
                  {isProcessing && (
                    <div className="text-center text-xs text-muted-foreground">
                      Gemini 2.5 Flash está analizando tu receta...
                    </div>
                  )}
                </div>
              )}

              {extractedData && (
                <div className="space-y-4">
                  {extractedData.additional_notes?.includes("Error") ? (
                    <div className="space-y-4 bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-semibold">Error al procesar</span>
                      </div>
                      <p className="text-sm text-red-800 dark:text-red-200">
                        {extractedData.additional_notes}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => processRecipeImage()}
                          disabled={isProcessing}
                          className="flex-1 gap-2"
                        >
                          {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                          Reintentar
                        </Button>
                        <Button onClick={resetCapture} variant="outline" className="flex-1">
                          <X className="h-4 w-4 mr-2" />
                          Nueva foto
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                        <Check className="h-5 w-5" />
                        <span className="font-semibold">Datos extraídos correctamente</span>
                      </div>
                      
                      <div className="space-y-3 text-sm">
                        {extractedData.diagnosis && (
                          <div>
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase">
                              Diagnóstico
                            </p>
                            <p className="text-emerald-900 dark:text-emerald-100 font-medium">
                              {extractedData.diagnosis}
                            </p>
                          </div>
                        )}
                        
                        {extractedData.doctor_name && (
                          <div>
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase">
                              Médico
                            </p>
                            <p className="text-emerald-900 dark:text-emerald-100">
                              {extractedData.doctor_name}
                            </p>
                          </div>
                        )}
                        
                        <div>
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase">
                            Medicamentos detectados ({extractedData.medicines.length})
                          </p>
                          {extractedData.medicines.length > 0 ? (
                            <ul className="space-y-2 mt-2">
                              {extractedData.medicines.map((med: any, idx: number) => {
                                const instructionText = normalizeText(med.instructions) || 'No especificado';
                                const hasSpecificInstruction = instructionText.toLowerCase() !== 'no especificado';
                                const nameText = normalizeText(med.name || med.medicine_name) || '(sin nombre)';
                                const dosageText = normalizeText(med.dosage);
                                const frequencyValue = toNumericValue(med.frequency_hours ?? med.frequencyHours ?? med.frequency);
                                const durationValue = toNumericValue(med.duration_days ?? med.durationDays ?? med.duration);
                                return (
                                  <li key={idx} className="text-xs p-2 rounded bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800">
                                    <div className="font-semibold text-emerald-900 dark:text-emerald-100">{nameText}</div>
                                    <div className="text-emerald-700 dark:text-emerald-300 mt-1 space-y-1">
                                      {dosageText && <div>• Dosis: {dosageText}</div>}
                                      <div className={frequencyValue ? 'text-emerald-700 dark:text-emerald-300' : 'text-yellow-700 dark:text-yellow-300 font-medium'}>
                                        • Frecuencia: {frequencyValue ? `c/${frequencyValue}h` : '⚠️ No encontrada'}
                                      </div>
                                      <div className={durationValue ? 'text-emerald-700 dark:text-emerald-300' : 'text-yellow-700 dark:text-yellow-300 font-medium'}>
                                        • Duración: {durationValue ? `${durationValue} días` : '⚠️ No encontrada'}
                                      </div>
                                      <div className={hasSpecificInstruction ? 'text-emerald-700 dark:text-emerald-300' : 'text-emerald-600/70 dark:text-emerald-200/70 italic'}>
                                        • Instrucciones: {instructionText}
                                      </div>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p className="text-emerald-700 dark:text-emerald-400 italic text-xs mt-1">
                              No se encontraron medicamentos
                            </p>
                          )}
                        </div>
                        {extractedGeneralNotes && (
                          <div>
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase">
                              Notas generales
                            </p>
                            <p className="text-emerald-900 dark:text-emerald-100 whitespace-pre-wrap leading-relaxed">
                              {extractedGeneralNotes}
                            </p>
                          </div>
                        )}

                        {extractedData.prescription_date && (
                          <div>
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase">
                              Fecha de Inicio
                            </p>
                            <p className="text-emerald-900 dark:text-emerald-100 text-xs">
                              {new Date(extractedData.prescription_date).toLocaleDateString("es-ES")}
                            </p>
                          </div>
                        )}

                        {extractedData.end_date && (
                          <div>
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase">
                              Fecha de Fin/Vencimiento
                            </p>
                            <p className="text-emerald-900 dark:text-emerald-100 text-xs">
                              {new Date(extractedData.end_date).toLocaleDateString("es-ES")}
                            </p>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => {
                          setIsOpen(false);
                          resetCapture();
                        }}
                        className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600"
                      >
                        <Check className="h-4 w-4" />
                        Usar estos datos
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </DialogContent>
      </Dialog>

      <Button onClick={() => setIsOpen(true)} variant="outline" className="gap-2">
        <Camera className="h-4 w-4" />
        Capturar Receta
      </Button>
    </>
  );
}
