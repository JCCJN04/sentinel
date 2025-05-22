"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { documentService, type Document } from "@/lib/document-service"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CalendarIcon } from "lucide-react"

// Definimos el tipo para las variantes permitidas del Badge
type BadgeVariantType = "default" | "destructive" | "secondary" | "outline" | null | undefined;

export function UpcomingReminders() {
  const [upcomingDocs, setUpcomingDocs] = useState<Document[]>([])
  const [expirationDates, setExpirationDates] = useState<Date[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [docs, dates] = await Promise.all([
          documentService.getUpcomingExpirations(30),
          documentService.getExpirationDates(),
        ])
        setUpcomingDocs(docs)
        setExpirationDates(dates.map((d) => new Date(d))) // Asegurarse que sean objetos Date
        setError(null)
      } catch (err) {
        console.error("Error al cargar vencimientos:", err)
        setError("No se pudieron cargar los próximos vencimientos")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Función para calcular días restantes
  const getDaysLeft = (dateString: string | null | undefined): number => {
    if (!dateString) return Number.MAX_SAFE_INTEGER; // O algún valor alto para que no se marque como urgente
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const expiryDate = new Date(dateString)
    expiryDate.setHours(0, 0, 0, 0)

    const diffTime = expiryDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Función para obtener la variante de badge según los días restantes
  // CORREGIDO: Añadido el tipo de retorno explícito
  const getBadgeVariant = (daysLeft: number): BadgeVariantType => {
    if (daysLeft <= 7) return "outline" // Siempre "outline", el color se maneja con getBadgeClass
    if (daysLeft <= 30) return "outline"
    return "outline"
  }

  // Función para obtener el texto del badge según los días restantes
  const getBadgeText = (daysLeft: number) => {
    if (daysLeft <= 0) return "Vencido Hoy/Antes" // Modificado para mayor claridad
    if (daysLeft <= 7) return `Vence en ${daysLeft}d`
    if (daysLeft <= 30) return `Próximo (${daysLeft}d)`
    return "Pendiente" // O `En ${daysLeft}d` si prefieres
  }

  // Función para obtener la clase de color del badge según los días restantes
  const getBadgeClass = (daysLeft: number) => {
    if (daysLeft <= 0) { // Vencido
      return "bg-destructive/20 text-destructive border-destructive" // Rojo más intenso
    }
    if (daysLeft <= 7) { // Urgente (menos de 7 días)
      return "bg-destructive/10 text-destructive-foreground border-destructive" // Ejemplo: texto más legible sobre rojo
    }
    if (daysLeft <= 30) { // Próximo (menos de 30 días)
      return "bg-yellow-400/20 text-yellow-700 border-yellow-500 dark:bg-yellow-700/20 dark:text-yellow-300 dark:border-yellow-600" // Asumiendo que tienes colores 'warning' o usa yellow
    }
    // Normal
    return "bg-primary/10 text-primary border-primary"
  }


  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[300px] w-full rounded-md" />
        <div className="space-y-2">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-md" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" /> Error
          </CardTitle>
        </CardHeader>
        <CardContent className="text-destructive">
          {error}. Por favor, recarga la página para intentar nuevamente.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <CalendarIcon className="mr-2 h-5 w-5" />
            Calendario de vencimientos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="border rounded-md"
            locale={es}
            modifiers={{
              highlighted: expirationDates.filter(date => !isNaN(date.getTime())), // Filtrar fechas inválidas
            }}
            modifiersStyles={{
              highlighted: {
                backgroundColor: "hsl(var(--yellow-400, var(--warning)) / 0.2)", // Usar variable CSS si existe o fallback
                color: "hsl(var(--foreground))",
                fontWeight: "bold",
              },
            }}
            month={selectedDate} // Controlar el mes visible
            onMonthChange={setSelectedDate} // Permitir cambiar el mes y que se refleje en selectedDate
            footer={
              expirationDates.length > 0 ? (
                <p className="text-xs text-muted-foreground pt-2 text-center">
                  Fechas con vencimientos resaltadas.
                </p>
              ) : null
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Próximos vencimientos ({upcomingDocs.slice(0, 5).length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {upcomingDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mb-2 opacity-40" />
                <p>No hay documentos próximos a vencer en los siguientes 30 días.</p>
              </div>
            ) : (
              upcomingDocs.slice(0, 5).map((doc) => {
                if (!doc.expiry_date) return null; // No mostrar si no hay fecha de expiración
                const daysLeft = getDaysLeft(doc.expiry_date)
                return (
                  <Link
                    key={doc.id}
                    href={`/dashboard/documentos/${doc.id}`}
                    className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {daysLeft <= 0 ? `Venció ${format(new Date(doc.expiry_date), "PPP", { locale: es })}` : `Vence en ${daysLeft} día(s) (${format(new Date(doc.expiry_date), "PPP", { locale: es })})`}
                      </p>
                    </div>
                    <Badge
                      variant={getBadgeVariant(daysLeft)}
                      className={`${getBadgeClass(daysLeft)} ml-2 whitespace-nowrap`}
                    >
                      {getBadgeText(daysLeft)}
                    </Badge>
                  </Link>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}