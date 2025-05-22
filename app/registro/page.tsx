"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { signUp } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

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
      const { error: signUpError, data } = await signUp(email, password)

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
          title: "Registro exitoso",
          description: "Bienvenido a DocuVault",
        })
        router.push("/dashboard")
      } else {
        // Se requiere confirmación de correo
        setSuccess(
          "Se ha enviado un enlace de confirmación a su correo electrónico. Por favor verifique su bandeja de entrada.",
        )
        toast({
          title: "Registro exitoso",
          description: "Por favor verifique su correo electrónico para confirmar su cuenta",
        })
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
          <CardTitle className="text-2xl font-bold">Crear una cuenta</CardTitle>
          <CardDescription>Ingrese sus datos para registrarse en DocuVault</CardDescription>
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Registrarse"
              )}
            </Button>
            <div className="text-center text-sm">
              ¿Ya tiene una cuenta?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Iniciar sesión
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
