"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Check, ChevronDown, X } from "lucide-react"
import { useRouter } from "next/navigation"
import type { DoctorProfile } from "@/types/doctor"
import { updateDoctorProfileAction } from "./actions"

// Catálogo de especialidades médicas en México
const MEDICAL_SPECIALTIES = [
  "Anestesiología",
  "Cardiología",
  "Cirugía General",
  "Cirugía Plástica y Reconstructiva",
  "Dermatología",
  "Endocrinología",
  "Gastroenterología",
  "Geriatría",
  "Ginecología y Obstetricia",
  "Hematología",
  "Infectología",
  "Medicina del Deporte",
  "Medicina Familiar",
  "Medicina Interna",
  "Nefrología",
  "Neumología",
  "Neurología",
  "Neurocirugía",
  "Nutriología",
  "Oftalmología",
  "Oncología",
  "Ortopedia y Traumatología",
  "Otorrinolaringología",
  "Pediatría",
  "Psiquiatría",
  "Radiología e Imagen",
  "Reumatología",
  "Urología",
  "Otro",
]

const LANGUAGES = [
  "Español",
  "Inglés",
  "Francés",
  "Alemán",
  "Italiano",
  "Portugués",
  "Chino",
  "Japonés",
]

const SUBSPECIALTIES = [
  "Cardiología Intervencionista",
  "Electrofisiología",
  "Ecocardiografía",
  "Cirugía Laparoscópica",
  "Cirugía Bariátrica",
  "Cirugía de Mínima Invasión",
  "Dermatología Estética",
  "Dermatología Pediátrica",
  "Cirugía Dermatológica",
  "Diabetes",
  "Tiroides",
  "Obesidad",
  "Gastroenterología Pediátrica",
  "Endoscopia",
  "Hepatología",
  "Ginecología Oncológica",
  "Medicina Materno-Fetal",
  "Reproducción Asistida",
  "Neurología Pediátrica",
  "Epilepsia",
  "Cefaleas",
  "Oncología Médica",
  "Oncología Pediátrica",
  "Radioterapia",
  "Pediatría de Urgencias",
  "Neonatología",
  "Neumología Pediátrica",
  "Psiquiatría Infantil",
  "Psiquiatría Geriátrica",
  "Adicciones",
]

interface DoctorSettingsFormProps {
  doctorProfile: DoctorProfile
}

