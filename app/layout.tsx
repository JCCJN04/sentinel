import type React from "react"
import { Inter, Roboto, Roboto_Slab } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/hooks/use-auth"
// 1. Cambia esta importación
import { Toaster } from "sonner" 
import "./globals.css"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
})
const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  variable: "--font-roboto-slab",
})

export const metadata = {
  title: "HealthPal.mx",
  description: "Tu asistente personal de salud - Gestiona tu información médica y la de tu familia de forma segura",
  generator: 'HealthPal',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
              {children}
              {/* 2. Añade la propiedad 'richColors' para los estilos de éxito/error */}
              <Toaster richColors />
            </ThemeProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
}