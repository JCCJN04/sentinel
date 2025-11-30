/**
 * Página: Asistente IA Médico
 * 
 * Interfaz optimizada del chatbot médico con:
 * - Header minimalista que maximiza espacio del chat
 * - Preguntas sugeridas para guiar al usuario
 * - Modal de ayuda con información detallada
 * - Banner dismissible de advertencia
 * - Drawer móvil para resumen de datos médicos
 * - Animaciones suaves y diseño profesional
 */

import { Metadata } from 'next';
import { AssistantPageClient } from '@/components/medical-assistant/assistant-page-client';

export const metadata: Metadata = {
  title: 'Asistente IA Médico | Tu Asistente de Salud',
  description: 'Chatbot inteligente para responder preguntas sobre tu información médica',
};

export default function AsistenteIAPage() {
  return <AssistantPageClient />;
}
