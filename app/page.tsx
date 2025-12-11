"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, ShieldCheck, FileText, Users, HeartPulse, Lock, MessageCircle, GitBranch, Stethoscope, Baby, UserCheck, CheckCircle2, Zap, Clock, Smartphone, BarChart3, Award, Star, TrendingUp, Globe, Play, Sparkles, Database, Bell, Shield } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-all duration-300 group">
            <img
              src="/healthpal.png"
              alt="HealthPal"
              width={320}
              height={320}
              className="object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#beneficios" className="text-sm font-medium text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative group">
              Beneficios
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-blue-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="#casos-de-uso" className="text-sm font-medium text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative group">
              Casos de Uso
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-blue-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="#caracteristicas" className="text-sm font-medium text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative group">
              Características
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-blue-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="#planes" className="text-sm font-medium text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative group">
              Planes
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-blue-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="#faq" className="text-sm font-medium text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative group">
              FAQ
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-blue-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hover:bg-indigo-50 dark:hover:bg-indigo-950/30">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild size="sm" className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg hover:shadow-indigo-500/50 transition-all duration-300">
              <Link href="/registro">Comenzar Gratis</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 lg:py-40 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-background to-cyan-50 dark:from-emerald-950/20 dark:via-background dark:to-cyan-950/20" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-cyan-300/30 to-emerald-300/30 dark:from-cyan-600/20 dark:to-emerald-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-300/30 to-cyan-300/30 dark:from-emerald-600/20 dark:to-cyan-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-300/20 to-purple-300/20 dark:from-blue-600/10 dark:to-purple-600/10 rounded-full blur-3xl" />
          
          <div className="container relative px-4 md:px-6">
            <div className="max-w-5xl mx-auto">
              <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-100/80 to-cyan-100/80 dark:from-emerald-900/40 dark:to-cyan-900/40 rounded-full border border-emerald-200/50 dark:border-emerald-800/50 backdrop-blur-xl shadow-lg hover:shadow-emerald-200/50 dark:hover:shadow-emerald-900/50 transition-all duration-300 group cursor-pointer">
                  <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 group-hover:rotate-12 transition-transform" />
                  <span className="text-sm font-semibold bg-gradient-to-r from-emerald-700 to-cyan-700 dark:from-emerald-300 dark:to-cyan-300 bg-clip-text text-transparent">
                    IA médica avanzada ahora disponible
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </div>
                
                {/* Main Headline */}
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-tight">
                  <span className="block mb-2">Tu salud y la de tu</span>
                  <span className="relative inline-block">
                    <span className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 dark:from-emerald-400 dark:via-cyan-400 dark:to-blue-400 blur-2xl opacity-40"></span>
                    <span className="relative bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 dark:from-emerald-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                      familia protegida
                    </span>
                  </span>
                </h1>
                
                {/* Subtitle */}
                <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
                  La plataforma más segura para gestionar, organizar y compartir tu historial médico familiar. 
                  <span className="font-medium text-foreground"> Todo en un solo lugar.</span>
                </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                  <Button asChild size="lg" className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white h-14 px-8 text-base font-semibold shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 group">
                    <Link href="/registro">
                      Comienza gratis ahora
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
                
                {/* Trust Indicators */}
                <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 pt-6 text-sm">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Cifrado nivel bancario</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Gratis para siempre</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Soporte 24/7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="beneficios" className="py-24 md:py-32 bg-background relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.05))]"></div>
          
          <div className="container px-4 md:px-6 relative">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 bg-indigo-100/80 dark:bg-indigo-900/30 rounded-full border border-indigo-200/50 dark:border-indigo-800/50">
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Por qué elegir HealthPal</span>
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter mb-6">
                Tranquilidad en cada clic
              </h2>
              <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
                HealthPal te da las herramientas para que la gestión de tu salud familiar sea <span className="text-foreground font-medium">simple, segura e inteligente.</span>
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-emerald-50 via-emerald-50/50 to-background dark:from-emerald-950/30 dark:via-emerald-950/20 dark:to-background border border-emerald-200/50 dark:border-emerald-800/50 hover:shadow-2xl hover:scale-105 hover:border-emerald-400/80 dark:hover:border-emerald-600/80 transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-emerald-500/10 transition-all duration-500"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-500 p-3 mb-6 shadow-lg group-hover:shadow-emerald-500/50 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <FileText className="h-full w-full text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Todo centralizado</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Almacena análisis, recetas, estudios y más. Tu historial médico completo, organizado y accesible al instante.
                  </p>
                </div>
              </div>
              
              <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-cyan-50 via-cyan-50/50 to-background dark:from-cyan-950/30 dark:via-cyan-950/20 dark:to-background border border-cyan-200/50 dark:border-cyan-800/50 hover:shadow-2xl hover:scale-105 hover:border-cyan-400/80 dark:hover:border-cyan-600/80 transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/5 group-hover:to-cyan-500/10 transition-all duration-500"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 dark:from-cyan-400 dark:to-cyan-500 p-3 mb-6 shadow-lg group-hover:shadow-cyan-500/50 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <ShieldCheck className="h-full w-full text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">Máxima seguridad</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Cifrado AES-256 nivel bancario. Tus datos médicos están blindados. Solo tú decides quién tiene acceso.
                  </p>
                </div>
              </div>
              
              <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-blue-50 via-blue-50/50 to-background dark:from-blue-950/30 dark:via-blue-950/20 dark:to-background border border-blue-200/50 dark:border-blue-800/50 hover:shadow-2xl hover:scale-105 hover:border-blue-400/80 dark:hover:border-blue-600/80 transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-blue-500/10 transition-all duration-500"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 p-3 mb-6 shadow-lg group-hover:shadow-blue-500/50 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Users className="h-full w-full text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Control familiar</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Gestiona el historial de tus hijos, padres y familiares desde una sola cuenta. Simple y organizado.
                  </p>
                </div>
              </div>
              
              <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-rose-50 via-rose-50/50 to-background dark:from-rose-950/30 dark:via-rose-950/20 dark:to-background border border-rose-200/50 dark:border-rose-800/50 hover:shadow-2xl hover:scale-105 hover:border-rose-400/80 dark:hover:border-rose-600/80 transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/0 to-rose-500/0 group-hover:from-rose-500/5 group-hover:to-rose-500/10 transition-all duration-500"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 dark:from-rose-400 dark:to-rose-500 p-3 mb-6 shadow-lg group-hover:shadow-rose-500/50 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <HeartPulse className="h-full w-full text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Emergencias cubiertas</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Resumen médico instantáneo. Comparte información vital con médicos en segundos cuando más importa.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="como-funciona" className="py-24 md:py-32 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/30 dark:from-slate-950 dark:via-emerald-950/10 dark:to-cyan-950/10 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-emerald-200/30 to-cyan-200/30 dark:from-emerald-600/10 dark:to-cyan-600/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-72 h-72 bg-gradient-to-br from-cyan-200/30 to-blue-200/30 dark:from-cyan-600/10 dark:to-blue-600/10 rounded-full blur-3xl"></div>
          
          <div className="container px-4 md:px-6 relative">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 bg-gradient-to-r from-emerald-100/80 to-cyan-100/80 dark:from-emerald-900/40 dark:to-cyan-900/40 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
                <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Proceso simple</span>
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter mb-6">
                Tres pasos para la tranquilidad
              </h2>
              <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
                Configura tu cuenta y empieza a proteger la salud de tu familia en minutos
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
              {/* Step 1 */}
              <div className="relative group">
                {/* Connector line */}
                <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-emerald-300 to-cyan-300 dark:from-emerald-700 dark:to-cyan-700 -translate-x-1/2 z-0"></div>
                
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
                <div className="relative p-10 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-2 border-emerald-200/50 dark:border-emerald-800/30 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-2xl transition-all duration-500 group-hover:scale-105">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg group-hover:shadow-emerald-500/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      1
                    </div>
                    <Smartphone className="h-10 w-10 text-emerald-600/20 dark:text-emerald-400/20" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Crea tu cuenta</h3>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    Registro en menos de 60 segundos. Solo necesitas tu correo electrónico. <span className="font-semibold text-emerald-600 dark:text-emerald-400">Gratis para siempre.</span>
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group">
                {/* Connector line */}
                <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-cyan-300 to-blue-300 dark:from-cyan-700 dark:to-blue-700 -translate-x-1/2 z-0"></div>
                
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
                <div className="relative p-10 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-2 border-cyan-200/50 dark:border-cyan-800/30 hover:border-cyan-400 dark:hover:border-cyan-600 hover:shadow-2xl transition-all duration-500 group-hover:scale-105">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg group-hover:shadow-cyan-500/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      2
                    </div>
                    <FileText className="h-10 w-10 text-cyan-600/20 dark:text-cyan-400/20" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">Sube documentos</h3>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    Añade recetas, análisis y estudios. <span className="font-semibold text-cyan-600 dark:text-cyan-400">La IA los categoriza automáticamente</span> por tipo y fecha.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
                <div className="relative p-10 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-2 border-blue-200/50 dark:border-blue-800/30 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-2xl transition-all duration-500 group-hover:scale-105">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg group-hover:shadow-blue-500/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      3
                    </div>
                    <Clock className="h-10 w-10 text-blue-600/20 dark:text-blue-400/20" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Accede desde cualquier lugar</h3>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    Tu información disponible 24/7 en celular, tablet o computadora. <span className="font-semibold text-blue-600 dark:text-blue-400">Siempre contigo.</span>
                  </p>
                </div>
              </div>
            </div>

            {/* CTA below steps */}
            <div className="mt-16 text-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white h-14 px-10 text-base font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group">
                <Link href="/registro">
                  Empieza ahora, es gratis
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <p className="mt-4 text-sm text-muted-foreground">
                No se requiere tarjeta de crédito • Configuración en 60 segundos
              </p>
            </div>
          </div>
        </section>
        
        {/* Use Cases Section */}
        <section id="casos-de-uso" className="py-24 md:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 bg-gradient-to-r from-rose-100/80 to-purple-100/80 dark:from-rose-900/30 dark:to-purple-900/30 rounded-full border border-rose-200/50 dark:border-rose-800/50">
                <HeartPulse className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <span className="text-sm font-medium text-rose-700 dark:text-rose-300">Para cada etapa de la vida</span>
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter mb-6">
                Adaptado a tus necesidades
              </h2>
              <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
                HealthPal crece contigo y con tu familia, facilitando el cuidado de la salud en cada momento
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="group relative p-10 rounded-2xl bg-gradient-to-br from-rose-50 via-rose-50/50 to-background dark:from-rose-950/30 dark:via-rose-950/10 dark:to-background border border-rose-200/50 dark:border-rose-800/50 hover:shadow-2xl hover:scale-105 hover:border-rose-400/80 dark:hover:border-rose-600/80 transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/0 to-rose-500/0 group-hover:from-rose-500/5 group-hover:to-rose-500/10 transition-all duration-500"></div>
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 dark:from-rose-400 dark:to-rose-500 p-3 mb-6 shadow-lg group-hover:shadow-rose-500/50 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Baby className="h-full w-full text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    Familias con niños
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Mantén organizado el historial de vacunas, consultas pediátricas y recetas de tus hijos. Alertas automáticas para revacunaciones y citas.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                      <span>Control de vacunación completo</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                      <span>Historial de crecimiento</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                      <span>Recordatorios de consultas</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="group relative p-10 rounded-2xl bg-gradient-to-br from-amber-50 via-amber-50/50 to-background dark:from-amber-950/30 dark:via-amber-950/10 dark:to-background border border-amber-200/50 dark:border-amber-800/50 hover:shadow-2xl hover:scale-105 hover:border-amber-400/80 dark:hover:border-amber-600/80 transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-500/0 group-hover:from-amber-500/5 group-hover:to-amber-500/10 transition-all duration-500"></div>
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-500 p-3 mb-6 shadow-lg group-hover:shadow-amber-500/50 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <UserCheck className="h-full w-full text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Adultos mayores
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Gestiona múltiples medicamentos, citas especializadas y estudios. Sistema de alertas para no olvidar ninguna dosis o consulta médica.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <span>Gestión de múltiples medicinas</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <span>Calendario de citas médicas</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <span>Historial de análisis</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="group relative p-10 rounded-2xl bg-gradient-to-br from-purple-50 via-purple-50/50 to-background dark:from-purple-950/30 dark:via-purple-950/10 dark:to-background border border-purple-200/50 dark:border-purple-800/50 hover:shadow-2xl hover:scale-105 hover:border-purple-400/80 dark:hover:border-purple-600/80 transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:to-purple-500/10 transition-all duration-500"></div>
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-500 p-3 mb-6 shadow-lg group-hover:shadow-purple-500/50 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Stethoscope className="h-full w-full text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Condiciones crónicas
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Registro detallado de análisis, tratamientos y evolución. Reportes automáticos para compartir con tu equipo médico y mejor seguimiento.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      <span>Seguimiento de tratamientos</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      <span>Gráficos de evolución</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      <span>Reportes para médicos</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="caracteristicas" className="py-24 md:py-32 bg-gradient-to-br from-slate-50 to-background dark:from-slate-950/50 dark:to-background">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 bg-gradient-to-r from-blue-100/80 to-purple-100/80 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full border border-blue-200/50 dark:border-blue-800/50">
                <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Tecnología de punta</span>
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter mb-6">
                Funcionalidades premium
              </h2>
              <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
                Todo lo que necesitas para gestionar tu salud de forma <span className="text-foreground font-medium">inteligente y eficiente</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <div className="group p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-gray-200 dark:border-gray-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-xl transition-all duration-300 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    IA de Categorización
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Inteligencia artificial detecta y organiza automáticamente tus documentos por tipo.
                  </p>
                </div>
              </div>

              <div className="group p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-gray-200 dark:border-gray-800 hover:border-cyan-400 dark:hover:border-cyan-600 hover:shadow-xl transition-all duration-300 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-900/40 dark:to-cyan-800/40 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-bold mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    Compartir Seguro
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Comparte documentos con quien autorices mediante enlaces seguros y temporales.
                  </p>
                </div>
              </div>

              <div className="group p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl transition-all duration-300 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Panel de Análisis
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Visualiza tu evolución médica con gráficos interactivos y reportes detallados.
                  </p>
                </div>
              </div>

              <div className="group p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-gray-200 dark:border-gray-800 hover:border-rose-400 dark:hover:border-rose-600 hover:shadow-xl transition-all duration-300 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/40 dark:to-rose-800/40 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Bell className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h4 className="font-bold mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    Recordatorios Inteligentes
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Alertas automáticas para medicamentos, citas médicas y revisiones importantes.
                  </p>
                </div>
              </div>

              <div className="group p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-gray-200 dark:border-gray-800 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-xl transition-all duration-300 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Smartphone className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="font-bold mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Multiplataforma
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Acceso desde iOS, Android y web con sincronización en tiempo real.
                  </p>
                </div>
              </div>

              <div className="group p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-gray-200 dark:border-gray-800 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-xl transition-all duration-300 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <MessageCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-bold mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Asistente IA Médico
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Chatbot inteligente que responde preguntas sobre tu salud y documentos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section id="testimonials" className="py-24 md:py-32 bg-gradient-to-br from-emerald-50 via-cyan-50/50 to-blue-50/50 dark:from-emerald-950/20 dark:via-cyan-950/10 dark:to-blue-950/10 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-300/20 to-cyan-300/20 dark:from-emerald-600/10 dark:to-cyan-600/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-cyan-300/20 to-blue-300/20 dark:from-cyan-600/10 dark:to-blue-600/10 rounded-full blur-3xl"></div>
            
            <div className="container px-4 md:px-6 relative">
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 bg-gradient-to-r from-indigo-100/80 to-blue-100/80 dark:from-indigo-900/40 dark:to-blue-900/40 rounded-full border border-indigo-200/50 dark:border-indigo-800/50">
                        <Star className="h-4 w-4 text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400" />
                        <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Lo que dicen nuestros usuarios</span>
                    </div>
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter mb-6">
                        Historias que inspiran confianza
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
                        Miles de familias ya confían en HealthPal para proteger su salud
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    <div className="group relative p-10 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-indigo-200/50 dark:border-indigo-800/50 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-2xl hover:scale-105 transition-all duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-blue-500/0 group-hover:from-indigo-500/5 group-hover:to-blue-500/10 rounded-2xl transition-all duration-500"></div>
                        <div className="relative">
                            <div className="flex gap-1 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                                ))}
                            </div>
                            <p className="text-foreground mb-8 italic leading-relaxed text-base">
                                "Tener toda la historia clínica de mis hijos en el celular me da una <span className="font-semibold text-emerald-600 dark:text-emerald-400">tranquilidad inmensa.</span> Todo está organizado, seguro y accesible cuando más lo necesito."
                            </p>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-14 w-14 border-2 border-emerald-200 dark:border-emerald-800">
                                    <AvatarImage src="/placeholder-user.jpg" alt="@lauram" />
                                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-cyan-500 text-white font-bold">LM</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold text-foreground">Laura Martínez</p>
                                    <p className="text-sm text-muted-foreground">Madre de familia</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="group relative p-10 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-cyan-200/50 dark:border-cyan-800/50 hover:border-cyan-400 dark:hover:border-cyan-600 hover:shadow-2xl hover:scale-105 transition-all duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/5 group-hover:to-blue-500/10 rounded-2xl transition-all duration-500"></div>
                        <div className="relative">
                            <div className="flex gap-1 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                                ))}
                            </div>
                            <p className="text-foreground mb-8 italic leading-relaxed text-base">
                                "En una emergencia, mostré las alergias y medicamentos de mi esposo al médico en segundos. <span className="font-semibold text-indigo-600 dark:text-indigo-400">¡HealthPal literalmente salvó su vida!</span> Es imprescindible."
                            </p>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-14 w-14 border-2 border-cyan-200 dark:border-cyan-800">
                                    <AvatarImage src="/placeholder-user.jpg" alt="@carlosg" />
                                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white font-bold">CG</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold text-foreground">Carlos González</p>
                                    <p className="text-sm text-muted-foreground">Empresario</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="group relative p-10 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-2xl hover:scale-105 transition-all duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/10 rounded-2xl transition-all duration-500"></div>
                        <div className="relative">
                            <div className="flex gap-1 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                                ))}
                            </div>
                            <p className="text-foreground mb-8 italic leading-relaxed text-base">
                                "Manejar las citas y medicamentos de mis padres era un caos. Con HealthPal, <span className="font-semibold text-blue-600 dark:text-blue-400">todo está bajo control</span> y puedo compartir info con mis hermanos al instante."
                            </p>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-14 w-14 border-2 border-blue-200 dark:border-blue-800">
                                    <AvatarImage src="/placeholder-user.jpg" alt="@sofiar" />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">SR</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold text-foreground">Sofía Ramírez</p>
                                    <p className="text-sm text-muted-foreground">Médica general</p>
                                </div>
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
                    <span>Usuario individual</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>Almacenamiento de 5GB</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>Gestión de documentos médicos</span>
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
                  <span className="text-4xl font-bold">$159</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>Hasta 10 miembros familiares</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>Almacenamiento de 50GB</span>
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

              {/* Plan Premium */}
              <div className="p-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-background hover:shadow-lg transition-all duration-300 flex flex-col">
                <h3 className="text-2xl font-bold mb-2">Premium</h3>
                <p className="text-muted-foreground mb-6">Para profesionales</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$399</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>Usuarios ilimitados</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>Almacenamiento 100GB</span>
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
        <section className="py-20 md:py-24 bg-white/50 dark:bg-slate-900/50 border-y border-gray-200/50 dark:border-gray-800/50 backdrop-blur">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold mb-2">Tu seguridad es nuestra prioridad</h3>
              <p className="text-muted-foreground">Protegemos tu información médica con los más altos estándares</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
              <div className="group text-center p-8 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all duration-300">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 mb-6 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h4 className="font-bold text-lg mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Protección Total
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tu información médica está protegida con tecnología de seguridad de última generación
                </p>
              </div>
              <div className="group text-center p-8 rounded-2xl hover:bg-cyan-50 dark:hover:bg-cyan-950/30 transition-all duration-300">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-900/40 dark:to-cyan-800/40 mb-6 group-hover:scale-110 transition-transform">
                  <Lock className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h4 className="font-bold text-lg mb-3 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  Cifrado Avanzado
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Utilizamos cifrado de nivel bancario para mantener tu información completamente segura
                </p>
              </div>
              <div className="group text-center p-8 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-300">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 mb-6 group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-bold text-lg mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Privacidad Garantizada
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Solo tú decides quién tiene acceso a tu información médica y la de tu familia
                </p>
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
                Resolvemos tus dudas más importantes sobre HealthPal.
              </p>
            </div>
            
            <div className="mx-auto max-w-3xl">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-b border-gray-200 dark:border-gray-800">
                  <AccordionTrigger className="text-lg font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-4">
                    ¿Quién puede ver mis documentos y mi información médica?
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground pb-4">
                    Solamente tú eres el dueño de tus datos. La información está cifrada de punta a punta y nadie, ni siquiera nuestro equipo técnico, puede acceder a ella. Solo se puede compartir si tú explícitamente autorizas a un familiar, médico o institución específica. Tienes control total sobre quién ve qué.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border-b border-gray-200 dark:border-gray-800">
                  <AccordionTrigger className="text-lg font-semibold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-4">
                    ¿Qué tan segura es la plataforma HealthPal?
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
        <section className="relative py-24 md:py-32 overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 dark:from-emerald-700 dark:via-cyan-700 dark:to-blue-700"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          
          <div className="container px-4 md:px-6 relative">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-xl rounded-full border border-white/30">
                <Sparkles className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">Únete a más de 10,000 familias</span>
              </div>

              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-white leading-tight">
                Tu salud merece la mejor
                <br />
                <span className="relative">
                  <span className="relative z-10">protección</span>
                  <div className="absolute bottom-2 left-0 right-0 h-3 bg-white/30 -rotate-1"></div>
                </span>
              </h2>
              
              <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed font-light">
                Empieza hoy mismo. Sin compromisos, sin tarjeta de crédito. 
                Cancela cuando quieras.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Button asChild size="lg" className="bg-white text-emerald-600 hover:bg-gray-50 font-bold h-16 px-10 text-lg shadow-2xl hover:shadow-white/20 hover:scale-105 transition-all duration-300 group">
                  <Link href="/registro" className="flex items-center gap-2">
                    Crear cuenta gratis
                    <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-16 px-10 text-lg border-2 border-white text-white hover:bg-white/10 backdrop-blur font-semibold group">
                  <Link href="#planes" className="flex items-center gap-2">
                    Ver planes
                    <BarChart3 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </Link>
                </Button>
              </div>
              
              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-white/90">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">Gratis para siempre</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">Sin tarjeta requerida</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">Setup en 60 segundos</span>
                </div>
              </div>

              
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950 dark:to-slate-900/50 backdrop-blur">
        <div className="container px-4 md:px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center gap-2">
                <img
                  src="/healthpal.png"
                  alt="HealthPal"
                  width={360}
                  height={360}
                  className="object-contain"
                />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                La plataforma más segura para gestionar el historial médico de tu familia. 
                <span className="font-semibold text-foreground"> Tu salud, tu información, tu control.</span>
              </p>
              <div className="flex gap-4 pt-2">
                <a href="#" className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:scale-110 transition-all duration-300">
                  <GitBranch className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-900/40 dark:to-cyan-800/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400 hover:scale-110 transition-all duration-300">
                  <MessageCircle className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:scale-110 transition-all duration-300">
                  <Globe className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-bold text-lg mb-6">Producto</h4>
              <ul className="space-y-4">
                <li>
                  <a href="#beneficios" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Beneficios
                  </a>
                </li>
                <li>
                  <a href="#caracteristicas" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Características
                  </a>
                </li>
                <li>
                  <a href="#planes" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Planes
                  </a>
                </li>
                <li>
                  <a href="#casos-de-uso" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Casos de Uso
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold text-lg mb-6">Empresa</h4>
              <ul className="space-y-4">
                <li>
                  <a href="/blog" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Blog
                  </a>
                </li>
                <li>
                  <a href="/sobre-nosotros" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Sobre Nosotros
                  </a>
                </li>
                <li>
                  <a href="/carrera" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Carreras
                  </a>
                </li>
                <li>
                  <a href="/prensa" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Prensa
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-lg mb-6">Legal</h4>
              <ul className="space-y-4">
                <li>
                  <a href="/privacidad" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Privacidad
                  </a>
                </li>
                <li>
                  <a href="/terminos" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Términos
                  </a>
                </li>
                <li>
                  <a href="/cookies" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Cookies
                  </a>
                </li>
                <li>
                  <a href="/contacto" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2 group">
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Contacto
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-800 my-10" />

          {/* Bottom */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <p>&copy; {new Date().getFullYear()} HealthPal. Todos los derechos reservados.</p>
              <span className="hidden md:inline">•</span>
              <p className="hidden md:block">Hecho con ❤️ para tu salud</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <a href="/privacidad" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">
                Política de Privacidad
              </a>
              <a href="/terminos" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">
                Términos de Servicio
              </a>
              <a href="/status" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Estado del Servicio
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}