"use client"

import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { reportsService, type CategoryCount } from "@/lib/reports-service"

interface DocumentsByCategoryProps {
  year?: string
}

export function DocumentsByCategory({ year }: DocumentsByCategoryProps) {
  const [data, setData] = useState<CategoryCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const categoryData = await reportsService.getDocumentsByCategory(year)
        setData(categoryData)
      } catch (error) {
        console.error("Error al cargar datos de categorías:", error)
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
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} documentos`, "Cantidad"]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
