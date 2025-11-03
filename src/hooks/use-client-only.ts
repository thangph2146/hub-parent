/**
 * Custom hook để chỉ render component sau khi đã mount trên client
 * 
 * Sử dụng để fix hydration mismatch với các component sử dụng:
 * - useId() với Radix UI components
 * - Browser-only APIs
 * - Client-only libraries
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const mounted = useClientOnly()
 *   
 *   if (!mounted) {
 *     return <FallbackUI />
 *   }
 *   
 *   return <ComponentWithUseId />
 * }
 * ```
 * 
 * @see src/components/providers/client-only-provider.tsx - Provider version (for comparison)
 */
/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useLayoutEffect, useState } from "react"

export function useClientOnly(): boolean {
  const [mounted, setMounted] = useState(false)

  // Use useLayoutEffect để set mounted synchronously before browser paint
  // This prevents hydration mismatch with useId() in Radix UI components
  // Note: setState in effect is intentional here for hydration fixes
  // This is a recommended pattern by Next.js and React team for hydration issues
  useLayoutEffect(() => {
    setMounted(true)
  }, [])

  return mounted
}

