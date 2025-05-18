import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ThumbsDown, ThumbsUp } from "lucide-react"

export function VideoTutorial() {
  return (
    <div className="space-y-6">
      <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
        <p className="text-muted-foreground">Video tutorial: Primeros pasos con Sentinel</p>
      </div>

      <div className="prose prose-sm max-w-none">
        <h2>Primeros pasos con Sentinel</h2>

        <p>
          Este tutorial te guiará a través de los conceptos básicos para comenzar a usar Sentinel de manera efectiva.
          Aprenderás a configurar tu cuenta, subir tus primeros documentos y organizar tu información personal.
        </p>

        <h3>Contenido del video</h3>

        <ul>
          <li>0:00 - Introducción</li>
          <li>0:45 - Configuración inicial de la cuenta</li>
          <li>2:10 - Subir tu primer documento</li>
          <li>3:25 - Organizar documentos por categorías</li>
          <li>4:15 - Configurar recordatorios</li>
          <li>5:00 - Resumen y próximos pasos</li>
        </ul>

        <h3>Recursos adicionales</h3>

        <p>Para complementar este tutorial, te recomendamos revisar los siguientes artículos:</p>

        <ul>
          <li>Guía completa de categorías y etiquetas</li>
          <li>Cómo configurar recordatorios avanzados</li>
          <li>Mejores prácticas para organizar documentos</li>
        </ul>
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="text-sm">¿Te ha resultado útil este video?</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <ThumbsUp className="mr-2 h-4 w-4" />
            Sí, gracias
          </Button>
          <Button variant="outline" size="sm">
            <ThumbsDown className="mr-2 h-4 w-4" />
            No, necesito más ayuda
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="text-sm font-medium">Videos relacionados</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-md overflow-hidden">
            <div className="relative">
              <img
                src="/placeholder.svg?height=100&width=200"
                alt="Cómo organizar tus documentos"
                className="w-full aspect-video object-cover"
              />
            </div>
            <div className="p-2">
              <p className="text-sm font-medium">Cómo organizar tus documentos</p>
            </div>
          </div>
          <div className="border rounded-md overflow-hidden">
            <div className="relative">
              <img
                src="/placeholder.svg?height=100&width=200"
                alt="Configurar alertas y recordatorios"
                className="w-full aspect-video object-cover"
              />
            </div>
            <div className="p-2">
              <p className="text-sm font-medium">Configurar alertas y recordatorios</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}