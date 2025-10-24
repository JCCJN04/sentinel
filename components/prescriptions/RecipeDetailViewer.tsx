'use client';

import { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MedicationDetailItem } from './MedicationDetailItem';
import Image from 'next/image';

interface PrescriptionMedicine {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency_hours: number | null;
  duration: number | null;
  instructions: string | null;
}

interface RecipeDetailViewerProps {
  prescription: {
    id: string;
    diagnosis: string;
    doctor_name: string | null;
    start_date: string;
    end_date: string | null;
    notes: string | null;
    attachment_url: string | null;
    prescription_medicines: PrescriptionMedicine[];
  };
}

export function RecipeDetailViewer({ prescription }: RecipeDetailViewerProps) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [imageError, setImageError] = useState(false);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  return (
    <div className="w-full">
      {/* Si no hay imagen, solo muestra los datos extraídos */}
      {!prescription.attachment_url ? (
        <DataView prescription={prescription} />
      ) : (
        /* Si hay imagen, muestra tabs para cambiar entre vista de datos e imagen */
        <Tabs defaultValue="data" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="data" className="flex items-center gap-2">
              <span>📋 Datos Extraídos</span>
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-2">
              <span>🖼️ Imagen Original</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="space-y-4">
            <DataView prescription={prescription} />
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <ImageView
              imageUrl={prescription.attachment_url}
              zoomLevel={zoomLevel}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onResetZoom={handleResetZoom}
              imageError={imageError}
              setImageError={setImageError}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function DataView({ prescription }: { prescription: RecipeDetailViewerProps['prescription'] }) {
  return (
    <div className="space-y-6">
      {/* Encabezado con diagnóstico */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{prescription.diagnosis}</h1>
        <p className="text-lg text-muted-foreground mb-4">
          Recetado por: <strong>{prescription.doctor_name || 'No especificado'}</strong>
        </p>

        <div className="flex flex-wrap gap-4 mb-6">
          <Badge variant="secondary">
            Inicio: {new Date(prescription.start_date).toLocaleDateString()}
          </Badge>
          {prescription.end_date && (
            <Badge variant="secondary">
              Fin: {new Date(prescription.end_date).toLocaleDateString()}
            </Badge>
          )}
        </div>
      </div>

      {/* Notas del médico */}
      {prescription.notes && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Notas del Médico</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">{prescription.notes}</p>
        </div>
      )}

      {/* Medicamentos */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Medicamentos Recetados</h2>
        <div className="space-y-4">
          {prescription.prescription_medicines && prescription.prescription_medicines.length > 0 ? (
            prescription.prescription_medicines.map((med: PrescriptionMedicine) => (
              <MedicationDetailItem key={med.id} med={med} />
            ))
          ) : (
            <p className="text-muted-foreground">
              No hay medicamentos especificados para esta receta.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface ImageViewProps {
  imageUrl: string;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  imageError: boolean;
  setImageError: (error: boolean) => void;
}

function ImageView({
  imageUrl,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  imageError,
  setImageError,
}: ImageViewProps) {
  return (
    <div className="space-y-4">
      {/* Controles de zoom */}
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg flex-wrap">
        <button
          onClick={onZoomOut}
          className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition"
          title="Alejar (Ctrl + Scroll)"
        >
          🔍−
        </button>

        <span className="px-3 py-1 font-semibold min-w-[60px] text-center">
          {zoomLevel}%
        </span>

        <button
          onClick={onZoomIn}
          className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition"
          title="Acercar (Ctrl + Scroll)"
        >
          🔍+
        </button>

        <div className="h-6 border-l border-border mx-2"></div>

        <button
          onClick={onResetZoom}
          className="px-3 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition"
          title="Zoom normal"
        >
          Reset
        </button>

        <p className="text-sm text-muted-foreground ml-auto">
          💡 Usa Ctrl+Scroll para zoom rápido
        </p>
      </div>

      {/* Contenedor de imagen con zoom */}
      <div className="relative bg-muted rounded-lg overflow-auto max-h-[600px] flex items-center justify-center p-4 border border-border">
        {imageError ? (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="text-6xl">❌</div>
            <p className="text-muted-foreground text-center">
              No se pudo cargar la imagen de la receta original.
            </p>
            <p className="text-sm text-muted-foreground">
              URL: <code className="bg-background p-1 rounded text-xs">{imageUrl}</code>
            </p>
          </div>
        ) : (
          <div
            className="relative transition-transform duration-200"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'center center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Receta Original"
              className="max-w-full h-auto rounded shadow-lg"
              onError={() => setImageError(true)}
              onWheel={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  e.preventDefault();
                  if (e.deltaY < 0) {
                    onZoomIn();
                  } else {
                    onZoomOut();
                  }
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Info de la imagen */}
      <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
        <p>📌 Imagen original cargada desde: {new URL(imageUrl).pathname.split('/').slice(-3).join('/')}</p>
      </div>
    </div>
  );
}
