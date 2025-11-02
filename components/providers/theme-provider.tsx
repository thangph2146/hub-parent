/**
 * Theme Provider (Dark Mode Support)
 * Wrapper cho next-themes ThemeProvider
 */
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * ThemeProvider configuration:
 * - attribute="class": Sử dụng class để toggle theme
 * - defaultTheme="system": Mặc định theo system preference
 * - enableSystem: Cho phép detect system preference
 * - disableTransitionOnChange: Tắt transition để tránh flash
 */
const defaultProps = {
  attribute: "class" as const,
  defaultTheme: "system" as const,
  enableSystem: true,
  disableTransitionOnChange: true,
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...defaultProps} {...props}>
      {children}
    </NextThemesProvider>
  )
}

