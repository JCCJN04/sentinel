// components/documentos/columns.tsx
'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export type Document = {
  id: string
  name: string
  category: string
  status: string
  date: string
  file_url: string
  file_type: string
}

export const columns = ({ onPreview }: { onPreview: (document: Document) => void }): ColumnDef<Document>[] => [
  {
    accessorKey: 'name',
    header: 'Nombre',
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: 'category',
    header: 'Categoría',
    cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge>,
  },
  {
    accessorKey: 'date',
    header: 'Fecha',
    cell: ({ row }) => {
      const date = new Date(row.original.date)
      return new Intl.DateTimeFormat('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date)
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
        const status = row.original.status
        let color = ''
        switch (status) {
            case 'vigente':
                color = 'bg-green-500/20 text-green-700'
                break
            case 'próximo a vencer':
                color = 'bg-yellow-500/20 text-yellow-700'
                break
            case 'vencido':
                color = 'bg-red-500/20 text-red-700'
                break
        }
        return <Badge className={`capitalize ${color}`}>{status}</Badge>
    }
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Acciones</div>,
    cell: ({ row }) => {
      const document = row.original

      return (
        <div className="text-right">
          {/* BOTÓN DE PREVISUALIZACIÓN */}
          <Button variant="ghost" size="icon" onClick={() => onPreview(document)}>
            <Eye className="h-4 w-4" />
            <span className="sr-only">Previsualizar</span>
          </Button>

          {/* MENÚ DE MÁS OPCIONES */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Opciones</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/documentos/${document.id}`}>Ver detalles</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Compartir</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]