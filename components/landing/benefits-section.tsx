import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck, HeartPulse, ShieldCheck, Users } from "lucide-react";

const benefits = [
  {
    icon: <FileCheck className="h-8 w-8 text-primary" />,
    title: "Todo en un solo lugar",
    description: "Centraliza análisis, recetas, estudios y más. Accede a tu historial completo con un solo clic.",
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-primary" />,
    title: "Seguridad y Privacidad",
    description: "Tus datos están protegidos con cifrado de extremo a extremo. Eres el único dueño de tu información.",
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "Gestión Familiar",
    description: "Administra el expediente de tus hijos, padres o cualquier miembro de tu familia desde una sola cuenta.",
  },
  {
    icon: <HeartPulse className="h-8 w-8 text-primary" />,
    title: "Preparado para Emergencias",
    description: "Genera un resumen de salud completo (alergias, medicamentos, etc.) para compartirlo al instante con cualquier médico.",
  },
];

export function BenefitsSection() {
  return (
    <section id="beneficios" className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
            Beneficios Clave
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
            La tranquilidad de tener el control
          </h2>
          <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Sentinel te da las herramientas para que la gestión de tu salud sea simple, segura e inteligente.
          </p>
        </div>
        <div className="mx-auto grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => (
            <Card key={index}>
              <CardHeader>
                {benefit.icon}
                <CardTitle className="mt-4">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}