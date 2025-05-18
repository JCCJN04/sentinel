import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ThumbsDown, ThumbsUp } from "lucide-react"

export function HelpArticle() {
  return (
    <div className="space-y-6">
      <div className="prose prose-sm max-w-none">
        <h2>Cómo subir documentos a Sentinel</h2>

        <p>
          Sentinel te permite subir documentos de varias maneras para que puedas organizar y gestionar toda tu
          información importante en un solo lugar. A continuación, te explicamos las diferentes formas de añadir
          documentos a tu cuenta.
        </p>

        <h3>Método 1: Subir archivos desde tu dispositivo</h3>

        <p>
          La forma más común de añadir documentos es subiendo archivos directamente desde tu computadora, tablet o
          smartphone.
        </p>

        <ol>
          <li>Inicia sesión en tu cuenta de Sentinel.</li>
          <li>Haz clic en el botón "Añadir documento" en el dashboard o en la sección de documentos.</li>
          <li>Selecciona la opción "Archivo" en la pantalla de subida.</li>
          <li>Haz clic en "Seleccionar archivo" o arrastra y suelta tus archivos en el área designada.</li>
          <li>Una vez seleccionados los archivos, Sentinel comenzará a procesarlos automáticamente.</li>
          <li>
            Completa la información adicional como nombre, categoría, etiquetas y fecha de vencimiento (si aplica).
          </li>
          <li>Haz clic en "Guardar documento" para finalizar el proceso.</li>
        </ol>

        <p>
          <strong>Formatos soportados:</strong> PDF, JPG, PNG, TIFF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT y más.
        </p>

        <h3>Método 2: Capturar con la cámara</h3>

        <p>Puedes usar la cámara de tu dispositivo para escanear documentos físicos directamente a Sentinel.</p>

        <ol>
          <li>Haz clic en "Añadir documento" y selecciona la opción "Cámara".</li>
          <li>Permite el acceso a la cámara cuando se te solicite.</li>
          <li>Alinea el documento dentro del marco que aparece en pantalla.</li>
          <li>Toma la foto y ajusta los bordes si es necesario.</li>
          <li>Sentinel mejorará automáticamente la imagen para mayor legibilidad.</li>
          <li>Puedes tomar múltiples fotos para documentos de varias páginas.</li>
          <li>Completa la información del documento y guárdalo.</li>
        </ol>

        <h3>Método 3: Importar desde email</h3>

        <p>Puedes importar documentos directamente desde tu correo electrónico conectando tu cuenta.</p>

        <ol>
          <li>Haz clic en "Añadir documento" y selecciona la opción "Email".</li>
          <li>Si es la primera vez, deberás conectar tu cuenta de correo siguiendo las instrucciones.</li>
          <li>Una vez conectada, podrás ver los correos con archivos adjuntos.</li>
          <li>Selecciona los documentos que deseas importar.</li>
          <li>Sentinel extraerá automáticamente los archivos adjuntos.</li>
          <li>Completa la información adicional y guarda los documentos.</li>
        </ol>

        <h3>Consejos para una mejor organización</h3>

        <ul>
          <li>Utiliza nombres descriptivos para tus documentos.</li>
          <li>Asigna categorías adecuadas para facilitar la búsqueda.</li>
          <li>Añade etiquetas relevantes para filtrar documentos.</li>
          <li>Configura fechas de vencimiento para documentos importantes.</li>
          <li>Utiliza la función OCR para hacer que el texto de tus documentos sea buscable.</li>
        </ul>
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="text-sm">¿Te ha resultado útil este artículo?</p>
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
        <p className="text-sm font-medium">Artículos relacionados</p>
        <ul className="space-y-1">
          <li>
            <a href="#" className="text-sm text-primary hover:underline">
              Cómo organizar documentos con etiquetas
            </a>
          </li>
          <li>
            <a href="#" className="text-sm text-primary hover:underline">
              Configurar recordatorios para documentos importantes
            </a>
          </li>
          <li>
            <a href="#" className="text-sm text-primary hover:underline">
              Cómo funciona el reconocimiento de texto (OCR)
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}