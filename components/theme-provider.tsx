"use client"

import * as React from "react" // Import React for React.ComponentProps
import { ThemeProvider as NextThemesProvider } from "next-themes" // Removed ThemeProviderProps from import

// Infer ThemeProviderProps directly from the NextThemesProvider component
type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}