import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function FaqSection() {
  return (
    <section id="faq" className="py-16">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Preguntas frecuentes</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Respuestas a las preguntas más comunes sobre Database
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl mt-12">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>¿Qué tan seguro es Database?</AccordionTrigger>
              <AccordionContent>
                Database utiliza cifrado de extremo a extremo para proteger tus documentos. Todos los archivos se
                almacenan con cifrado AES-256 y las conexiones están protegidas con TLS 1.3. Además, ofrecemos
                autenticación de dos factores para mayor seguridad en tu cuenta.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>¿Puedo acceder a mis documentos sin internet?</AccordionTrigger>
              <AccordionContent>
                Sí, Database ofrece funcionalidad offline en nuestras aplicaciones móviles. Puedes marcar documentos
                específicos para acceso sin conexión, y se sincronizarán automáticamente cuando vuelvas a conectarte.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>¿Cómo funciona el reconocimiento de texto (OCR)?</AccordionTrigger>
              <AccordionContent>
                Nuestra tecnología OCR (Reconocimiento Óptico de Caracteres) analiza automáticamente tus documentos
                escaneados o fotografiados para extraer texto. Esto permite búsquedas por contenido, categorización
                automática y extracción de fechas importantes para recordatorios.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>¿Puedo compartir documentos con otras personas?</AccordionTrigger>
              <AccordionContent>
                Sí, puedes compartir documentos específicos con otros usuarios mediante enlaces seguros con fecha de
                caducidad. También puedes establecer permisos específicos como solo lectura o permitir descargas. En el
                plan Familiar, puedes compartir carpetas completas con miembros de tu familia.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>¿Qué pasa si cancelo mi suscripción?</AccordionTrigger>
              <AccordionContent>
                Si cancelas tu suscripción Premium o Familiar, tu cuenta pasará automáticamente al plan Básico gratuito.
                Seguirás teniendo acceso a tus documentos, pero con las limitaciones del plan gratuito. Te recomendamos
                exportar o eliminar documentos para ajustarte al límite de almacenamiento gratuito.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>¿Cómo puedo obtener ayuda si tengo problemas?</AccordionTrigger>
              <AccordionContent>
                Ofrecemos soporte por email para todos los usuarios. Los suscriptores de planes Premium y Familiar
                también tienen acceso a soporte por chat en vivo. Además, contamos con un centro de ayuda completo con
                tutoriales y guías paso a paso para todas las funciones.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  )
}
