/**
 * Componente: Assistant Page Client
 * 
 * Cliente principal de la página del Asistente IA con:
 * - Header minimalista y optimizado
 * - Modal de ayuda informativa
 * - Banner dismissible de advertencia
 * - Drawer móvil para datos médicos
 * - Maximización del espacio del chat
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  HelpCircle, 
  X, 
  AlertTriangle, 
  Shield, 
  FileText, 
  Database,
  Sparkles
} from 'lucide-react';
import { MedicalChatInterface } from './medical-chat-interface';
import { MedicalDataSummary } from './medical-data-summary';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const STORAGE_KEY_BANNER = 'medical-assistant-banner-dismissed';

export function AssistantPageClient() {
  const [showBanner, setShowBanner] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar móvil y cargar preferencia del banner
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Verificar si el banner fue cerrado previamente
    const bannerDismissed = localStorage.getItem(STORAGE_KEY_BANNER) === 'true';
    setShowBanner(!bannerDismissed);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem(STORAGE_KEY_BANNER, 'true');
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header Minimalista */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-shrink-0 bg-gradient-to-r from-primary/5 via-primary/3 to-background border-b px-3 sm:px-6 py-3 sm:py-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Título y descripción */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 backdrop-blur-sm">
                <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">
                  Asistente IA Médico
                </h1>
                <Badge variant="secondary" className="text-xs">Beta</Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                Consulta tu información de salud de forma inteligente
              </p>
            </div>
          </div>

          {/* Acciones del header */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Botón de ayuda */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                  <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <Shield className="h-5 w-5 text-primary" />
                    ¿Cómo funciona el Asistente IA?
                  </DialogTitle>
                  <DialogDescription>
                    Información sobre capacidades, datos consultados y limitaciones
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                  {/* Capacidades */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
                        <Sparkles className="h-4 w-4 text-green-600" />
                      </div>
                      <h3 className="font-semibold">Mis Capacidades</h3>
                    </div>
                    <ul className="space-y-2 ml-10 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Explicar resultados de estudios médicos y análisis</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Responder preguntas sobre tus documentos médicos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Recordar medicamentos, dosis y horarios de tratamiento</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Explicar terminología médica de forma comprensible</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Consultar información sobre alergias y vacunas</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Revisar antecedentes personales y familiares</span>
                      </li>
                    </ul>
                  </div>

                  {/* Información consultada */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
                        <Database className="h-4 w-4 text-blue-600" />
                      </div>
                      <h3 className="font-semibold">Información que Consulto</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2 ml-10">
                      {[
                        'Documentos médicos',
                        'Recetas activas',
                        'Alergias registradas',
                        'Historial de vacunación',
                        'Antecedentes personales',
                        'Antecedentes familiares',
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-sm">
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          <span className="text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Advertencia */}
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                          Importante: No sustituyo a un médico
                        </h4>
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          Soy una herramienta educativa diseñada para ayudarte a entender tu 
                          información médica. No puedo hacer diagnósticos, prescribir tratamientos 
                          ni tomar decisiones médicas. Siempre consulta con un profesional de la 
                          salud para decisiones importantes.
                        </p>
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mt-2">
                          En caso de emergencia, llama al 911 o acude al hospital más cercano.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Banner de advertencia dismissible */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800"
          >
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200">
                    <span className="font-semibold">Herramienta educativa:</span> No realiza diagnósticos. 
                    <span className="hidden sm:inline"> Consulta a un profesional de salud para decisiones médicas.</span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={dismissBanner}
                  className="h-6 w-6 sm:h-7 sm:w-7 hover:bg-amber-200 dark:hover:bg-amber-900 flex-shrink-0"
                  aria-label="Cerrar banner"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 text-amber-800 dark:text-amber-200" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenedor principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Datos Médicos - Arriba del chat */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex-shrink-0 px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 lg:pt-6 pb-2 sm:pb-3"
        >
          <MedicalDataSummary />
        </motion.div>

        {/* Chat - Ocupa el espacio restante */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex-1 flex flex-col min-w-0 overflow-hidden"
        >
          <Card className="flex-1 flex flex-col mx-2 sm:mx-4 lg:mx-6 mb-2 sm:mb-4 lg:mb-6 shadow-lg border-2 overflow-hidden">
            <MedicalChatInterface />
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
