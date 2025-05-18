"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { reportsService, type MonthlyCount } from "@/lib/reports-service"

interface DocumentsByMonthProps {
  year: string
}

export function DocumentsByMonth({ year }: DocumentsByMonthProps) {
  const [data, setData] = useState<MonthlyCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const monthlyData = await reportsService.getDocumentsByMonth(year)
        setData(monthlyData)
      } catch (error) {
        console.error("Error al cargar datos mensuales:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [year])

  if (loading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <p className="text-muted-foreground">Cargando datos...</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <p className="text-muted-foreground">No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => [`${value} documentos`, "Cantidad"]} />
          <Bar dataKey="documentos" fill="#0e34a0" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
