'use client'

import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Stethoscope, Bell } from 'lucide-react'

interface DocumentUploadTabsProps {
  children: React.ReactNode
}

export function DocumentUploadTabs({ children }: DocumentUploadTabsProps) {
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6 sticky top-0 z-10 bg-white dark:bg-slate-900 rounded-lg">
        <TabsTrigger value="basic" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">Básica</span>
        </TabsTrigger>
        <TabsTrigger value="medical" className="flex items-center gap-2">
          <Stethoscope className="w-4 h-4" />
          <span className="hidden sm:inline">Médica</span>
        </TabsTrigger>
        <TabsTrigger value="reminders" className="flex items-center gap-2">
          <Bell className="w-4 h-4" />
          <span className="hidden sm:inline">Recordatorios</span>
        </TabsTrigger>
      </TabsList>

      {children}
    </Tabs>
  )
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
