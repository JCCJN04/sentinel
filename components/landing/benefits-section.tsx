import { Archive, TabletIcon as DeviceTablet, FolderCog, ShieldCheck } from "lucide-react"

export function BenefitsSection() {
  return (
    <section id="beneficios" className="py-16 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Beneficios principales</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Descubre cómo Database puede transformar la manera en que gestionas tus documentos personales
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <Archive className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">Todo en un solo lugar</h3>
            <p className="text-center text-muted-foreground">
              Centraliza todos tus documentos importantes en una única plataforma segura.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <DeviceTablet className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">Acceso desde cualquier dispositivo</h3>
            <p className="text-center text-muted-foreground">
              Consulta tus documentos desde tu computadora, tablet o smartphone en cualquier momento.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <FolderCog className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">Organización automática</h3>
            <p className="text-center text-muted-foreground">
              Clasifica automáticamente tus documentos por categorías y fechas relevantes.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <ShieldCheck className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">Seguridad garantizada</h3>
            <p className="text-center text-muted-foreground">
              Protección con cifrado de extremo a extremo para tus documentos más sensibles.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
