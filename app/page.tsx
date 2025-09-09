import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, ShieldCheck, FileCheck, Users, HeartPulse, Lock } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ZYRA</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#beneficios" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Beneficios
            </Link>
            <Link href="#como-funciona" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Cómo Funciona
            </Link>
            <Link href="#faq" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Preguntas Frecuentes
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/registro">Crear Cuenta</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-24 md:py-32 lg:py-40 text-center bg-gradient-to-b from-background to-muted/40">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                Tu expediente médico, <span className="text-primary">organizado y seguro</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                ZYRA es la plataforma definitiva para centralizar, gestionar y acceder a toda tu información de salud y la de tu familia, en cualquier momento y lugar.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/registro">
                    Crea tu cuenta segura <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-4 w-4 text-green-600" />
                <span>Cifrado de nivel bancario. Tu privacidad es nuestra prioridad.</span>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="beneficios" className="py-16 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">La tranquilidad de tener el control</h2>
              <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                ZYRA te da las herramientas para que la gestión de tu salud sea simple, segura e inteligente.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="flex flex-col items-center text-center p-6">
                <FileCheck className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Todo en un solo lugar</h3>
                <p className="text-muted-foreground">
                  Centraliza análisis, recetas y estudios. Accede a tu historial completo con un solo clic.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <ShieldCheck className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Seguridad y Privacidad</h3>
                <p className="text-muted-foreground">
                  Tus datos están protegidos con cifrado de extremo a extremo. Eres el único dueño de tu información.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <Users className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Gestión Familiar</h3>
                <p className="text-muted-foreground">
                  Administra el expediente de tus hijos, padres o cualquier miembro de tu familia desde una sola cuenta.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <HeartPulse className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Preparado para Emergencias</h3>
                <p className="text-muted-foreground">
                  Genera un resumen de salud para compartirlo al instante con cualquier médico.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="como-funciona" className="py-16 md:py-24 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Comenzar es muy fácil</h2>
              <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                En solo tres pasos tendrás el control total de tu información médica.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-primary text-primary-foreground w-12 h-12 flex items-center justify-center text-xl font-bold mb-4">1</div>
                <h3 className="text-xl font-bold mb-2">Crea tu cuenta segura</h3>
                <p className="text-muted-foreground">Regístrate en menos de un minuto. Solo necesitas tu correo y una contraseña.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-primary text-primary-foreground w-12 h-12 flex items-center justify-center text-xl font-bold mb-4">2</div>
                <h3 className="text-xl font-bold mb-2">Sube tus documentos</h3>
                <p className="text-muted-foreground">Añade tus recetas, análisis y estudios. ZYRA los organizará por ti.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-primary text-primary-foreground w-12 h-12 flex items-center justify-center text-xl font-bold mb-4">3</div>
                <h3 className="text-xl font-bold mb-2">Accede desde donde sea</h3>
                <p className="text-muted-foreground">Tu información de salud, disponible en tu celular o computadora, 24/7.</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section id="faq" className="py-16 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Preguntas Frecuentes</h2>
              <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                Resolvemos tus dudas más importantes sobre la seguridad y privacidad de tus datos.
              </p>
            </div>
            <div className="mx-auto max-w-3xl">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>¿Quién puede ver mis documentos y mi información?</AccordionTrigger>
                  <AccordionContent>
                    Solamente tú. En ZYRA, tú eres el único dueño de tus datos. La información está cifrada y nadie, ni siquiera nuestro equipo, tiene acceso a ella. Solo se puede compartir si tú explícitamente decides hacerlo con un familiar o un médico.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>¿Qué tan segura es la plataforma?</AccordionTrigger>
                  <AccordionContent>
                    Muy segura. Utilizamos cifrado de nivel bancario (AES-256) para toda tu información, tanto en tránsito como en reposo. Nuestra infraestructura se basa en proveedores líderes en la industria y seguimos las mejores prácticas de seguridad para proteger tu privacidad en todo momento.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>¿Mis datos se venden a terceros?</AccordionTrigger>
                  <AccordionContent>
                    No, nunca. Nuestra política es clara: tus datos son tuyos. No los vendemos ni los compartimos con anunciantes, farmacéuticas ni ninguna otra entidad. Nuestro modelo de negocio se basa en ofrecerte un servicio valioso, no en explotar tu información.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>¿Qué pasa si decido cancelar mi cuenta?</AccordionTrigger>
                  <AccordionContent>
                    Si decides cancelar tu cuenta, te daremos la opción de descargar toda tu información en un archivo comprimido. Una vez confirmado, todos tus datos serán eliminados permanentemente de nuestros servidores de forma irrecuperable.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">¿Listo para tomar el control de tu salud?</h2>
                <p className="max-w-[600px] md:text-xl/relaxed opacity-90">
                  No más papeles perdidos ni olvidos en tus citas médicas. Con ZYRA, tu tranquilidad está a un clic de distancia.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center lg:justify-end">
                <Button asChild size="lg" variant="secondary">
                  <Link href="/registro">
                    Comienza gratis ahora <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container px-4 md:px-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ZYRA. Todos los derechos reservados.</p>
          <div className="flex justify-center gap-4 mt-4">
              <Link href="#" className="hover:text-primary">Términos de Servicio</Link>
              <Link href="#" className="hover:text-primary">Política de Privacidad</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}