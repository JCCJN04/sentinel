import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Search, Bell, BarChart3 } from "lucide-react"

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones rápidas</CardTitle>
        <CardDescription>Accede rápidamente a las funciones más utilizadas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Button variant="outline" className="h-24 flex-col" asChild>
            <Link href="/dashboard/subir">
              <Upload className="mb-2 h-5 w-5" />
              <span>Añadir documento</span>
            </Link>
          </Button>

          <Button variant="outline" className="h-24 flex-col" asChild>
            <Link href="/dashboard/documentos">
              <Search className="mb-2 h-5 w-5" />
              <span>Explorar documentos</span>
            </Link>
          </Button>

          <Button variant="outline" className="h-24 flex-col" asChild>
            <Link href="/dashboard/alertas">
              <Bell className="mb-2 h-5 w-5" />
              <span>Configurar recordatorios</span>
            </Link>
          </Button>

          <Button variant="outline" className="h-24 flex-col" asChild>
            <Link href="/dashboard/reportes">
              <BarChart3 className="mb-2 h-5 w-5" />
              <span>Ver reportes</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
