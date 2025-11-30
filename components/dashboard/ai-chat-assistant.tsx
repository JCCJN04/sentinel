"use client"

import React, { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Loader2, Send, User, X, Sparkles } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/use-auth"
import type { ChatMessage } from "@/types/medical-assistant"

export function AIChatAssistant() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { toast } = useToast()
  const { session } = useAuth()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // No mostrar el botón flotante si estamos en la página del asistente IA
  const shouldHideButton = pathname === '/dashboard/asistente-ia'

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Mensaje de bienvenida
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: '¡Hola! Soy tu Asistente IA Médico. Puedo ayudarte con preguntas sobre tu salud, medicamentos, análisis y más. ¿En qué puedo ayudarte?',
        timestamp: new Date(),
      }])
    }
  }, [isOpen, messages.length])

  // Auto-scroll
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      // Obtener token de autenticación
      const token = session?.access_token
      if (!token) {
        throw new Error('No estás autenticado. Por favor inicia sesión.')
      }

      // Llamar al API del asistente médico
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
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar tu pregunta')
      }

      // Agregar respuesta del asistente
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(data.timestamp),
      }

      setMessages((prev) => [...prev, assistantMessage])

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Lo siento, tuve un problema al procesar tu solicitud. Por favor, inténtalo de nuevo.'
      
      const errorResponse: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: errorMessage,
        timestamp: new Date(),
      }
      
      setMessages((prev) => [...prev, errorResponse])
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  // No renderizar nada si estamos en la página del asistente IA
  if (shouldHideButton) {
    return null
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop para móvil */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/50 z-[90] md:hidden backdrop-blur-sm"
              />
            )}
            
            <motion.div
              initial={{ opacity: 0, y: isMobile ? '100%' : 20, scale: isMobile ? 1 : 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: isMobile ? '100%' : 20, scale: isMobile ? 1 : 0.9 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`
                fixed z-[95] shadow-2xl
                ${isMobile 
                  ? 'inset-x-0 bottom-0 top-16 rounded-t-3xl max-h-[85vh]' 
                  : 'bottom-20 right-4 sm:right-6 w-[95vw] sm:w-[420px] md:w-[440px] h-[85vh] sm:h-[600px] md:h-[650px] rounded-2xl'
                }
              `}
            >
              <Card className="h-full flex flex-col border-2">
                <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between space-y-0 pb-3 border-b bg-gradient-to-r from-primary/10 to-primary/5">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Bot className="h-6 w-6 text-primary" />
                      <motion.div
                        className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg">Asistente IA Médico</CardTitle>
                      <p className="text-xs text-muted-foreground">Siempre disponible</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>

                <CardContent className="flex-1 overflow-hidden p-3 sm:p-4">
                  <ScrollArea ref={scrollAreaRef} className="h-full pr-2 sm:pr-4">
                    <div className="space-y-3 sm:space-y-4">
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.05 }}
                          className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          {msg.role === "assistant" && (
                            <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            </div>
                          )}
                          <div
                            className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm ${
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground rounded-tr-sm"
                                : "bg-muted rounded-tl-sm"
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                            <p className={`text-[10px] sm:text-xs mt-1 ${
                              msg.role === "user" 
                                ? "text-primary-foreground/60" 
                                : "text-muted-foreground/60"
                            }`}>
                              {new Date(msg.timestamp).toLocaleTimeString('es-MX', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          {msg.role === "user" && (
                            <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center">
                              <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                      {isLoading && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex justify-start gap-2"
                        >
                          <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          </div>
                          <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                            <div className="flex gap-1">
                              <motion.div
                                className="w-2 h-2 bg-primary/60 rounded-full"
                                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                              />
                              <motion.div
                                className="w-2 h-2 bg-primary/60 rounded-full"
                                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                              />
                              <motion.div
                                className="w-2 h-2 bg-primary/60 rounded-full"
                                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>

                <CardFooter className="flex-shrink-0 p-3 sm:p-4 pt-2 sm:pt-3 border-t bg-background">
                  <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                    <div className="flex-1 relative">
                      <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleTextareaChange}
                        placeholder={isMobile ? "Pregunta algo..." : "Pregunta sobre tu salud, medicamentos, análisis..."}
                        className="resize-none pr-10 min-h-[44px] max-h-[120px] text-sm sm:text-base rounded-xl"
                        rows={1}
                        disabled={isLoading}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                      />
                      {!input.trim() && (
                        <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                      )}
                    </div>
                    <Button 
                      type="submit" 
                      size="icon" 
                      disabled={isLoading || !input.trim()}
                      className="h-11 w-11 rounded-xl shrink-0 shadow-lg"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </Button>
                  </form>
                  {!isMobile && (
                    <p className="text-[10px] text-muted-foreground text-center w-full mt-2">
                      Presiona Enter para enviar • Shift+Enter para nueva línea
                    </p>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
          className={`
            fixed pointer-events-auto
            ${isMobile 
              ? 'bottom-20 right-4 z-[100]' 
              : 'bottom-6 right-4 sm:right-6 z-[100]'
            }
          `}
        >
          <Button
            size="icon"
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 sm:h-16 sm:w-16 rounded-full shadow-2xl hover:shadow-primary/50 hover:scale-110 active:scale-90 transition-all duration-300 bg-gradient-to-br from-primary to-primary/80 relative"
          >
            <Bot className="h-6 w-6 sm:h-7 sm:w-7 relative z-10" />
            
            {/* Pulse animation */}
            <span
              className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20"
              style={{ animationDuration: '2s' }}
            />
            
            {/* Online indicator */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-background"></span>
            </span>
          </Button>
        </motion.div>
      )}
    </>
  )
}