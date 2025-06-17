"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Loader2, Send, User, X, Sparkles } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { documentService } from "@/lib/document-service"
import { useToast } from "@/components/ui/use-toast"

// Align the Document interface with the service's definition
interface Document {
  id: string
  name: string
  category?: string
  date?: string
  expiry_date?: string | null
  provider?: string | null
  amount?: number | string | null 
  tags?: string[]
  notes?: string | null // FIX: Allow null to match the service
  summary?: string
}

interface Message {
  role: "user" | "assistant"
  content: string
}

export function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [userDocuments, setUserDocuments] = useState<Document[]>([])
  const [hasFetchedDocs, setHasFetchedDocs] = useState(false)
  const { toast } = useToast()

  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const fetchUserDocuments = useCallback(async () => {
    if (hasFetchedDocs) return
    console.log("Intentando cargar documentos para el contexto de la IA...")
    try {
      const docs = await documentService.getDocuments()
      setUserDocuments(docs) // This should now work without a type error
      setHasFetchedDocs(true)
      console.log("Documentos cargados para el contexto de la IA:", docs)
    } catch (error) {
      console.error("Error al cargar documentos para la IA:", error)
      toast({
        title: "Error de IA",
        description: "No se pudieron cargar los documentos para el contexto.",
        variant: "destructive",
      })
    }
  }, [hasFetchedDocs, toast])

  useEffect(() => {
    if (isOpen && !hasFetchedDocs) {
      fetchUserDocuments()
    }
  }, [isOpen, hasFetchedDocs, fetchUserDocuments])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const documentContext =
        userDocuments.length > 0
          ? `
        Aquí hay un resumen de los documentos del usuario:
        ${userDocuments
          .map(
            (doc) =>
              `- Nombre: ${doc.name}, Categoría: ${doc.category || "N/A"}, Resumen: ${
                doc.summary || doc.notes || "No disponible"
              }`
          )
          .join("\n")}
      `
          : "El usuario no tiene documentos cargados."

      // Simulación de llamada a una API de IA
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const assistantResponse: Message = {
        role: "assistant",
        content: `Basado en tus documentos, he analizado tu pregunta sobre "${input.substring(
          0,
          20
        )}...". Mi capacidad de análisis aún está en desarrollo, pero aquí tienes una respuesta simulada. ${documentContext.substring(0,100)}...`,
      }

      setMessages((prev) => [...prev, assistantResponse])
    } catch (error) {
      const errorResponse: Message = {
        role: "assistant",
        content: "Lo siento, tuve un problema al procesar tu solicitud. Por favor, inténtalo de nuevo.",
      }
      setMessages((prev) => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button onClick={() => setIsOpen(true)} className="rounded-full w-16 h-16 shadow-lg">
          <Sparkles className="h-8 w-8" />
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-24 right-6 z-50"
          >
            <Card className="w-[380px] h-[550px] shadow-2xl flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-6 w-6" />
                  <CardTitle className="text-lg">Asistente IA</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-grow overflow-hidden">
                <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.role === "assistant" && (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5 text-primary-foreground" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                        </div>
                         {msg.role === "user" && (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                       <div className="flex gap-2 justify-start">
                         <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5 text-primary-foreground" />
                          </div>
                         <div className="bg-muted rounded-lg px-3 py-2 flex items-center">
                            <Loader2 className="h-5 w-5 animate-spin"/>
                         </div>
                       </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Pregunta sobre tus documentos..."
                    className="flex-grow resize-none"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <Button type="submit" disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}