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
        setExpirationDates(dates.map((d) => new Date(d)))
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
  const getDaysLeft = (dateString: string): number => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const expiryDate = new Date(dateString)
    expiryDate.setHours(0, 0, 0, 0)

    const diffTime = expiryDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Función para obtener la variante de badge según los días restantes
  const getBadgeVariant = (daysLeft: number) => {
    if (daysLeft <= 7) return "outline" // Clase para urgente (rojo)
    if (daysLeft <= 30) return "outline" // Clase para próximo (amarillo)
    return "outline" // Clase para normal (azul/gris)
  }

  // Función para obtener el texto del badge según los días restantes
  const getBadgeText = (daysLeft: number) => {
    if (daysLeft <= 7) return "Urgente"
    if (daysLeft <= 30) return "Próximo"
    return "Pendiente"
  }

  // Función para obtener la clase de color del badge según los días restantes
  const getBadgeClass = (daysLeft: number) => {
    if (daysLeft <= 7) {
      return "bg-destructive/10 text-destructive border-destructive"
    }
    if (daysLeft <= 30) {
      return "bg-warning/10 text-warning border-warning"
    }
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
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        {error}. Por favor, recarga la página para intentar nuevamente.
      </div>
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
              highlighted: expirationDates,
            }}
            modifiersStyles={{
              highlighted: {
                backgroundColor: "hsl(var(--warning) / 0.2)",
                color: "hsl(var(--foreground))",
                fontWeight: "bold",
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Próximos vencimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {upcomingDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mb-2 opacity-40" />
                <p>No hay documentos próximos a vencer</p>
              </div>
            ) : (
              upcomingDocs.slice(0, 5).map((doc) => {
                const daysLeft = getDaysLeft(doc.expiry_date || "")
                return (
                  <Link
                    key={doc.id}
                    href={`/dashboard/documentos/${doc.id}`}
                    className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Vence {daysLeft === 0 ? "hoy" : `en ${daysLeft} días`} (
                        {format(new Date(doc.expiry_date || ""), "dd/MM/yyyy")})
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
