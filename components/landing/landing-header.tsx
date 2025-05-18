"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">Database</span>
          </Link>
        </div>

        {/* Navegación para escritorio */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="#beneficios"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Beneficios
          </Link>
          <Link
            href="#casos-de-uso"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Casos de uso
          </Link>
          <Link
            href="#precios"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Precios
          </Link>
          <Link href="#faq" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            FAQ
          </Link>
        </nav>

        {/* Botones de autenticación para escritorio */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/login">
            <Button variant="outline">Iniciar sesión</Button>
          </Link>
          <Link href="/registro">
            <Button>Crear cuenta</Button>
          </Link>
        </div>

        {/* Botón de menú móvil */}
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Menú móvil */}
      {isMenuOpen && (
        <div className="md:hidden container py-4 bg-background">
          <nav className="flex flex-col gap-4">
            <Link
              href="#beneficios"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Beneficios
            </Link>
            <Link
              href="#casos-de-uso"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Casos de uso
            </Link>
            <Link
              href="#precios"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Precios
            </Link>
            <Link
              href="#faq"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              FAQ
            </Link>
            <div className="flex flex-col gap-2 pt-4 border-t">
              <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  Iniciar sesión
                </Button>
              </Link>
              <Link href="/registro" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full">Crear cuenta</Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
