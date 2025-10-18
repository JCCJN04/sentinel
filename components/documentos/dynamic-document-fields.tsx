'use client'

import { ReactNode } from 'react'
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UseFormReturn } from 'react-hook-form'
import { DocumentType } from '@/hooks/useDocumentTypeDetection'

interface DynamicFieldConfig {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'textarea' | 'select'
  placeholder?: string
  description?: string
  options?: { value: string; label: string }[]
}

const DOCUMENT_TYPE_FIELDS: Record<DocumentType, DynamicFieldConfig[]> = {
  medical_report: [
    {
      name: 'doctor_name',
      label: 'Nombre del Doctor',
      type: 'text',
      placeholder: 'Dr. Juan Pérez',
      description: 'Médico que elaboró el reporte',
    },
    {
      name: 'specialty',
      label: 'Especialidad',
      type: 'text',
      placeholder: 'Cardiología, Neurología, etc.',
      description: 'Especialidad médica',
    },
    {
      name: 'patient_name',
      label: 'Nombre del Paciente',
      type: 'text',
      placeholder: 'Tu nombre',
      description: 'Paciente evaluado',
    },
  ],
  lab_test: [
    {
      name: 'doctor_name',
      label: 'Laboratorio / Centro',
      type: 'text',
      placeholder: 'Nombre del laboratorio',
      description: 'Dónde se realizó el análisis',
    },
    {
      name: 'patient_name',
      label: 'Nombre del Paciente',
      type: 'text',
      placeholder: 'Tu nombre',
      description: 'Paciente evaluado',
    },
  ],
  receipt: [
    {
      name: 'provider',
      label: 'Proveedor / Farmacia',
      type: 'text',
      placeholder: 'Nombre del proveedor',
      description: 'Dónde compraste los medicamentos o servicios',
    },
    {
      name: 'amount',
      label: 'Monto',
      type: 'number',
      placeholder: '0.00',
      description: 'Cantidad pagada',
    },
    {
      name: 'currency',
      label: 'Moneda',
      type: 'select',
      options: [
        { value: 'USD', label: 'USD - Dólar' },
        { value: 'COP', label: 'COP - Peso Colombiano' },
        { value: 'MXN', label: 'MXN - Peso Mexicano' },
        { value: 'EUR', label: 'EUR - Euro' },
        { value: 'ARS', label: 'ARS - Peso Argentino' },
        { value: 'CLP', label: 'CLP - Peso Chileno' },
      ],
    },
  ],
  prescription: [
    {
      name: 'doctor_name',
      label: 'Médico Prescriptor',
      type: 'text',
      placeholder: 'Dr. Juan Pérez',
      description: 'Médico que prescribió',
    },
    {
      name: 'specialty',
      label: 'Especialidad',
      type: 'text',
      placeholder: 'Cardiología, Neurología, etc.',
      description: 'Especialidad médica',
    },
  ],
  insurance: [
    {
      name: 'provider',
      label: 'Aseguradora',
      type: 'text',
      placeholder: 'Nombre de la aseguradora',
      description: 'Compañía de seguros',
    },
  ],
  vaccination: [
    {
      name: 'specialty',
      label: 'Centro de Vacunación',
      type: 'text',
      placeholder: 'Centro de Salud / Clínica',
      description: 'Dónde te vacunaron',
    },
  ],
  unknown: [],
}

interface DynamicFieldsProps {
  form: UseFormReturn<any>
  detectedType: DocumentType
  show?: boolean
}

export function DynamicDocumentFields({
  form,
  detectedType,
  show = true,
}: DynamicFieldsProps) {
  const fields = DOCUMENT_TYPE_FIELDS[detectedType]

  if (!show || fields.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
        ℹ️ Campos sugeridos para {detectedType === 'lab_test' ? 'análisis' : detectedType === 'medical_report' ? 'reportes médicos' : detectedType === 'receipt' ? 'recibos' : 'este tipo de documento'}
      </p>
      <div className="space-y-4">
        {fields.map((field) => (
          <DynamicField key={field.name} form={form} field={field} />
        ))}
      </div>
    </div>
  )
}

interface DynamicFieldProps {
  form: UseFormReturn<any>
  field: DynamicFieldConfig
}

function DynamicField({ form, field }: DynamicFieldProps) {
  return (
    <FormField
      control={form.control}
      name={field.name}
      render={({ field: fieldProps }) => (
        <FormItem>
          <FormLabel className="text-sm">{field.label}</FormLabel>
          <FormControl>
            {field.type === 'text' && (
              <Input
                placeholder={field.placeholder}
                {...fieldProps}
              />
            )}
            {field.type === 'number' && (
              <Input
                type="number"
                placeholder={field.placeholder}
                step="0.01"
                {...fieldProps}
              />
            )}
            {field.type === 'date' && (
              <Input type="date" {...fieldProps} />
            )}
            {field.type === 'textarea' && (
              <Textarea
                placeholder={field.placeholder}
                rows={2}
                {...fieldProps}
              />
            )}
            {field.type === 'select' && (
              <Select
                onValueChange={fieldProps.onChange}
                value={fieldProps.value || ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormControl>
          {field.description && (
            <FormDescription className="text-xs">
              {field.description}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
