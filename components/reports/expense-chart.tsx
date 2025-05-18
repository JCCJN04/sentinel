"use client"

import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { reportsService, type ExpenseData } from "@/lib/reports-service"

interface ExpenseChartProps {
  year: string
}

export function ExpenseChart({ year }: ExpenseChartProps) {
  const [data, setData] = useState<ExpenseData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const expenseData = await reportsService.getExpensesByMonth(year)
        setData(expenseData)
      } catch (error) {
        console.error("Error al cargar datos de gastos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [year])

  if (loading) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center">
        <p className="text-muted-foreground">Cargando datos...</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center">
        <p className="text-muted-foreground">No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value) => [`$${value}`, ""]} />
        <Legend />
        <Line type="monotone" dataKey="Hogar" stroke="#0e34a0" activeDot={{ r: 8 }} />
        <Line type="monotone" dataKey="Servicios" stroke="#2f3061" />
        <Line type="monotone" dataKey="Transporte" stroke="#5f5980" />
        <Line type="monotone" dataKey="Alimentación" stroke="#28a745" />
        <Line type="monotone" dataKey="Entretenimiento" stroke="#17a2b8" />
        <Line type="monotone" dataKey="Otros" stroke="#6c757d" />
      </LineChart>
    </ResponsiveContainer>
  )
}
