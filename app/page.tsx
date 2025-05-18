import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, FileText, Share2, Bell, BarChart } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            {/* Nombre cambiado aquí */}
            <span className="text-xl font-bold">Sentinel</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary">
              Características
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-primary">
              Cómo funciona
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary">
              Precios
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Iniciar sesión
              </Button>
            </Link>
            <Link href="/registro">
              <Button size="sm">Registrarse</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Modificado para una sola columna centrada */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-background to-muted/30">
        <div className="container px-4 md:px-6">
          <div className="flex justify-center">
            <div className="space-y-6 text-center max-w-3xl">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                Organiza tus documentos medicos
              </h1>
              <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {/* Nombre cambiado aquí */}
                Sentinel te ayuda a almacenar, organizar y acceder a tus documentos medicos de forma segura.
              </p>
              <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
                <Link href="/registro">
                  <Button size="lg" className="gap-1">
                    Comenzar ahora
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button size="lg" variant="outline">
                    Cómo funciona
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24">
         <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Todo lo que necesitas para gestionar tus documentos medicos
            </h2>
            <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl/relaxed">
              {/* Nombre cambiado aquí */}
              Sentinel ofrece todas las herramientas necesarias para mantener tus documentos medicos organizados, seguros y
              accesibles.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-muted/30 rounded-lg">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Almacenamiento seguro</h3>
              <p className="text-muted-foreground">
                Guarda tus documentos importantes con encriptación de extremo a extremo y accede a ellos cuando los
                necesites.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-muted/30 rounded-lg">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <Share2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Compartir documentos</h3>
              <p className="text-muted-foreground">
                Comparte documentos de forma segura con quien tu quieras.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-muted/30 rounded-lg">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Alertas y recordatorios</h3>
              <p className="text-muted-foreground">
                Recibe notificaciones sobre documentos medicos próximos a vencer o que requieren tu atención.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-24 bg-muted/30">
          <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Cómo funciona</h2>
            <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl/relaxed">
              {/* Nombre cambiado aquí */}
              Comenzar a usar Sentinel es fácil y rápido. Sigue estos simples pasos:
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-primary text-primary-foreground w-12 h-12 flex items-center justify-center text-xl font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Crea una cuenta</h3>
              <p className="text-muted-foreground">
                Regístrate con un correo y contraseña de tu elección.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-primary text-primary-foreground w-12 h-12 flex items-center justify-center text-xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Sube tus documentos</h3>
              <p className="text-muted-foreground">
                Sube tus documentos medicos y organízalos con categorías y etiquetas de tu preferencia.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-primary text-primary-foreground w-12 h-12 flex items-center justify-center text-xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Accede desde cualquier lugar</h3>
              <p className="text-muted-foreground">
                Accede a tus documentos desde cualquier dispositivo, en cualquier momento y lugar.
              </p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Link href="/registro">
              <Button size="lg">Comenzar ahora</Button>
            </Link>
          </div>
        </div>
      </section>

      
      {/* 

      <section id="pricing" className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Planes simples y transparentes
            </h2>
            <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl/relaxed">
              Elige el plan que mejor se adapte a tus necesidades. Todos los planes incluyen nuestras funciones básicas.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col p-6 bg-muted/30 rounded-lg border border-border">
              <div className="mb-4">
                <h3 className="text-xl font-bold">Básico</h3>
                <p className="text-muted-foreground">Para uso personal básico</p>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold">Gratis</span>
              </div>
              <ul className="mb-6 space-y-2">
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Hasta 50 documentos
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Almacenamiento de 1GB
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Alertas básicas
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Acceso desde cualquier dispositivo
                </li>
              </ul>
              <Link href="/registro" className="mt-auto">
                <Button className="w-full" variant="outline">
                  Comenzar gratis
                </Button>
              </Link>
            </div>
            <div className="flex flex-col p-6 bg-primary/5 rounded-lg border border-primary relative">
              <div className="absolute -top-3 left-0 right-0 mx-auto w-fit px-4 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                Popular
              </div>
              <div className="mb-4">
                <h3 className="text-xl font-bold">Premium</h3>
                <p className="text-muted-foreground">Para individuos y familias</p>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold">$9.99</span>
                <span className="text-muted-foreground"> /mes</span>
              </div>
              <ul className="mb-6 space-y-2">
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Documentos ilimitados
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Almacenamiento de 10GB
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Plan familiar (hasta 5 miembros)
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Alertas avanzadas
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Reportes y análisis
                </li>
              </ul>
              <Link href="/registro" className="mt-auto">
                <Button className="w-full">Elegir Premium</Button>
              </Link>
            </div>
            <div className="flex flex-col p-6 bg-muted/30 rounded-lg border border-border">
              <div className="mb-4">
                <h3 className="text-xl font-bold">Empresarial</h3>
                <p className="text-muted-foreground">Para empresas y equipos</p>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold">$24.99</span>
                <span className="text-muted-foreground"> /mes</span>
              </div>
              <ul className="mb-6 space-y-2">
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Documentos ilimitados
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Almacenamiento de 50GB
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Usuarios ilimitados
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Control de acceso avanzado
                </li>
                <li className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Soporte prioritario
                </li>
              </ul>
              <Link href="/registro" className="mt-auto">
                <Button className="w-full" variant="outline">
                  Contactar ventas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      */}

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
         <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Comienza a organizar tus documentos medicos hoy mismo
              </h2>
              <p className="max-w-[600px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed opacity-90">
                {/* Nombre cambiado aquí */}
                Te ha pasado que tienes que ir a una cita con tu medico, y olvidas algún documento, pues con 
                sentinel eso quedo en el pasado, tendras tus documentos mediccos en la palma de tu mano siempre.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center lg:justify-end">
              <Link href="/registro">
                <Button size="lg" variant="secondary" className="gap-1">
                  Registrarse gratis
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Iniciar sesión
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 md:py-16">
          <div className="container px-4 md:px-6">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                {/* Nombre cambiado aquí */}
                <span className="text-xl font-bold">Sentinel</span>
              </div>
              <p className="max-w-[400px] text-muted-foreground">
                {/* Nombre cambiado aquí */}
                Sentinel es la solución definitiva para guardar tus documentos medicos. Organiza, protege y
                accede a tus documentos importantes desde cualquier lugar.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Producto</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground">
                      Características
                    </Link>
                  </li>
                  <li>
                    <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">
                      Precios
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Empresa</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                      Acerca de
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                      Contacto
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Legal</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                      Privacidad
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                      Términos
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {/* Nombre cambiado aquí */}
              &copy; {new Date().getFullYear()} Sentinel. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                </svg>
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                <span className="sr-only">Instagram</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}