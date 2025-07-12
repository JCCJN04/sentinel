import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "¿Quién puede ver mis documentos y mi información?",
    answer: "Solamente tú. En Sentinel, tú eres el único dueño de tus datos. La información está cifrada y nadie, ni siquiera nuestro equipo, tiene acceso a ella. Solo se puede compartir si tú explícitamente decides hacerlo con un familiar o un médico.",
  },
  {
    question: "¿Qué tan segura es la plataforma?",
    answer: "Muy segura. Utilizamos cifrado de extremo a extremo (similar al de los bancos) para toda tu información. Nuestra infraestructura se basa en proveedores líderes en la industria y seguimos las mejores prácticas de seguridad para proteger tu privacidad en todo momento.",
  },
  {
    question: "¿Puedo gestionar los expedientes de mi familia?",
    answer: "Sí. Sentinel está diseñado para que puedas administrar fácilmente los perfiles de tus hijos, padres u otros dependientes desde una única cuenta, manteniendo toda la información organizada y separada.",
  },
  {
    question: "¿Mis datos se venden a terceros?",
    answer: "No, nunca. Nuestra política es clara: tus datos son tuyos. No los vendemos ni los compartimos con anunciantes, farmacéuticas ni ninguna otra entidad. Nuestro modelo de negocio se basa en ofrecer un servicio valioso, no en explotar tu información.",
  },
  {
    question: "¿Qué pasa si decido cancelar mi cuenta?",
    answer: "Si decides cancelar tu cuenta, te daremos la opción de descargar toda tu información en un archivo comprimido. Una vez confirmado, todos tus datos serán eliminados permanentemente de nuestros servidores.",
  },
];

export function FaqSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
            Preguntas Frecuentes
          </h2>
          <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Resolvemos tus dudas más importantes sobre Sentinel.
          </p>
        </div>
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}