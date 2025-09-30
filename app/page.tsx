"use client" // <--- ESTA ES LA LÍNEA QUE SOLUCIONA EL PROBLEMA

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, ShieldCheck, FileText, Users, HeartPulse, Lock, MessageCircle, GitBranch, Stethoscope, Baby, UserCheck } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
            <Link href="#casos-de-uso" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Casos de Uso
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
                Toma el control de tu historial médico. <span className="text-primary">Simple y seguro.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Centraliza los expedientes médicos de toda tu familia en un solo lugar. Accede a ellos desde cualquier dispositivo, cuando más los necesites.
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
                <FileText className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Todo en un lugar</h3>
                <p className="text-muted-foreground">
                  Guarda análisis, recetas y estudios. Tu historial médico completo, a un clic de distancia.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <ShieldCheck className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Seguridad y Privacidad</h3>
                <p className="text-muted-foreground">
                  Tus datos están blindados con cifrado bancario. Solo tú tienes acceso a tu información.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <Users className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Gestión Familiar</h3>
                <p className="text-muted-foreground">
                  Administra el expediente de tus hijos, padres y otros familiares desde una única cuenta.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <HeartPulse className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Listo para Emergencias</h3>
                <p className="text-muted-foreground">
                  Crea un resumen de salud y compártelo al instante con cualquier médico en caso de necesidad.
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
        
        {/* Use Cases Section */}
        <section id="casos-de-uso" className="py-16 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Tu aliado en cada etapa de la vida</h2>
              <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                ZYRA se adapta a tus necesidades y las de tu familia, simplificando la gestión de la salud.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-6 border rounded-lg">
                <Baby className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Control Pediátrico</h3>
                <p className="text-muted-foreground">
                  Organiza el historial de vacunas, citas y recetas de tus hijos en un solo lugar.
                </p>
              </div>
              <div className="p-6 border rounded-lg">
                <UserCheck className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Cuidado de Adultos Mayores</h3>
                <p className="text-muted-foreground">
                  Gestiona los múltiples medicamentos y citas de tus padres para que no se te olvide nada.
                </p>
              </div>
              <div className="p-6 border rounded-lg">
                <Stethoscope className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Enfermedades Crónicas</h3>
                <p className="text-muted-foreground">
                  Lleva un registro ordenado de tus análisis y estudios para un mejor seguimiento médico.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section id="testimonials" className="py-16 md:py-24 bg-muted/40">
            <div className="container px-4 md:px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Lo que dicen nuestros usuarios</h2>
                    <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                        Descubre por qué las familias confían en ZYRA para gestionar su salud.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="bg-background p-6 rounded-lg flex flex-col">
                        <p className="text-muted-foreground flex-grow">"Ahora tengo toda la historia clínica de mis hijos en el celular. Me da una tranquilidad inmensa saber que todo está organizado y accesible."</p>
                        <div className="flex items-center mt-4">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src="/placeholder-user.jpg" alt="@lauram" />
                                <AvatarFallback>LM</AvatarFallback>
                            </Avatar>
                            <div className="ml-4">
                                <p className="font-semibold">Laura M.</p>
                                <p className="text-sm text-muted-foreground">Madre de dos</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-background p-6 rounded-lg flex flex-col">
                        <p className="text-muted-foreground flex-grow">"En una emergencia, pude mostrarle al médico las alergias de mi esposo en segundos desde mi teléfono. ¡ZYRA es imprescindible!"</p>
                        <div className="flex items-center mt-4">
                             <Avatar className="h-10 w-10">
                                <AvatarImage src="/placeholder-user.jpg" alt="@carlosg" />
                                <AvatarFallback>CG</AvatarFallback>
                            </Avatar>
                            <div className="ml-4">
                                <p className="font-semibold">Carlos G.</p>
                                <p className="text-sm text-muted-foreground">Usuario</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-background p-6 rounded-lg flex flex-col">
                        <p className="text-muted-foreground flex-grow">"Manejar las citas y medicamentos de mis padres era un caos. Con ZYRA, todo está bajo control y puedo compartir la información con mis hermanos."</p>
                        <div className="flex items-center mt-4">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src="/placeholder-user.jpg" alt="@sofiar" />
                                <AvatarFallback>SR</AvatarFallback>
                            </Avatar>
                            <div className="ml-4">
                                <p className="font-semibold">Sofía R.</p>
                                <p className="text-sm text-muted-foreground">Cuidadora familiar</p>
                            </div>
                        </div>
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
                    Solamente tú. En ZYRA, eres el único dueño de tus datos. La información está cifrada y nadie, ni siquiera nuestro equipo, tiene acceso a ella. Solo se puede compartir si tú explícitamente decides hacerlo con un familiar o un médico.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>¿Qué tan segura es la plataforma?</AccordionTrigger>
                  <AccordionContent>
                    Muy segura. Utilizamos cifrado de nivel bancario (AES-256) para toda tu información. Nuestra infraestructura sigue las mejores prácticas de seguridad para proteger tu privacidad en todo momento.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>¿Mis datos se venden a terceros?</AccordionTrigger>
                  <AccordionContent>
                    No, nunca. Nuestra política es clara: tus datos son tuyos. No los vendemos ni los compartimos con anunciantes, farmacéuticas ni ninguna otra entidad.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>¿Qué pasa si decido cancelar mi cuenta?</AccordionTrigger>
                  <AccordionContent>
                    Si decides cancelar tu cuenta, te daremos la opción de descargar toda tu información. Una vez confirmado, todos tus datos serán eliminados permanentemente de nuestros servidores.
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
              <Link href="/terminos" className="hover:text-primary">Términos de Servicio</Link>
              <Link href="/privacidad" className="hover:text-primary">Política de Privacidad</Link>
              <Link href="/contacto" className="hover:text-primary">Contacto</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}