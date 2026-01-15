"use client"

import type React from "react"

import { useState } from "react"
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
import { supabaseBrowserClient as supabase } from "@/lib/supabase"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const userType = searchParams.get('tipo') || 'paciente' // 'paciente' o 'doctor'
  const isDoctor = userType === 'doctor'
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validación básica
      if (!email || !password) {
        setError("Por favor ingrese su correo electrónico y contraseña")
        setIsLoading(false)
        return
      }

      // Intentar iniciar sesión
      const { error: signInError } = await signIn(email, password)

      if (signInError) {
        console.error("Login error:", signInError)

        // Mensaje de error más amigable
        if (signInError.message === "Invalid login credentials") {
          setError("Credenciales inválidas. Por favor verifique su correo y contraseña.")
        } else {
          setError(`Error al iniciar sesión: ${signInError.message}`)
        }

        return
      }

      // Verificar el tipo de usuario del perfil
      const { data: { user } } = await supabase.auth.getUser()
      const userTypeFromProfile = user?.user_metadata?.user_type || 'paciente'
      
      // Verificar si el tipo coincide
      if (isDoctor && userTypeFromProfile !== 'doctor') {
        setError("Esta cuenta no es de doctor. Por favor usa el login de pacientes.")
        await supabase.auth.signOut()
        return
      }
      
      if (!isDoctor && userTypeFromProfile === 'doctor') {
        setError("Esta cuenta es de doctor. Por favor usa el login de doctores.")
        await supabase.auth.signOut()
        return
      }

      // Éxito - redirigir según el tipo
      toast({
        title: "Bienvenido",
        description: `Has iniciado sesión correctamente como ${isDoctor ? 'doctor' : 'paciente'}`,
      })

      router.push(isDoctor ? "/doctor" : "/dashboard")
    } catch (err: any) {
      console.error("Login error:", err)
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
            {isDoctor ? 'Login Doctores' : 'Iniciar Sesión'}
          </CardTitle>
          <CardDescription>
            {isDoctor 
              ? 'Acceso exclusivo para profesionales médicos' 
              : 'Ingresa tus credenciales para continuar'}
          </CardDescription>
          <div className="pt-2">
            <Link 
              href={`/login?tipo=${isDoctor ? 'paciente' : 'doctor'}`}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              ¿Eres {isDoctor ? 'paciente' : 'doctor'}? Haz clic aquí
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link href="/recuperar-password" className="text-sm text-primary hover:underline">
                  ¿Olvidaste su contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  Iniciando sesión...
                </>
              ) : (
                <>
                  {isDoctor ? <Stethoscope className="mr-2 h-4 w-4" /> : <Users className="mr-2 h-4 w-4" />}
                  Iniciar sesión como {isDoctor ? 'Doctor' : 'Paciente'}
                </>
              )}
            </Button>
            <div className="text-center text-sm">
              ¿No tienes cuenta?{" "}
              <Link href={`/registro?tipo=${userType}`} className="text-primary hover:underline font-medium">
                Crear cuenta
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
