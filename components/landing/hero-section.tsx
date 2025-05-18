import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-background to-muted/30">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
            Gestiona tus documentos de forma segura y eficiente
          </h1>
          <p className="max-w-[700px] text-muted-foreground md:text-xl">
            Database te permite organizar, compartir y acceder a tus documentos importantes desde cualquier lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Link href="/registro">
              <Button size="lg" className="h-12 px-8">
                Comenzar gratis
              </Button>
            </Link>
            <Link href="#beneficios">
              <Button size="lg" variant="outline" className="h-12 px-8">
                Conocer más
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
