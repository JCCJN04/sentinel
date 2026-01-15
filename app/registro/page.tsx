"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Users, Stethoscope } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const userType = searchParams.get('tipo') || 'paciente' // 'paciente' o 'doctor'
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { signUp } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const isDoctor = userType === 'doctor'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Validación básica
      if (!email || !password) {
        setError("Por favor complete todos los campos")
        return
      }

      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden")
        return
      }

      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres")
        return
      }

      // Intentar registrar al usuario
      const { error: signUpError, data } = await signUp(email, password, {
        data: {
          user_type: isDoctor ? 'doctor' : 'paciente'
        }
      })

      if (signUpError) {
        console.error("Error de registro:", signUpError)

        // Mensajes de error más amigables
        if (signUpError.message.includes("already registered")) {
          setError("Este correo electrónico ya está registrado. Por favor inicie sesión.")
        } else {
          setError(`Error al registrarse: ${signUpError.message}`)
        }

        return
      }

      // Verificar si se requiere confirmación de correo
      if (data?.user && data?.session) {
        // Registro exitoso con sesión automática
        toast({
          title: "¡Bienvenido!",
          description: `Tu cuenta ${isDoctor ? 'de doctor' : ''} ha sido creada correctamente`,
        })
        
        // Redirigir según el tipo de usuario
        router.push(isDoctor ? "/doctor" : "/dashboard")
      } else {
        // Se requiere confirmación de correo
        setSuccess(
          `Te hemos enviado un enlace de confirmación. Revisa tu correo electrónico y luego inicia sesión en el portal de ${isDoctor ? 'doctores' : 'pacientes'}.`,
        )
        toast({
          title: "Cuenta creada",
          description: "Revisa tu correo para confirmar tu cuenta",
        })
        
        // Redirigir al login correspondiente después de 3 segundos
        setTimeout(() => {
          router.push(`/login?tipo=${isDoctor ? 'doctor' : 'paciente'}`)
        }, 3000)
      }
    } catch (err: any) {
      console.error("Error de registro:", err)
      setError(`Error inesperado: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {isDoctor ? (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 p-2.5 shadow-lg">
                <Stethoscope className="h-full w-full text-white" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 dark:from-emerald-400 dark:to-cyan-500 p-2.5 shadow-lg">
                <Users className="h-full w-full text-white" />
              </div>
            )}
          </div>
          <CardTitle className={`text-2xl font-bold ${
            isDoctor 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400' 
              : 'bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400'
          } bg-clip-text text-transparent`}>
            {isDoctor ? 'Registro para Doctores' : 'Crear Cuenta'}
          </CardTitle>
          <CardDescription>
            {isDoctor 
              ? 'Únete a nuestra plataforma médica profesional' 
              : 'Ingresa tus datos para registrarte'}
          </CardDescription>
          <div className="pt-2">
            <Link 
              href={`/registro?tipo=${isDoctor ? 'paciente' : 'doctor'}`}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              ¿Quieres registrarte como {isDoctor ? 'paciente' : 'doctor'}? Haz clic aquí
            </Link>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
              {success && (
              // Quita variant="success" y deja que className maneje el estilo
              <Alert className="bg-success/20 text-success border-success">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">La contraseña debe tener al menos 6 caracteres</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className={`w-full ${
                isDoctor 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' 
                  : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700'
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  {isDoctor ? <Stethoscope className="mr-2 h-4 w-4" /> : <Users className="mr-2 h-4 w-4" />}
                  Registrarse como {isDoctor ? 'Doctor' : 'Paciente'}
                </>
              )}
            </Button>
            <div className="text-center text-sm">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Iniciar sesión
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
