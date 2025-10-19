"use client";

import { useState, useRef } from "react";
import { Camera, Upload, X, Check, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { extractPrescriptionDataFromImage } from "@/lib/actions/ocr.actions";

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

  // Procesar imagen con OCR usando API de Mistral
  const processRecipeImage = async () => {
    if (!capturedPhoto) return;

    setIsProcessing(true);
    try {
      const data = await extractPrescriptionDataFromImage(capturedPhoto);
      
      setExtractedData(data);
      if (onDataExtracted) onDataExtracted(data);
    } catch (error) {
      console.error("Error al procesar imagen:", error);
      setExtractedData({
        diagnosis: "",
        doctor_name: "",
        medicines: [],
        prescription_date: new Date().toISOString().split("T")[0],
        additional_notes: "Error al procesar la imagen. Por favor, verifica la calidad o intenta de nuevo.",
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
        <DialogContent className="max-w-2xl">
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
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={processRecipeImage}
                    disabled={isProcessing}
                    className="gap-2"
                  >
                    {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isProcessing ? "Procesando..." : "Extraer Datos"}
                  </Button>
                  <Button onClick={resetCapture} variant="outline">
                    <X className="h-4 w-4" />
                    Nueva foto
                  </Button>
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
                            <ul className="space-y-1 mt-2">
                              {extractedData.medicines.map((med: any, idx: number) => (
                                <li key={idx} className="text-emerald-900 dark:text-emerald-100 text-xs">
                                  • <strong>{med.medicine_name}</strong> - {med.dosage}
                                  {med.frequency_hours && ` c/${med.frequency_hours}h`}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-emerald-700 dark:text-emerald-400 italic text-xs mt-1">
                              No se encontraron medicamentos
                            </p>
                          )}
                        </div>

                        {extractedData.prescription_date && (
                          <div>
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase">
                              Fecha
                            </p>
                            <p className="text-emerald-900 dark:text-emerald-100 text-xs">
                              {new Date(extractedData.prescription_date).toLocaleDateString("es-ES")}
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
