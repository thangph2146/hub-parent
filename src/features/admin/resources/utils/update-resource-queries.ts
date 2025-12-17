import type { useQueryClient } from "@tanstack/react-query"
import type { DataTableResult } from "@/components/tables"

export const updateResourceQueries = <T extends { id: string }, TParams = Record<string, unknown>>(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: unknown[],
  updater: (args: { key: unknown[]; params: TParams; data: DataTableResult<T> }) => DataTableResult<T> | null,
): boolean => {
  let updated = false
  const queries = queryClient.getQueriesData<DataTableResult<T>>({ queryKey })

  for (const [key, data] of queries) {
    if (!Array.isArray(key) || key.length < 2) continue
    const params = key[1] as TParams | undefined
    if (!params || !data) continue
    const next = updater({ key, params, data })
    if (next) {
      queryClient.setQueryData(key, next)
      updated = true
    }
  }

  return updated
}

