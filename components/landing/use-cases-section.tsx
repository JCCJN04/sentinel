import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Receipt, Stethoscope, Home, Car, GraduationCap } from "lucide-react"

export function UseCasesSection() {
  return (
    <section id="casos-uso" className="py-16">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Casos de uso</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Descubre cómo Database puede ayudarte a organizar diferentes tipos de documentos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Documentos médicos</h3>
              <p className="text-muted-foreground mb-4">
                Organiza historias clínicas, recetas, resultados de análisis y citas médicas.
              </p>
              <div className="relative w-full h-40 mt-2 rounded-md overflow-hidden">
                <Image
                  src="/placeholder.svg?height=160&width=320"
                  alt="Ejemplo de documentos médicos"
                  fill
                  className="object-cover"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Documentos del hogar</h3>
              <p className="text-muted-foreground mb-4">
                Guarda escrituras, contratos de alquiler, facturas de servicios y garantías.
              </p>
              <div className="relative w-full h-40 mt-2 rounded-md overflow-hidden">
                <Image
                  src="/placeholder.svg?height=160&width=320"
                  alt="Ejemplo de documentos del hogar"
                  fill
                  className="object-cover"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Documentos financieros</h3>
              <p className="text-muted-foreground mb-4">
                Centraliza estados de cuenta, comprobantes de pago, declaraciones de impuestos y facturas.
              </p>
              <div className="relative w-full h-40 mt-2 rounded-md overflow-hidden">
                <Image
                  src="/placeholder.svg?height=160&width=320"
                  alt="Ejemplo de documentos financieros"
                  fill
                  className="object-cover"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Documentos de vehículos</h3>
              <p className="text-muted-foreground mb-4">
                Guarda tarjetas de circulación, pólizas de seguro, facturas de mantenimiento y multas.
              </p>
              <div className="relative w-full h-40 mt-2 rounded-md overflow-hidden">
                <Image
                  src="/placeholder.svg?height=160&width=320"
                  alt="Ejemplo de documentos de vehículos"
                  fill
                  className="object-cover"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Documentos educativos</h3>
              <p className="text-muted-foreground mb-4">
                Organiza títulos, certificados, diplomas y documentos académicos importantes.
              </p>
              <div className="relative w-full h-40 mt-2 rounded-md overflow-hidden">
                <Image
                  src="/placeholder.svg?height=160&width=320"
                  alt="Ejemplo de documentos educativos"
                  fill
                  className="object-cover"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Documentos de identidad</h3>
              <p className="text-muted-foreground mb-4">
                Guarda pasaportes, DNI, licencias de conducir y otros documentos oficiales.
              </p>
              <div className="relative w-full h-40 mt-2 rounded-md overflow-hidden">
                <Image
                  src="/placeholder.svg?height=160&width=320"
                  alt="Ejemplo de documentos de identidad"
                  fill
                  className="object-cover"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
