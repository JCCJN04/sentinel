"use client" // <--- ESTA ES LA LÍNEA QUE SOLUCIONA EL PROBLEMA

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, ShieldCheck, FileText, Users, HeartPulse, Lock, MessageCircle, GitBranch, Stethoscope, Baby, UserCheck, CheckCircle2, Zap, Clock, Smartphone, BarChart3, Award, Star } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 p-2 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">ZYRA</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#beneficios" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Beneficios
            </Link>
            <Link href="#casos-de-uso" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Casos de Uso
            </Link>
            <Link href="#caracteristicas" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Características
            </Link>
            <Link href="#planes" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Planes
            </Link>
            <Link href="#faq" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild size="sm" className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90">
              <Link href="/registro">Crear Cuenta</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 lg:py-48 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-background to-cyan-50 dark:from-emerald-950/20 dark:via-background dark:to-cyan-950/20" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-200 to-emerald-200 dark:from-cyan-900/30 dark:to-emerald-900/30 rounded-full blur-3xl opacity-20" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-200 to-cyan-200 dark:from-emerald-900/30 dark:to-cyan-900/30 rounded-full blur-3xl opacity-20" />
          
          <div className="container relative px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-full border border-emerald-200 dark:border-emerald-800 backdrop-blur">
                <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Nuevo: Panel AI de análisis médico</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter">
                Tu salud<br />
                <span className="bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 dark:from-emerald-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                  centralizada
                </span>
              </h1>
              
              <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Gestiona el historial médico de toda tu familia en un solo lugar. Seguro, accesible y siempre a tu alcance.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button asChild size="lg" className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90 text-white h-12 px-8">
                  <Link href="/registro">
                    Empieza gratis <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-8">
                  <Link href="#demo">
                    Ver demo <FileText className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-center justify-center gap-6 pt-4 text-sm">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Cifrado bancario</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Sin tarjeta requerida</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Soporte 24/7</span>
                </div>
              </div>
            </div>

            {/* Hero Stats */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="p-6 rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur border border-emerald-200/50 dark:border-emerald-800/50 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">10K+</div>
                <p className="text-sm text-muted-foreground mt-1">Usuarios activos</p>
              </div>
              <div className="p-6 rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur border border-emerald-200/50 dark:border-emerald-800/50 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">500M+</div>
                <p className="text-sm text-muted-foreground mt-1">Documentos seguros</p>
              </div>
              <div className="p-6 rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur border border-emerald-200/50 dark:border-emerald-800/50 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">99.9%</div>
                <p className="text-sm text-muted-foreground mt-1">Disponibilidad</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="beneficios" className="py-20 md:py-32 bg-background relative">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-4">
                La tranquilidad de tener el control
              </h2>
              <p className="mx-auto max-w-[700px] text-lg text-muted-foreground">
                ZYRA te da las herramientas para que la gestión de tu salud sea simple, segura e inteligente.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group p-8 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-950/30 dark:to-background border border-emerald-200/50 dark:border-emerald-800/50 hover:shadow-lg hover:border-emerald-300/80 dark:hover:border-emerald-700/80 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 delay-100">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-500 p-2.5 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-full w-full text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Todo en un lugar</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Guarda análisis, recetas y estudios. Tu historial médico completo, a un clic de distancia.
                </p>
              </div>
              
              <div className="group p-8 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-50/50 dark:from-cyan-950/30 dark:to-background border border-cyan-200/50 dark:border-cyan-800/50 hover:shadow-lg hover:border-cyan-300/80 dark:hover:border-cyan-700/80 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 delay-150">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 dark:from-cyan-400 dark:to-cyan-500 p-2.5 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="h-full w-full text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Seguridad Bancaria</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Cifrado AES-256. Tus datos están blindados. Solo tú tienes acceso a tu información médica.
                </p>
              </div>
              
              <div className="group p-8 rounded-xl bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/30 dark:to-background border border-blue-200/50 dark:border-blue-800/50 hover:shadow-lg hover:border-blue-300/80 dark:hover:border-blue-700/80 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 delay-200">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 p-2.5 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-full w-full text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Gestión Familiar</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Administra el expediente de tus hijos, padres y otros familiares desde una única cuenta.
                </p>
              </div>
              
              <div className="group p-8 rounded-xl bg-gradient-to-br from-rose-50 to-rose-50/50 dark:from-rose-950/30 dark:to-background border border-rose-200/50 dark:border-rose-800/50 hover:shadow-lg hover:border-rose-300/80 dark:hover:border-rose-700/80 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 delay-250">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 dark:from-rose-400 dark:to-rose-500 p-2.5 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <HeartPulse className="h-full w-full text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Listo para Emergencias</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Resumen de salud al instante. Comparte con médicos en emergencias en segundos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="como-funciona" className="py-20 md:py-32 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950 dark:to-slate-900/50">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-4">Comenzar es muy fácil</h2>
              <p className="mx-auto max-w-[700px] text-lg text-muted-foreground">
                En solo tres pasos tendrás el control total de tu información médica.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Step 1 */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
                <div className="relative p-8 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/50 dark:border-emerald-800/30 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-500 flex items-center justify-center text-xl font-bold text-white">1</div>
                    <Smartphone className="h-8 w-8 text-emerald-600 dark:text-emerald-400 opacity-20" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Crea tu cuenta</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Regístrate en menos de un minuto. Solo necesitas tu correo y una contraseña. Totalmente gratis.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
                <div className="relative p-8 rounded-2xl bg-white dark:bg-slate-900 border border-cyan-200/50 dark:border-cyan-800/30 hover:border-cyan-300 dark:hover:border-cyan-700 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 flex items-center justify-center text-xl font-bold text-white">2</div>
                    <FileText className="h-8 w-8 text-cyan-600 dark:text-cyan-400 opacity-20" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Sube tus documentos</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Añade tus recetas, análisis y estudios. ZYRA los organizará automáticamente por categoría.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
                <div className="relative p-8 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/50 dark:border-blue-800/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 flex items-center justify-center text-xl font-bold text-white">3</div>
                    <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400 opacity-20" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Accede siempre</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Tu información disponible en celular o computadora, 24/7, desde cualquier lugar del mundo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Use Cases Section */}
        <section id="casos-de-uso" className="py-20 md:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-4">Pensado para cada etapa</h2>
              <p className="mx-auto max-w-[700px] text-lg text-muted-foreground">
                ZYRA se adapta a tus necesidades y las de tu familia, simplificando la gestión de la salud.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="group p-8 rounded-xl bg-gradient-to-br from-rose-50 to-rose-50/50 dark:from-rose-950/30 dark:to-background border border-rose-200/50 dark:border-rose-800/50 hover:shadow-lg hover:border-rose-300/80 dark:hover:border-rose-700/80 transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 dark:from-rose-400 dark:to-rose-500 p-2.5 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Baby className="h-full w-full text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Control Pediátrico</h3>
                <p className="text-muted-foreground">
                  Organiza el historial de vacunas, citas y recetas de tus hijos en un solo lugar. Alarmas para revacunaciones.
                </p>
              </div>

              <div className="group p-8 rounded-xl bg-gradient-to-br from-amber-50 to-amber-50/50 dark:from-amber-950/30 dark:to-background border border-amber-200/50 dark:border-amber-800/50 hover:shadow-lg hover:border-amber-300/80 dark:hover:border-amber-700/80 transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-500 p-2.5 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <UserCheck className="h-full w-full text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Adultos Mayores</h3>
                <p className="text-muted-foreground">
                  Gestiona múltiples medicamentos y citas. Notificaciones para no olvidar ninguna dosis ni cita.
                </p>
              </div>

              <div className="group p-8 rounded-xl bg-gradient-to-br from-purple-50 to-purple-50/50 dark:from-purple-950/30 dark:to-background border border-purple-200/50 dark:border-purple-800/50 hover:shadow-lg hover:border-purple-300/80 dark:hover:border-purple-700/80 transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-500 p-2.5 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Stethoscope className="h-full w-full text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Enfermedades Crónicas</h3>
                <p className="text-muted-foreground">
                  Lleva un registro ordenado de análisis y estudios para un mejor seguimiento médico a largo plazo.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="caracteristicas" className="py-20 md:py-32 bg-slate-50 dark:bg-slate-950/50">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-4">Características Premium</h2>
              <p className="mx-auto max-w-[700px] text-lg text-muted-foreground">
                Todo lo que necesitas para gestionar tu salud de forma inteligente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Categorización Automática</h4>
                  <p className="text-sm text-muted-foreground">IA detecta y organiza tus documentos automáticamente.</p>
                </div>
              </div>

              <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Compartir Seguro</h4>
                  <p className="text-sm text-muted-foreground">Comparte documentos solo con las personas que autorices.</p>
                </div>
              </div>

              <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Panel de Análisis</h4>
                  <p className="text-sm text-muted-foreground">Visualiza tu historial médico con gráficos inteligentes.</p>
                </div>
              </div>

              <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Recordatorios Inteligentes</h4>
                  <p className="text-sm text-muted-foreground">Notificaciones para medicinas, citas y revisiones.</p>
                </div>
              </div>

              <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">App Móvil Nativa</h4>
                  <p className="text-sm text-muted-foreground">Acceso desde iOS y Android con sincronización instantánea.</p>
                </div>
              </div>

              <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Chat con IA</h4>
                  <p className="text-sm text-muted-foreground">Asistente médico que responde tus preguntas sobre salud.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 md:py-32 bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-950/20 dark:to-cyan-950/20">
            <div className="container px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-4">Historias reales de nuestros usuarios</h2>
                    <p className="mx-auto max-w-[700px] text-lg text-muted-foreground">
                        Descubre por qué miles de familias confían en ZYRA para gestionar su salud.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    <div className="p-8 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-emerald-200/50 dark:border-emerald-800/50 hover:shadow-lg transition-all duration-300">
                        <div className="flex gap-1 mb-4">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                            ))}
                        </div>
                        <p className="text-muted-foreground mb-6 italic leading-relaxed flex-grow">"Ahora tengo toda la historia clínica de mis hijos en el celular. Me da una tranquilidad inmensa saber que todo está organizado, seguro y accesible cuando más lo necesito."</p>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src="/placeholder-user.jpg" alt="@lauram" />
                                <AvatarFallback>LM</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">Laura M.</p>
                                <p className="text-sm text-muted-foreground">Madre de dos hijos</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-cyan-200/50 dark:border-cyan-800/50 hover:shadow-lg transition-all duration-300">
                        <div className="flex gap-1 mb-4">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                            ))}
                        </div>
                        <p className="text-muted-foreground mb-6 italic leading-relaxed flex-grow">"En una emergencia, pude mostrarle al médico las alergias y medicamentos de mi esposo en segundos desde mi teléfono. ¡ZYRA me salvó la vida! Es absolutamente imprescindible."</p>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src="/placeholder-user.jpg" alt="@carlosg" />
                                <AvatarFallback>CG</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">Carlos G.</p>
                                <p className="text-sm text-muted-foreground">Empresario, padre de familia</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-blue-200/50 dark:border-blue-800/50 hover:shadow-lg transition-all duration-300">
                        <div className="flex gap-1 mb-4">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                            ))}
                        </div>
                        <p className="text-muted-foreground mb-6 italic leading-relaxed flex-grow">"Manejar las citas y medicamentos de mis padres era un caos. Con ZYRA, todo está bajo control y puedo compartir la información con mis hermanos instantáneamente. Increíble."</p>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src="/placeholder-user.jpg" alt="@sofiar" />
                                <AvatarFallback>SR</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">Sofía R.</p>
                                <p className="text-sm text-muted-foreground">Cuidadora familiar, doctora</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Pricing Section */}
        <section id="planes" className="py-20 md:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-4">Planes simples y transparentes</h2>
              <p className="mx-auto max-w-[700px] text-lg text-muted-foreground">
                Elige el plan que mejor se adapte a tus necesidades. Cancela en cualquier momento.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Plan Gratuito */}
              <div className="p-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-background hover:shadow-lg transition-all duration-300 flex flex-col">
                <h3 className="text-2xl font-bold mb-2">Gratuito</h3>
                <p className="text-muted-foreground mb-6">Para empezar</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>Hasta 3 miembros familiares</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>Almacenamiento de 5GB</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>Compartir documentos básico</span>
                  </li>
                  <li className="flex items-center gap-3 opacity-50">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    <span>Panel de análisis</span>
                  </li>
                </ul>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/registro">Comenzar gratis</Link>
                </Button>
              </div>

              {/* Plan Pro - Destacado */}
              <div className="p-8 rounded-xl border-2 border-emerald-600 dark:border-emerald-400 bg-gradient-to-br from-emerald-50/50 to-cyan-50/50 dark:from-emerald-950/30 dark:to-cyan-950/30 hover:shadow-2xl transition-all duration-300 flex flex-col relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Más popular
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2 mt-4">Pro</h3>
                <p className="text-muted-foreground mb-6">Para familias activas</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$9.99</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>Hasta 10 miembros familiares</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>Almacenamiento de 100GB</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>Compartir con médicos</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>Panel de análisis avanzado</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>Recordatorios de medicinas</span>
                  </li>
                </ul>
                <Button asChild className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90 text-white">
                  <Link href="/registro">Comienza Pro</Link>
                </Button>
              </div>

              {/* Plan Enterprise */}
              <div className="p-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-background hover:shadow-lg transition-all duration-300 flex flex-col">
                <h3 className="text-2xl font-bold mb-2">Premium</h3>
                <p className="text-muted-foreground mb-6">Para profesionales</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$19.99</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>Usuarios ilimitados</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>Almacenamiento ilimitado</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>Chat con IA médica</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>Integraciones de salud</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>Soporte prioritario 24/7</span>
                  </li>
                </ul>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/registro">Contactar ventas</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-16 md:py-20 bg-slate-50 dark:bg-slate-950/50 border-y border-gray-200 dark:border-gray-800">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <Award className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
                <h4 className="font-bold mb-2">Certificado ISO 27001</h4>
                <p className="text-sm text-muted-foreground">Seguridad de información de clase mundial</p>
              </div>
              <div className="text-center">
                <Lock className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
                <h4 className="font-bold mb-2">Cifrado AES-256</h4>
                <p className="text-sm text-muted-foreground">Misma seguridad que los bancos</p>
              </div>
              <div className="text-center">
                <ShieldCheck className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
                <h4 className="font-bold mb-2">HIPAA Compliant</h4>
                <p className="text-sm text-muted-foreground">Privacidad regulada internacionalmente</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 md:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-4">Preguntas Frecuentes</h2>
              <p className="mx-auto max-w-[700px] text-lg text-muted-foreground">
                Resolvemos tus dudas más importantes sobre ZYRA.
              </p>
            </div>
            
            <div className="mx-auto max-w-3xl">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-b border-gray-200 dark:border-gray-800">
                  <AccordionTrigger className="text-lg font-semibold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-4">
                    ¿Quién puede ver mis documentos y mi información médica?
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground pb-4">
                    Solamente tú eres el dueño de tus datos. La información está cifrada de punta a punta y nadie, ni siquiera nuestro equipo técnico, puede acceder a ella. Solo se puede compartir si tú explícitamente autorizas a un familiar, médico o institución específica. Tienes control total sobre quién ve qué.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border-b border-gray-200 dark:border-gray-800">
                  <AccordionTrigger className="text-lg font-semibold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-4">
                    ¿Qué tan segura es la plataforma ZYRA?
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground pb-4">
                    Muy segura. Utilizamos cifrado AES-256 (nivel bancario) para toda tu información, servidores en infraestructura cloud con certificación ISO 27001, backups automáticos y redundancia geográfica. Realizamos auditorías de seguridad periódicas y cumplimos con HIPAA y regulaciones internacionales de privacidad médica.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border-b border-gray-200 dark:border-gray-800">
                  <AccordionTrigger className="text-lg font-semibold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-4">
                    ¿Venden o comparten mis datos con terceros?
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground pb-4">
                    No, nunca. Nuestra política es absolutamente clara: tus datos son tuyos. No los vendemos, no los compartimos con farmacéuticas, anunciantes, instituciones de seguros ni ninguna otra entidad. Tu privacidad es nuestro compromiso número uno.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border-b border-gray-200 dark:border-gray-800">
                  <AccordionTrigger className="text-lg font-semibold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-4">
                    ¿Cuál es el límite de almacenamiento?
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground pb-4">
                    En el plan gratuito tienes 5GB. El plan Pro incluye 100GB, y el plan Premium ofrece almacenamiento ilimitado. 5GB es suficiente para miles de documentos médicos digitalizados, dependiendo de la calidad de las imágenes.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border-b border-gray-200 dark:border-gray-800">
                  <AccordionTrigger className="text-lg font-semibold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-4">
                    ¿Qué pasa si cancelar mi cuenta?
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground pb-4">
                    Si decides cancelar, tienes la opción de descargar todo tu historial médico en formato standard. Una vez confirmado, todos tus datos serán eliminados permanentemente de nuestros servidores en 30 días. No hay cargos ocultos ni penalizaciones.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger className="text-lg font-semibold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-4">
                    ¿Puedo acceder desde diferentes dispositivos?
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground pb-4">
                    Absolutamente. Puedes acceder desde tu navegador (web), celular iOS o Android, y tendrás sincronización instantánea entre todos tus dispositivos. Tu información está siempre actualizada, donde sea que accedas.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32 bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-700 dark:to-cyan-700 text-white">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter">
                Tu salud merece tranquilidad
              </h2>
              <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
                Únete a miles de familias que ya confían en ZYRA. Sin tarjeta de crédito requerida. Cancela en cualquier momento.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button asChild size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold h-12">
                  <Link href="/registro">
                    Empieza gratis ahora <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
              <p className="text-sm opacity-75 pt-4">
                ✓ Acceso inmediato • ✓ Sin compromiso • ✓ Cancela cuando quieras
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur supports-[backdrop-filter]:bg-slate-50/30 dark:supports-[backdrop-filter]:bg-slate-950/30">
        <div className="container px-4 md:px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 p-2 rounded-lg">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">ZYRA</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                La plataforma segura para gestionar tu historial médico y el de tu familia. Tu salud, tu información, tu control.
              </p>
              <div className="flex gap-4 pt-2">
                <a href="#" className="text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  <GitBranch className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  <MessageCircle className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-3">
                <li><a href="#beneficios" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Beneficios</a></li>
                <li><a href="#caracteristicas" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Características</a></li>
                <li><a href="#planes" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Planes</a></li>
                <li><a href="#casos-de-uso" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Casos de Uso</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-3">
                <li><a href="/blog" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Blog</a></li>
                <li><a href="/sobre-nosotros" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Sobre Nosotros</a></li>
                <li><a href="/carrera" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Carreras</a></li>
                <li><a href="/prensa" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Prensa</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><a href="/privacidad" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Privacidad</a></li>
                <li><a href="/terminos" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Términos</a></li>
                <li><a href="/cookies" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Cookies</a></li>
                <li><a href="/contacto" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Contacto</a></li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-800 my-8" />

          {/* Bottom */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} ZYRA Health. Todos los derechos reservados.</p>
            <div className="flex gap-6">
              <a href="/privacidad" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Política de Privacidad</a>
              <a href="/terminos" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Términos de Servicio</a>
              <a href="/status" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Estado del Servicio</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}