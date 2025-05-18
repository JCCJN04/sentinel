"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { HelpArticle } from "@/components/help/help-article"
import { VideoTutorial } from "@/components/help/video-tutorial"
import { ContactForm } from "@/components/help/contact-form"
import { BookOpen, FileQuestion, HelpCircle, MessageSquare, Play, Search } from "lucide-react"

// Mock popular articles
const popularArticles = [
  {
    id: "1",
    title: "Cómo subir documentos",
    category: "Primeros pasos",
    views: 1245,
  },
  {
    id: "2",
    title: "Configurar recordatorios automáticos",
    category: "Alertas y recordatorios",
    views: 987,
  },
  {
    id: "3",
    title: "Compartir documentos de forma segura",
    category: "Compartir y colaborar",
    views: 856,
  },
  {
    id: "4",
    title: "Organizar documentos con etiquetas",
    category: "Gestión de documentos",
    views: 742,
  },
]

// Mock FAQ data
const faqData = [
  {
    question: "¿Qué tan seguro es DocuVault?",
    answer:
      "DocuVault utiliza cifrado de extremo a extremo para proteger tus documentos. Todos los archivos se almacenan con cifrado AES-256 y las conexiones están protegidas con TLS 1.3. Además, ofrecemos autenticación de dos factores para mayor seguridad en tu cuenta.",
  },
  {
    question: "¿Puedo acceder a mis documentos sin internet?",
    answer:
      "Sí, DocuVault ofrece funcionalidad offline en nuestras aplicaciones móviles. Puedes marcar documentos específicos para acceso sin conexión, y se sincronizarán automáticamente cuando vuelvas a conectarte.",
  },
  {
    question: "¿Cómo funciona el reconocimiento de texto (OCR)?",
    answer:
      "Nuestra tecnología OCR (Reconocimiento Óptico de Caracteres) analiza automáticamente tus documentos escaneados o fotografiados para extraer texto. Esto permite búsquedas por contenido, categorización automática y extracción de fechas importantes para recordatorios.",
  },
  {
    question: "¿Puedo compartir documentos con otras personas?",
    answer:
      "Sí, puedes compartir documentos específicos con otros usuarios mediante enlaces seguros con fecha de caducidad. También puedes establecer permisos específicos como solo lectura o permitir descargas. En el plan Familiar, puedes compartir carpetas completas con miembros de tu familia.",
  },
  {
    question: "¿Qué pasa si cancelo mi suscripción?",
    answer:
      "Si cancelas tu suscripción Premium o Familiar, tu cuenta pasará automáticamente al plan Básico gratuito. Seguirás teniendo acceso a tus documentos, pero con las limitaciones del plan gratuito. Te recomendamos exportar o eliminar documentos para ajustarte al límite de almacenamiento gratuito.",
  },
]

// Mock video tutorials
const videoTutorials = [
  {
    id: "1",
    title: "Primeros pasos con DocuVault",
    thumbnail: "/placeholder.svg?height=180&width=320",
    duration: "5:32",
    category: "Primeros pasos",
  },
  {
    id: "2",
    title: "Cómo organizar tus documentos",
    thumbnail: "/placeholder.svg?height=180&width=320",
    duration: "4:15",
    category: "Gestión de documentos",
  },
  {
    id: "3",
    title: "Configurar alertas y recordatorios",
    thumbnail: "/placeholder.svg?height=180&width=320",
    duration: "3:48",
    category: "Alertas y recordatorios",
  },
]

export default function AyudaPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("centro-ayuda")
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ayuda y soporte</h1>
        <p className="text-muted-foreground">Encuentra respuestas a tus preguntas y obtén ayuda con DocuVault.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          className="pl-10 py-6 text-lg"
          placeholder="Buscar en el centro de ayuda..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
          <TabsTrigger value="centro-ayuda" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Centro de ayuda</span>
          </TabsTrigger>
          <TabsTrigger value="tutoriales" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            <span>Tutoriales</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <FileQuestion className="h-4 w-4" />
            <span>FAQ</span>
          </TabsTrigger>
          <TabsTrigger value="contacto" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Contacto</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="centro-ayuda" className="space-y-4">
          {selectedArticle ? (
            <Card>
              <CardHeader>
                <Button variant="ghost" className="w-fit -ml-2 mb-2" onClick={() => setSelectedArticle(null)}>
                  ← Volver a artículos
                </Button>
                <CardTitle>Cómo subir documentos</CardTitle>
                <CardDescription>Aprende a subir y organizar tus documentos en DocuVault</CardDescription>
              </CardHeader>
              <CardContent>
                <HelpArticle />
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Categorías populares</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-auto flex flex-col items-center justify-center p-6 gap-2">
                      <div className="rounded-full p-2 bg-primary/10">
                        <HelpCircle className="h-6 w-6 text-primary" />
                      </div>
                      <span>Primeros pasos</span>
                    </Button>
                    <Button variant="outline" className="h-auto flex flex-col items-center justify-center p-6 gap-2">
                      <div className="rounded-full p-2 bg-primary/10">
                        <FileQuestion className="h-6 w-6 text-primary" />
                      </div>
                      <span>Gestión de documentos</span>
                    </Button>
                    <Button variant="outline" className="h-auto flex flex-col items-center justify-center p-6 gap-2">
                      <div className="rounded-full p-2 bg-primary/10">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <span>Alertas y recordatorios</span>
                    </Button>
                    <Button variant="outline" className="h-auto flex flex-col items-center justify-center p-6 gap-2">
                      <div className="rounded-full p-2 bg-primary/10">
                        <MessageSquare className="h-6 w-6 text-primary" />
                      </div>
                      <span>Compartir y colaborar</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Artículos populares</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {popularArticles.map((article) => (
                      <div
                        key={article.id}
                        className="flex items-center justify-between p-4 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedArticle(article.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="rounded-full p-1 bg-muted">
                            <BookOpen className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{article.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {article.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{article.views} vistas</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="tutoriales" className="space-y-4">
          {selectedVideo ? (
            <Card>
              <CardHeader>
                <Button variant="ghost" className="w-fit -ml-2 mb-2" onClick={() => setSelectedVideo(null)}>
                  ← Volver a tutoriales
                </Button>
                <CardTitle>Primeros pasos con DocuVault</CardTitle>
              </CardHeader>
              <CardContent>
                <VideoTutorial />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Tutoriales en video</CardTitle>
                <CardDescription>Aprende a usar DocuVault con nuestros tutoriales en video</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {videoTutorials.map((video) => (
                    <div
                      key={video.id}
                      className="border rounded-md overflow-hidden cursor-pointer"
                      onClick={() => setSelectedVideo(video.id)}
                    >
                      <div className="relative">
                        <img
                          src={video.thumbnail || "/placeholder.svg"}
                          alt={video.title}
                          className="w-full aspect-video object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="rounded-full bg-black/50 p-3">
                            <Play className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {video.duration}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium">{video.title}</h3>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {video.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preguntas frecuentes</CardTitle>
              <CardDescription>Respuestas a las preguntas más comunes sobre DocuVault</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqData.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacto">
          <Card>
            <CardHeader>
              <CardTitle>Contacta con soporte</CardTitle>
              <CardDescription>Envíanos un mensaje y te responderemos lo antes posible</CardDescription>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
