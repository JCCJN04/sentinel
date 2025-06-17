"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Loader2, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
// Importa los servicios que necesitamos
import { documentAnalysisService } from '@/lib/document-analysis-service';
import { documentService } from '@/lib/document-service';

// Define la estructura para un mensaje de chat
interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

// Define la estructura de un documento (ajusta según tu schema)
interface Document {
  id: string;
  name: string;
  category?: string;
  expiry_date?: string;
}

/**
 * Renderiza un botón de asistente de chat de IA flotante y una ventana de chat.
 */
const AIChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'ai', text: 'Bienvenido, soy Sentinel. Estoy aquí para ayudarte.' }
  ]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userDocuments, setUserDocuments] = useState<Document[]>([]); // Estado para guardar los documentos
  const [hasFetchedDocs, setHasFetchedDocs] = useState(false); // Flag para evitar cargas múltiples

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Función para abrir/cerrar la ventana de chat
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Trae los documentos del usuario cuando se abre el chat por primera vez
  useEffect(() => {
    if (isOpen && !hasFetchedDocs) {
      const fetchDocumentsForAI = async () => {
        setIsLoading(true);
        try {
          const docs = await documentService.getDocuments(); // Llama al servicio de documentos
          setUserDocuments(docs);
          setHasFetchedDocs(true); // Marca que los documentos ya se cargaron
          console.log("Documentos cargados para el contexto de la IA:", docs);
        } catch (error) {
          console.error("Error al cargar documentos para la IA:", error);
          setMessages(prev => [...prev, { sender: 'ai', text: 'No pude cargar tus documentos para darte respuestas precisas.' }]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDocumentsForAI();
    }
  }, [isOpen, hasFetchedDocs]);


  // Scroll automático al último mensaje
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Maneja el envío de mensajes
  const sendMessage = async () => {
    const userMessage = currentMessage.trim();
    if (!userMessage || isLoading) return;

    // Añade el mensaje del usuario al chat
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setCurrentMessage('');
    setIsLoading(true);

    // --- Llamada real a la IA ---
    try {
      // Usamos el servicio que creamos, pasándole la pregunta y el contexto de los documentos
      const aiResponseText = await documentAnalysisService.getAIChatResponse(userMessage, userDocuments);
      const aiResponse: ChatMessage = { sender: 'ai', text: aiResponseText };
      setMessages(prev => [...prev, aiResponse]); // Añade la respuesta de la IA
    } catch (error) {
      console.error("Error en la respuesta de la IA:", error);
      const errorResponse: ChatMessage = { sender: 'ai', text: 'Lo siento, tuve un problema al conectar con la IA. Intenta de nuevo.' };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  // Maneja el input del usuario
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMessage(event.target.value);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isLoading) {
      sendMessage();
    }
  };

  return (
    <>
      {/* Botón Flotante */}
      <Button
        onClick={toggleChat}
        variant="default"
        size="icon"
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-transform duration-300 ease-in-out hover:scale-110",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
        aria-label="Abrir chat de asistente IA"
      >
        <Sparkles className="h-6 w-6" />
      </Button>

      {/* Ventana de Chat */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 w-[90vw] max-w-sm h-[70vh] max-h-[600px] bg-background border rounded-lg shadow-xl flex flex-col transition-all duration-300 ease-in-out",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        )}
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/40 rounded-t-lg flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Asistente IA</span>
          </div>
          <Button onClick={toggleChat} variant="ghost" size="icon" className="h-7 w-7" aria-label="Cerrar chat">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Área de Mensajes */}
        <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-background">
          {messages.map((msg, index) => (
            <div key={index} className={cn("flex", msg.sender === 'user' ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm",
                  msg.sender === 'user' ? "bg-primary text-primary-foreground" : "bg-muted")}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2 text-sm shadow-sm inline-flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground italic text-xs">Pensando...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Área de Input */}
        <div className="flex items-center p-3 border-t bg-muted/40 rounded-b-lg flex-shrink-0">
          <Input
            type="text"
            value={currentMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Pregunta sobre tus documentos..."
            className="flex-grow mr-2 bg-background focus-visible:ring-primary"
            disabled={isLoading || (isOpen && !hasFetchedDocs)}
            aria-label="Escribe tu mensaje"
          />
          <Button onClick={sendMessage} disabled={isLoading || !currentMessage.trim()} size="icon" className="flex-shrink-0" aria-label="Enviar mensaje">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default AIChatAssistant;