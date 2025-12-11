/**
 * Componente: Medical Chat Interface
 * 
 * Interfaz de usuario para el Asistente IA Médico
 * Permite al paciente chatear sobre su información médica
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { MarkdownMessage } from './markdown-message';
import type { ChatMessage } from '@/types/medical-assistant';

export function MedicalChatInterface() {
  const { session } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Preguntas rápidas como pills
  const quickQuestions = [
    '¿Qué dice mi último estudio?',
    '¿Tengo alergias registradas?',
    'Explícame mis medicamentos actuales',
    '¿Cuándo fue mi última vacuna?',
    'Resumen de mi información de salud',
  ];

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  // Mensaje de bienvenida inicial
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: '¡Hola! Soy tu Asistente IA Médico. Puedo ayudarte a entender tu información médica, explicar resultados de estudios, recordar tus medicamentos y responder preguntas sobre tu salud. ¿En qué puedo ayudarte hoy?',
        timestamp: new Date(),
      }]);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Ocultar pills después del primer mensaje
    setShowQuickQuestions(false);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    // Agregar mensaje del usuario a la interfaz
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setError(null);
    setIsLoading(true);

    try {
      // Obtener token de autenticación
      const token = session?.access_token;
      if (!token) {
        throw new Error('No estás autenticado. Por favor inicia sesión.');
      }

      // Enviar petición al API
      const response = await fetch('/api/ai/medical-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar tu pregunta');
      }

      // Agregar respuesta del asistente
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(data.timestamp),
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Ocurrió un error al enviar tu mensaje. Por favor, intenta de nuevo.';
      
      setError(errorMessage);
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
      // Devolver foco al textarea
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
      {/* Área de mensajes */}
      <ScrollArea className="flex-1 p-3 sm:p-6" ref={scrollAreaRef}>
        <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 sm:gap-4 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/10 shadow-sm">
                  <Bot className="h-5 w-5 sm:h-5 sm:w-5 text-primary" />
                </div>
              )}
              
              <div className={`group max-w-[85%] sm:max-w-[75%] ${
                message.role === 'user' 
                  ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20' 
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md'
              } rounded-2xl px-4 py-3 sm:px-5 sm:py-4 transition-all hover:shadow-xl ${
                message.role === 'user' ? 'rounded-tr-md' : 'rounded-tl-md'
              }`}>
                {/* Contenido del mensaje con markdown */}
                <MarkdownMessage 
                  content={message.content} 
                  isUser={message.role === 'user'} 
                />
                
                {/* Timestamp con estilo mejorado */}
                <div className={`flex items-center gap-1.5 mt-2 pt-2 border-t ${
                  message.role === 'user' 
                    ? 'border-primary-foreground/10' 
                    : 'border-gray-200 dark:border-gray-800'
                }`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${
                    message.role === 'user' 
                      ? 'bg-primary-foreground/40' 
                      : 'bg-primary/60'
                  }`}></div>
                  <p className={`text-[10px] sm:text-xs font-medium ${
                    message.role === 'user' 
                      ? 'text-primary-foreground/70' 
                      : 'text-muted-foreground'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center ring-2 ring-primary/20 shadow-lg shadow-primary/20">
                  <User className="h-5 w-5 sm:h-5 sm:w-5 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* Indicador de escritura mejorado */}
          {isLoading && (
            <div className="flex gap-3 sm:gap-4 justify-start">
              <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/10 shadow-sm animate-pulse">
                <Bot className="h-5 w-5 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl rounded-tl-md px-5 py-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2.5 h-2.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                    Analizando tu consulta...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Área de input */}
      <div className="border-t bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm p-3 sm:p-4">
        <div className="max-w-4xl mx-auto space-y-2.5 sm:space-y-3">
          {/* Preguntas rápidas como pills */}
          {showQuickQuestions && messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 pb-1">
              {quickQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputMessage(question);
                    textareaRef.current?.focus();
                  }}
                  disabled={isLoading}
                  className="group inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 border border-primary/20 hover:border-primary/40 rounded-full text-xs sm:text-sm text-primary font-medium transition-all hover:scale-105 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:animate-pulse" />
                  <span>{question}</span>
                </button>
              ))}
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <Alert variant="destructive" className="py-2.5 shadow-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs sm:text-sm font-medium">{error}</AlertDescription>
            </Alert>
          )}

          {/* Input y botón de envío */}
          <div className="flex gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta médica aquí..."
                className="min-h-[48px] sm:min-h-[56px] max-h-[120px] resize-none pr-11 text-sm sm:text-base rounded-2xl border-2 focus:border-primary/40 shadow-sm focus:shadow-md transition-all"
                disabled={isLoading}
              />
              {!inputMessage.trim() && (
                <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground/30" />
              )}
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="icon"
              className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl shadow-lg hover:shadow-xl bg-gradient-to-br from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
              ) : (
                <Send className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </Button>
          </div>

          {/* Disclaimer mejorado */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <div className="h-1 w-1 rounded-full bg-muted-foreground/30"></div>
            <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
              <span className="hidden sm:inline">Información educativa basada en tus datos. </span>
              Consulta siempre con un profesional de la salud.
            </p>
            <div className="h-1 w-1 rounded-full bg-muted-foreground/30"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
