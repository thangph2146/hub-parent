import type { UseQueryOptions, UseMutationOptions } from "@tanstack/react-query"

export const ADMIN_QUERY_DEFAULTS = {
  staleTime: 30 * 1000, // 30 seconds - giảm số lần refetch không cần thiết
  gcTime: 5 * 60 * 1000,
  refetchOnMount: false as const, // Chỉ refetch khi data thực sự stale
  refetchOnWindowFocus: false as const,
  refetchOnReconnect: false as const,
} satisfies Partial<UseQueryOptions<unknown, Error>>

export const ADMIN_MUTATION_DEFAULTS = {
  retry: 1 as const,
}

export const createAdminQueryOptions = <TData = unknown, TError = Error>(
  options: Omit<
    UseQueryOptions<TData, TError>,
    "staleTime" | "gcTime" | "refetchOnMount" | "refetchOnWindowFocus" | "refetchOnReconnect"
  >
): UseQueryOptions<TData, TError> => {
  return {
    ...ADMIN_QUERY_DEFAULTS,
    ...options,
  } as UseQueryOptions<TData, TError>
}

export const createAdminMutationOptions = <TData = unknown, TError = Error, TVariables = void>(
  options: Omit<UseMutationOptions<TData, TError, TVariables>, "retry">
): UseMutationOptions<TData, TError, TVariables> => {
  return {
    ...ADMIN_MUTATION_DEFAULTS,
    ...options,
  } as UseMutationOptions<TData, TError, TVariables>
}

export const createAdminFetchOptions = <TData = unknown>(
  options: {
    queryKey: readonly unknown[]
    queryFn: () => Promise<TData>
  }
): {
  queryKey: readonly unknown[]
  queryFn: () => Promise<TData>
  staleTime: number
  gcTime: number
  refetchOnMount: false
  refetchOnWindowFocus: false
  refetchOnReconnect: false
} => {
  return {
    ...ADMIN_QUERY_DEFAULTS,
    ...options,
  }
}

