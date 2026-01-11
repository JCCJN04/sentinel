"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type ConsultationCalendarEvent = {
  id: string
  scheduledAt: string
  patientName: string
  reason: string
  status: string
}

const statusClasses: Record<string, string> = {
  scheduled: "border-sky-500/40 bg-sky-500/15 text-sky-800 dark:text-sky-200",
  completed: "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  cancelled: "border-rose-500/40 bg-rose-500/15 text-rose-800 dark:text-rose-200",
}

const statusLabels: Record<string, string> = {
  scheduled: "Programada",
  completed: "Completada",
  cancelled: "Cancelada",
}

export function ConsultationCalendar({ events }: { events: ConsultationCalendarEvent[] }) {
  const orderedEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        const aDate = new Date(a.scheduledAt).getTime()
        const bDate = new Date(b.scheduledAt).getTime()
        return aDate - bDate
      }),
    [events],
  )

  const initialDate = orderedEvents.length > 0 ? parseISO(orderedEvents[0].scheduledAt) : new Date()
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(initialDate))
  const [selectedDate, setSelectedDate] = useState(new Date())

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ConsultationCalendarEvent[]>()
    orderedEvents.forEach((event) => {
      const key = format(new Date(event.scheduledAt), "yyyy-MM-dd")
      const list = map.get(key) ?? []
      list.push(event)
      map.set(key, list)
    })
    return map
  }, [orderedEvents])

  const selectedKey = format(selectedDate, "yyyy-MM-dd")
  const selectedEvents = eventsByDate.get(selectedKey) ?? []

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1))
  }

  return (
    <Card className="border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-cyan-500/10 to-purple-500/15">
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>Calendario de consultas</CardTitle>
            <p className="text-sm text-sky-900/70 dark:text-sky-100/70">
              Navega por el mes y consulta rápidamente las citas agendadas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center font-medium capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </span>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-xl border border-sky-500/20 bg-white/70 p-4 shadow-sm shadow-sky-500/10 backdrop-blur dark:border-sky-500/30 dark:bg-slate-900/60">
            <div className="grid grid-cols-7 text-center text-xs font-semibold uppercase text-sky-900/70 dark:text-sky-100/70">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
              <span>Dom</span>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1 text-sm">
              {calendarDays.map((day) => {
                const key = format(day, "yyyy-MM-dd")
                const dayEvents = eventsByDate.get(key) ?? []
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isSelected = isSameDay(day, selectedDate)
                const today = isToday(day)

                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "flex h-20 flex-col rounded-lg border p-2 text-left transition",
                      isSelected
                        ? "border-sky-500 bg-sky-500/10 shadow-sm shadow-sky-500/30"
                        : "border-transparent hover:border-sky-500/40 hover:bg-sky-500/10",
                      !isCurrentMonth && "opacity-40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                        today
                          ? "bg-purple-600 text-white"
                          : isSelected
                            ? "bg-sky-600 text-white"
                            : "text-slate-700 dark:text-slate-200",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    <div className="mt-2 flex flex-1 flex-col gap-1 overflow-hidden">
                      {dayEvents.slice(0, 3).map((event) => (
                        <span
                          key={event.id}
                          className="truncate rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[11px] text-sky-900 dark:text-sky-200"
                        >
                          {format(new Date(event.scheduledAt), "HH:mm")} · {event.patientName}
                        </span>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="truncate text-[11px] font-medium text-slate-600 dark:text-slate-300/80">
                          +{dayEvents.length - 3} más
                        </span>
                      )}
                    </div>
                  </button>
                )}
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Día seleccionado</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                </p>
              </div>
              <Button asChild size="sm" className="bg-purple-600 text-white shadow-sm shadow-purple-500/30 hover:bg-purple-700">
                <Link href={`/doctor/consultas/nueva?date=${format(selectedDate, "yyyy-MM-dd")}`}>
                  <Plus className="mr-1 h-4 w-4" /> Agendar consulta
                </Link>
              </Button>
            </div>

            <div className="space-y-3">
              {selectedEvents.length === 0 ? (
                <p className="rounded-lg border border-sky-500/20 bg-white/70 p-4 text-sm text-slate-600 shadow-sm shadow-sky-500/10 dark:border-sky-500/30 dark:bg-slate-900/60 dark:text-slate-300/80">
                  No hay consultas registradas para esta fecha.
                </p>
              ) : (
                selectedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="space-y-2 rounded-lg border border-sky-500/20 bg-white/70 p-4 shadow-sm shadow-sky-500/10 backdrop-blur dark:border-sky-500/30 dark:bg-slate-900/60"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{event.patientName}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300/80">{event.reason}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={statusClasses[event.status] ?? "border-slate-300/40"}
                      >
                        {statusLabels[event.status] ?? event.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300/80">
                      <span>{format(new Date(event.scheduledAt), "HH:mm")}</span>
                      <Button asChild variant="ghost" size="sm" className="text-sky-700 hover:bg-sky-500/15 hover:text-sky-800 dark:text-sky-200">
                        <Link href={`/doctor/consultas/${event.id}`}>Ver detalles</Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
