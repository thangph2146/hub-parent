import type {
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";

export const ADMIN_QUERY_DEFAULTS = {
  staleTime: 0, // Admin luôn lấy dữ liệu mới nhất để tránh trường hợp dữ liệu không được cập nhật
  gcTime: 5 * 60 * 1000,
  refetchOnMount: true,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
} satisfies Partial<UseQueryOptions<unknown, Error>>;

export const ADMIN_MUTATION_DEFAULTS = {
  retry: 1 as const,
};

export const createAdminQueryOptions = <TData = unknown, TError = Error>(
  options: Omit<
    UseQueryOptions<TData, TError>,
    | "staleTime"
    | "gcTime"
    | "refetchOnMount"
    | "refetchOnWindowFocus"
    | "refetchOnReconnect"
  >
): UseQueryOptions<TData, TError> => {
  return {
    ...ADMIN_QUERY_DEFAULTS,
    ...options,
  } as UseQueryOptions<TData, TError>;
};

export const createAdminMutationOptions = <
  TData = unknown,
  TError = Error,
  TVariables = void
>(
  options: Omit<UseMutationOptions<TData, TError, TVariables>, "retry">
): UseMutationOptions<TData, TError, TVariables> => {
  return {
    ...ADMIN_MUTATION_DEFAULTS,
    ...options,
  } as UseMutationOptions<TData, TError, TVariables>;
};

export const createAdminFetchOptions = <TData = unknown>(options: {
  queryKey: readonly unknown[];
  queryFn: () => Promise<TData>;
}): {
  queryKey: readonly unknown[];
  queryFn: () => Promise<TData>;
  staleTime: number;
  gcTime: number;
  refetchOnMount: boolean;
  refetchOnWindowFocus: boolean;
  refetchOnReconnect: boolean;
} => {
  return {
    ...ADMIN_QUERY_DEFAULTS,
    ...options,
  };
};
