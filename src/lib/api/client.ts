/**
 * Lightweight API client helpers
 * Standardize success/error shape for fetch requests.
 */

export interface ApiResult<T = unknown> {
  ok: boolean
  status: number
  data?: T
  message?: string
  error?: string
}

export async function requestJson<T = unknown>(input: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(input, init)
    const status = res.status

    let json: unknown = null
    try {
      json = await res.json()
    } catch {
      // no-op: some endpoints might not return JSON
    }

    // Normalize fields
    const asObj = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" ? (v as Record<string, unknown>) : null)
    const obj = asObj(json)
    const message = (obj?.message as string) || (res.ok ? "Thao tác thành công" : undefined)
    const error = (obj?.error as string) || (!res.ok ? res.statusText || "Đã xảy ra lỗi" : undefined)

    return {
      ok: res.ok,
      status,
      data: ((obj && (obj.data as T)) ?? (json as T)) as T,
      message,
      error,
    }
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : "Không thể kết nối máy chủ",
    }
  }
}

export function toJsonBody(payload?: unknown): RequestInit {
  return {
    headers: { "Content-Type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined,
  }
}
