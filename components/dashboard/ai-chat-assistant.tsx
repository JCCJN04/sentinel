"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Loader2, Sparkles } from 'lucide-react'; // Using Sparkles for AI feel
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Define the structure for a chat message
interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

/**
 * Renders a floating AI chat assistant button and chat window.
 */
const AIChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'ai', text: 'Hola! ¿Cómo puedo ayudarte hoy con tus documentos médicos?' } // Initial message
  ]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for scrolling to bottom

  // Function to toggle the chat window visibility
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Function to scroll to the bottom of the message area
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Handle changes in the input field
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMessage(event.target.value);
  };

  // Simulate sending a message and getting an AI response
  const sendMessage = async () => {
    const userMessage = currentMessage.trim();
    if (!userMessage || isLoading) return; // Don't send empty or while loading

    // Add user message to the chat
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setCurrentMessage(''); // Clear input
    setIsLoading(true);

    // --- Placeholder for actual AI interaction ---
    // In a real app:
    // 1. Send userMessage and potentially conversation history to your backend/AI service.
    // 2. The backend would fetch relevant document context based on the user's account.
    // 3. Send context + query to an AI model (like Gemini, OpenAI, etc.).
    // 4. Receive the AI's response.
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

    // Placeholder AI response
    const aiResponse: ChatMessage = {
      sender: 'ai',
      text: `Recibí tu pregunta sobre "${userMessage}". Por ahora, solo puedo simular respuestas. En el futuro, podré buscar en tus documentos.`
    };
    // --- End Placeholder ---

    setMessages(prev => [...prev, aiResponse]); // Add AI response
    setIsLoading(false);
  };

  // Handle Enter key press in the input field
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isLoading) {
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <Button
        onClick={toggleChat}
        variant="default" // Or choose another variant like 'secondary' or 'outline'
        size="icon"
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-transform duration-300 ease-in-out hover:scale-110",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100" // Hide button when chat is open
        )}
        aria-label="Abrir chat de asistente IA"
      >
        <Sparkles className="h-6 w-6" />
      </Button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 w-[90vw] max-w-sm h-[70vh] max-h-[600px] bg-background border rounded-lg shadow-xl flex flex-col transition-all duration-300 ease-in-out",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none" // Animation
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/40 rounded-t-lg flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Asistente IA Médico</span>
          </div>
          <Button onClick={toggleChat} variant="ghost" size="icon" className="h-7 w-7" aria-label="Cerrar chat">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Message Area */}
        <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-background">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={cn(
                "flex",
                msg.sender === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm",
                  msg.sender === 'user'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {/* Basic markdown links rendering (can be expanded) */}
                {msg.text.split(/(\[.*?\]\(.*?\))/g).map((part, i) => {
                  const match = part.match(/\[(.*?)\]\((.*?)\)/);
                  if (match) {
                    return <a key={i} href={match[2]} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">{match[1]}</a>;
                  }
                  return part;
                })}
              </div>
            </div>
          ))}
          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2 text-sm shadow-sm inline-flex items-center space-x-2">
                 <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                 <span className="text-muted-foreground italic text-xs">Escribiendo...</span>
              </div>
            </div>
          )}
          {/* Element to scroll to */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex items-center p-3 border-t bg-muted/40 rounded-b-lg flex-shrink-0">
          <Input
            type="text"
            value={currentMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Pregunta sobre tus documentos..."
            className="flex-grow mr-2 bg-background focus-visible:ring-primary"
            disabled={isLoading}
            aria-label="Escribe tu mensaje"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !currentMessage.trim()}
            size="icon"
            className="flex-shrink-0"
            aria-label="Enviar mensaje"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default AIChatAssistant;