export function DoctorSettingsForm({ doctorProfile }: DoctorSettingsFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    specialty: doctorProfile.specialty || "",
    subspecialties: doctorProfile.subspecialties || [],
    professional_id: doctorProfile.professional_id || "",
    phone_number: doctorProfile.phone_number || "",
    office_address: doctorProfile.office_address || "",
    bio: doctorProfile.bio || "",
    years_experience: doctorProfile.years_experience || 0,
    languages: doctorProfile.languages || [],
    consultation_fee: doctorProfile.consultation_fee || 0,
    consultation_duration_minutes: doctorProfile.consultation_duration_minutes || 30,
    accepts_new_patients: doctorProfile.accepts_new_patients ?? true,
  })

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    doctorProfile.languages || []
  )
  
  const [selectedSubspecialties, setSelectedSubspecialties] = useState<string[]>(
    doctorProfile.subspecialties || []
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const updateData = {
        specialty: formData.specialty,
        subspecialties: selectedSubspecialties.length > 0 ? selectedSubspecialties : null,
        professional_id: formData.professional_id || null,
        phone_number: formData.phone_number || null,
        office_address: formData.office_address || null,
        bio: formData.bio || null,
        years_experience: formData.years_experience || null,
        languages: selectedLanguages,
        consultation_fee: formData.consultation_fee || null,
        consultation_duration_minutes: formData.consultation_duration_minutes,
        accepts_new_patients: formData.accepts_new_patients,
      }

      const result = await updateDoctorProfileAction(doctorProfile.id, updateData)

      if (result.success) {
        setMessage({ type: "success", text: "Perfil actualizado correctamente" })
        router.refresh()
      } else {
        setMessage({ type: "error", text: result.error || "Error al actualizar el perfil" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error inesperado al actualizar el perfil" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string | number | string[] | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleLanguage = (language: string) => {
    setSelectedLanguages(prev => 
      prev.includes(language)
        ? prev.filter(l => l !== language)
        : [...prev, language]
    )
  }

  const toggleSubspecialty = (subspecialty: string) => {
    setSelectedSubspecialties(prev => 
      prev.includes(subspecialty)
        ? prev.filter(s => s !== subspecialty)
        : [...prev, subspecialty]
    )
  }

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 5) return `+${numbers.slice(0, 2)} ${numbers.slice(2)}`
    if (numbers.length <= 9) return `+${numbers.slice(0, 2)} ${numbers.slice(2, 5)} ${numbers.slice(5)}`
    return `+${numbers.slice(0, 2)} ${numbers.slice(2, 5)} ${numbers.slice(5, 8)} ${numbers.slice(8, 12)}`
  }

  return (
    <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-sky-500/10 to-emerald-500/15">
      <CardHeader className="space-y-4 pb-6 sm:pb-6 px-5 sm:px-6 pt-6 sm:pt-6">
        <div className="flex flex-col gap-4 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2 sm:space-y-1.5">
            <CardTitle className="text-2xl sm:text-2xl font-bold leading-tight">
              Información Personal
            </CardTitle>
            <CardDescription className="text-base sm:text-sm leading-relaxed">
              Actualiza tu información profesional y de contacto
            </CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className="self-start border-purple-500/40 bg-purple-500/15 text-purple-800 dark:text-purple-200 sm:self-center px-3 py-1.5 text-sm font-medium"
          >
            Perfil Profesional
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-5 sm:px-6 pb-6">
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-6">
          <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
            {/* Especialidad */}
            <div className="space-y-2.5 sm:space-y-2">
              <Label htmlFor="specialty" className="text-base sm:text-sm font-medium">
                Especialidad *
              </Label>
              <Select
                value={formData.specialty}
                onValueChange={(value) => handleChange("specialty", value)}
                required
              >
                <SelectTrigger className="border-purple-500/30 bg-white/80 dark:bg-slate-900/80 h-12 sm:h-10 text-base">
                  <SelectValue placeholder="Selecciona tu especialidad" />
                </SelectTrigger>
                <SelectContent>
                  {MEDICAL_SPECIALTIES.map((specialty) => (
                    <SelectItem key={specialty} value={specialty} className="text-base sm:text-sm py-3 sm:py-2">
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cédula Profesional */}
            <div className="space-y-2.5 sm:space-y-2">
              <Label htmlFor="professional_id" className="text-base sm:text-sm font-medium">
                Cédula Profesional
              </Label>
              <Input
                id="professional_id"
                value={formData.professional_id}
                onChange={(e) => handleChange("professional_id", e.target.value)}
                placeholder="Número de cédula"
                className="border-purple-500/30 bg-white/80 dark:bg-slate-900/80 h-12 sm:h-10 text-base px-4"
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-2.5 sm:space-y-2">
              <Label htmlFor="phone_number" className="text-base sm:text-sm font-medium">
                Teléfono de Consultorio
              </Label>
              <Input
                id="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value)
                  handleChange("phone_number", formatted)
                }}
                placeholder="+52 81 1234 5678"
                maxLength={20}
                className="border-purple-500/30 bg-white/80 dark:bg-slate-900/80 h-12 sm:h-10 text-base px-4"
              />
              <p className="text-sm sm:text-xs text-muted-foreground mt-1.5">
                Formato internacional automático
              </p>
            </div>

            {/* Años de experiencia */}
            <div className="space-y-2.5 sm:space-y-2">
              <Label htmlFor="years_experience" className="text-base sm:text-sm font-medium">
                Años de Experiencia
              </Label>
              <Select
                value={formData.years_experience.toString()}
                onValueChange={(value) => handleChange("years_experience", parseInt(value))}
              >
                <SelectTrigger className="border-purple-500/30 bg-white/80 dark:bg-slate-900/80 h-12 sm:h-10 text-base">
                  <SelectValue placeholder="Selecciona años" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0" className="text-base sm:text-sm py-3 sm:py-2">Menos de 1 año</SelectItem>
                  <SelectItem value="1" className="text-base sm:text-sm py-3 sm:py-2">1 año</SelectItem>
                  <SelectItem value="2" className="text-base sm:text-sm py-3 sm:py-2">2 años</SelectItem>
                  <SelectItem value="3" className="text-base sm:text-sm py-3 sm:py-2">3 años</SelectItem>
                  <SelectItem value="4" className="text-base sm:text-sm py-3 sm:py-2">4 años</SelectItem>
                  <SelectItem value="5" className="text-base sm:text-sm py-3 sm:py-2">5 años</SelectItem>
                  <SelectItem value="6" className="text-base sm:text-sm py-3 sm:py-2">6-10 años</SelectItem>
                  <SelectItem value="10" className="text-base sm:text-sm py-3 sm:py-2">10-15 años</SelectItem>
                  <SelectItem value="15" className="text-base sm:text-sm py-3 sm:py-2">15-20 años</SelectItem>
                  <SelectItem value="20" className="text-base sm:text-sm py-3 sm:py-2">20-25 años</SelectItem>
                  <SelectItem value="25" className="text-base sm:text-sm py-3 sm:py-2">25+ años</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tarifa de consulta */}
            <div className="space-y-2.5 sm:space-y-2">
              <Label htmlFor="consultation_fee" className="text-base sm:text-sm font-medium">
                Tarifa de Consulta (MXN)
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-base">$</span>
                <Input
                  id="consultation_fee"
                  type="text"
                  inputMode="numeric"
                  value={formData.consultation_fee === 0 ? "" : formData.consultation_fee}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, "")
                    const numValue = value === "" ? 0 : parseFloat(value)
                    if (!isNaN(numValue)) {
                      handleChange("consultation_fee", numValue)
                    }
                  }}
                  onFocus={(e) => {
                    if (formData.consultation_fee === 0) {
                      e.target.value = ""
                    }
                  }}
                  placeholder="800.00"
                  className="border-purple-500/30 bg-white/80 dark:bg-slate-900/80 pl-8 h-12 sm:h-10 text-base px-4"
                />
              </div>
              <p className="text-sm sm:text-xs text-muted-foreground mt-1.5">
                Tarifa por consulta en pesos mexicanos
              </p>
            </div>

            {/* Duración de consulta */}
            <div className="space-y-2.5 sm:space-y-2">
              <Label htmlFor="consultation_duration" className="text-base sm:text-sm font-medium">
                Duración de Consulta (minutos)
              </Label>
              <Select
                value={formData.consultation_duration_minutes.toString()}
                onValueChange={(value) => handleChange("consultation_duration_minutes", parseInt(value))}
              >
                <SelectTrigger className="border-purple-500/30 bg-white/80 dark:bg-slate-900/80 h-12 sm:h-10 text-base">
                  <SelectValue placeholder="Selecciona duración" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15" className="text-base sm:text-sm py-3 sm:py-2">15 minutos</SelectItem>
                  <SelectItem value="20" className="text-base sm:text-sm py-3 sm:py-2">20 minutos</SelectItem>
                  <SelectItem value="30" className="text-base sm:text-sm py-3 sm:py-2">30 minutos</SelectItem>
                  <SelectItem value="45" className="text-base sm:text-sm py-3 sm:py-2">45 minutos</SelectItem>
                  <SelectItem value="60" className="text-base sm:text-sm py-3 sm:py-2">60 minutos</SelectItem>
                  <SelectItem value="90" className="text-base sm:text-sm py-3 sm:py-2">90 minutos</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm sm:text-xs text-muted-foreground mt-1.5">
                Tiempo promedio por consulta
              </p>
            </div>

            {/* Acepta nuevos pacientes */}
            <div className="space-y-3 sm:space-y-2 md:col-span-2">
              <Label className="text-base sm:text-sm font-medium">Estado de Disponibilidad</Label>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant={formData.accepts_new_patients ? "default" : "outline"}
                  onClick={() => handleChange("accepts_new_patients", true)}
                  className={`flex-1 h-12 sm:h-10 text-base sm:text-sm font-medium ${
                    formData.accepts_new_patients
                      ? "bg-gradient-to-r from-emerald-600 to-green-500 text-white hover:opacity-90"
                      : "border-emerald-500/30 hover:bg-emerald-500/10"
                  }`}
                >
                  ✓ Acepto nuevos pacientes
                </Button>
                <Button
                  type="button"
                  variant={!formData.accepts_new_patients ? "default" : "outline"}
                  onClick={() => handleChange("accepts_new_patients", false)}
                  className={`flex-1 h-12 sm:h-10 text-base sm:text-sm font-medium ${
                    !formData.accepts_new_patients
                      ? "bg-gradient-to-r from-amber-600 to-orange-500 text-white hover:opacity-90"
                      : "border-amber-500/30 hover:bg-amber-500/10"
                  }`}
                >
                  No acepto nuevos pacientes
                </Button>
              </div>
              <p className="text-sm sm:text-xs text-muted-foreground mt-1.5">
                Indica si actualmente estás aceptando nuevos pacientes
              </p>
            </div>

            {/* Subespecialidades */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm sm:text-base">Subespecialidades (opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full justify-between border-purple-500/30 bg-white/80 hover:bg-purple-500/5 dark:bg-slate-900/80 h-auto min-h-[3rem] sm:min-h-[2.5rem] py-2.5 sm:py-2 text-sm sm:text-base"
                  >
                    <div className="flex flex-wrap gap-2 sm:gap-1.5 flex-1">
                      {selectedSubspecialties.length > 0 ? (
                        selectedSubspecialties.map((subspecialty) => (
                          <Badge
                            key={subspecialty}
                            variant="secondary"
                            className="bg-sky-500/15 text-sky-700 dark:text-sky-300 hover:bg-sky-500/25 text-xs sm:text-sm px-2 py-1"
                          >
                            {subspecialty}
                            <button
                              type="button"
                              className="ml-1.5 hover:text-sky-900 dark:hover:text-sky-100 p-0.5"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleSubspecialty(subspecialty)
                              }}
                            >
                              <X className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                            </button>
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm sm:text-base">Selecciona subespecialidades...</span>
                      )}
                    </div>
                    <ChevronDown className="h-5 w-5 sm:h-4 sm:w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[calc(100vw-2rem)] sm:w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar subespecialidad..." className="h-12 sm:h-10 text-base" />
                    <CommandList className="max-h-[60vh] sm:max-h-[300px]">
                      <CommandEmpty className="py-6 text-center text-sm">No se encontró la subespecialidad.</CommandEmpty>
                      <CommandGroup>
                        {SUBSPECIALTIES.map((subspecialty) => (
                          <CommandItem
                            key={subspecialty}
                            onSelect={() => toggleSubspecialty(subspecialty)}
                            className="py-3 sm:py-2 text-base sm:text-sm"
                          >
                            <Check
                              className={`mr-2 h-5 w-5 sm:h-4 sm:w-4 ${
                                selectedSubspecialties.includes(subspecialty)
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            {subspecialty}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Puedes seleccionar múltiples subespecialidades
              </p>
            </div>

            {/* Idiomas */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm sm:text-base">Idiomas que hablas</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full justify-between border-purple-500/30 bg-white/80 hover:bg-purple-500/5 dark:bg-slate-900/80 h-auto min-h-[3rem] sm:min-h-[2.5rem] py-2.5 sm:py-2 text-sm sm:text-base"
                  >
                    <div className="flex flex-wrap gap-2 sm:gap-1.5 flex-1">
                      {selectedLanguages.length > 0 ? (
                        selectedLanguages.map((language) => (
                          <Badge
                            key={language}
                            variant="secondary"
                            className="bg-purple-500/15 text-purple-700 dark:text-purple-300 hover:bg-purple-500/25 text-xs sm:text-sm px-2 py-1"
                          >
                            {language}
                            <button
                              type="button"
                              className="ml-1.5 hover:text-purple-900 dark:hover:text-purple-100 p-0.5"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleLanguage(language)
                              }}
                            >
                              <X className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                            </button>
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm sm:text-base">Selecciona idiomas...</span>
                      )}
                    </div>
                    <ChevronDown className="h-5 w-5 sm:h-4 sm:w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[calc(100vw-2rem)] sm:w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar idioma..." className="h-12 sm:h-10 text-base" />
                    <CommandList className="max-h-[60vh] sm:max-h-[300px]">
                      <CommandEmpty className="py-6 text-center text-sm">No se encontró el idioma.</CommandEmpty>
                      <CommandGroup>
                        {LANGUAGES.map((language) => (
                          <CommandItem
                            key={language}
                            onSelect={() => toggleLanguage(language)}
                            className="py-3 sm:py-2 text-base sm:text-sm"
                          >
                            <Check
                              className={`mr-2 h-5 w-5 sm:h-4 sm:w-4 ${
                                selectedLanguages.includes(language)
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            {language}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Puedes seleccionar múltiples idiomas
              </p>
            </div>
          </div>

          {/* Dirección del consultorio */}
          <div className="space-y-2.5 sm:space-y-2">
            <Label htmlFor="office_address" className="text-base sm:text-sm font-medium">
              Dirección del Consultorio
            </Label>
            <Textarea
              id="office_address"
              value={formData.office_address}
              onChange={(e) => handleChange("office_address", e.target.value)}
              placeholder="Dirección completa de tu consultorio"
              rows={3}
              className="border-purple-500/30 bg-white/80 dark:bg-slate-900/80 text-base sm:text-base resize-none px-4 py-3 leading-relaxed"
            />
          </div>

          {/* Biografía */}
          <div className="space-y-2.5 sm:space-y-2">
            <Label htmlFor="bio" className="text-base sm:text-sm font-medium">
              Biografía Profesional
            </Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              placeholder="Breve descripción sobre tu experiencia y enfoque médico..."
              rows={5}
              className="border-purple-500/30 bg-white/80 dark:bg-slate-900/80 text-base sm:text-base resize-none px-4 py-3 leading-relaxed"
            />
            <p className="text-sm sm:text-xs text-muted-foreground mt-1.5">
              Esta información será visible para tus pacientes
            </p>
          </div>

          {/* Mensaje de estado */}
          {message && (
            <div
              className={`rounded-lg p-4 sm:p-4 text-base sm:text-base font-medium ${
                message.type === "success"
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
                  : "bg-rose-500/15 border border-rose-500/30 text-rose-800 dark:text-rose-200"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.refresh()}
              disabled={isLoading}
              className="w-full border-slate-500/40 text-slate-700 hover:bg-slate-500/15 dark:text-slate-200 sm:w-auto h-12 sm:h-10 text-base sm:text-sm font-medium px-6"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 via-sky-500 to-emerald-500 text-white hover:opacity-90 sm:w-auto h-12 sm:h-10 text-base sm:text-sm font-medium px-6"
            >
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
