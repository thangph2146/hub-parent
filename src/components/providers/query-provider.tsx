/**
 * Query Provider (TanStack Query)
 * Cung cấp data fetching, caching và state management
 */
"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import dynamic from "next/dynamic"
import { useState, type ReactNode } from "react"

/**
 * TanStack Query configuration:
 * - staleTime: 1 minute - Data được coi là fresh trong 1 phút
 * - refetchOnWindowFocus: false - Không refetch khi focus window
 * - retry: 1 - Retry 1 lần khi failed
 */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 1,
      },
    },
  })
}

/**
 * Dynamic import ReactQueryDevtools với ssr: false
 * Chỉ render trên client để tránh hydration mismatch
 */
const ReactQueryDevtools = dynamic(
  () =>
    import("@tanstack/react-query-devtools").then((mod) => ({
      default: mod.ReactQueryDevtools,
    })),
  {
    ssr: false,
  }
)

export function QueryProvider({ children }: { children: ReactNode }) {
  // Singleton pattern: Chỉ tạo QueryClient một lần
  const [queryClient] = useState(() => createQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools chỉ hiển thị trong development và chỉ trên client */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}

