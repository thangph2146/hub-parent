/**
 * Cached Database Queries for Contact Requests
 * 
 * Sử dụng unstable_cache (Data Cache) kết hợp với React cache (Request Memoization)
 * - unstable_cache: Cache kết quả giữa các requests (Persisted Cache)
 * - React cache: Deduplicate requests trong cùng một render pass
 * 
 * Pattern: Server Component → Cache Function → Database Query
 */

import { cache } from "react"
import { unstable_cache } from "next/cache"
import { resourceLogger } from "@/lib/config"
import { listContactRequests, getContactRequestById, getContactRequestColumnOptions } from "./queries"
import type { ListContactRequestsInput, ListContactRequestsResult, ContactRequestDetail } from "../types"

/**
 * Cache function: List contact requests
 * Caching strategy: Cache by params string
 */
function normalizeParams(params: ListContactRequestsInput): ListContactRequestsInput {
  return {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    search: params.search?.trim() || undefined,
    filters: params.filters || {},
    status: params.status ?? "active",
  }
}

export const listContactRequestsCached = cache(async (params: ListContactRequestsInput = {}): Promise<ListContactRequestsResult> => {
  const normalizedParams = normalizeParams(params)
  const cacheKey = JSON.stringify(normalizedParams)
  const status = normalizedParams.status ?? "active"
  const statusTag = status === "deleted" ? "deleted-contact-requests" : status === "active" ? "active-contact-requests" : "all-contact-requests"
  
  resourceLogger.cache({
    resource: "contact-requests",
    action: "query",
    operation: "read",
    tags: ['contact-requests', statusTag],
    metadata: { cacheKey, params: normalizedParams },
  })
  
  return unstable_cache(
    async () => listContactRequests(normalizedParams),
    ['contact-requests-list', cacheKey],
    {
      tags: ['contact-requests', statusTag],
      revalidate: 3600
    }
  )()
})

/**
 * Cache function: Get contact request by ID
 * Caching strategy: Cache by ID
 */
export const getContactRequestDetailById = cache(async (id: string): Promise<ContactRequestDetail | null> => {
  resourceLogger.cache({
    resource: "contact-requests",
    action: "query",
    operation: "read",
    resourceId: id,
    tags: ['contact-requests', `contact-request-${id}`],
    metadata: { contactRequestId: id, type: "detail" },
  })
  
  return unstable_cache(
    async () => getContactRequestById(id),
    [`contact-request-${id}`],
    { 
      tags: ['contact-requests', `contact-request-${id}`],
      revalidate: 3600 
    }
  )()
})

/**
 * Cache function: Get contact request column options for filters
 * Caching strategy: Cache by column and search
 */
export const getContactRequestColumnOptionsCached = cache(
  async (
    column: string,
    search?: string,
    limit: number = 50
  ): Promise<Array<{ label: string; value: string }>> => {
    const cacheKey = `${column}-${search || ''}-${limit}`
    
    resourceLogger.cache({
      resource: "contact-requests",
      action: "query",
      operation: "read",
      tags: ['contact-requests', 'contact-request-options'],
      metadata: { cacheKey, column, search, limit, type: "options" },
    })
    
    return unstable_cache(
      async () => getContactRequestColumnOptions(column, search, limit),
      [`contact-request-options-${cacheKey}`],
      { 
        tags: ['contact-requests', 'contact-request-options'],
        revalidate: 3600 
      }
    )()
  }
)
