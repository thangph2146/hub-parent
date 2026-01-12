/**
 * Input Validation và Sanitization Utilities
 * Bảo vệ khỏi SQL injection, XSS, và các cuộc tấn công injection khác
 */

/**
 * Sanitize string input - loại bỏ các ký tự nguy hiểm
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== "string") return ""
  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, "") // Loại bỏ các ký tự điều khiển
    .replace(/[\uFFFE-\uFFFF]/g, "") // Loại bỏ các ký tự Unicode không hợp lệ
    .replace(/\s+/g, " ") // Normalize whitespace
}

/**
 * Sanitize email input
 */
export const sanitizeEmail = (email: string): string => sanitizeString(email).toLowerCase()

/**
 * Validate email format
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email là bắt buộc" }
  }

  const sanitized = sanitizeEmail(email)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(sanitized)) {
    return { valid: false, error: "Email không hợp lệ" }
  }

  if (sanitized.length > 255) {
    return { valid: false, error: "Email quá dài (tối đa 255 ký tự)" }
  }

  return { valid: true }
}

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "Mật khẩu là bắt buộc" }
  }

  if (password.length < 8) {
    return { valid: false, error: "Mật khẩu phải có ít nhất 8 ký tự" }
  }

  if (password.length > 128) {
    return { valid: false, error: "Mật khẩu quá dài (tối đa 128 ký tự)" }
  }

  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /\d/.test(password)

  if (!hasLetter || !hasNumber) {
    return {
      valid: false,
      error: "Mật khẩu phải chứa ít nhất một chữ cái và một số",
    }
  }

  return { valid: true }
}

/**
 * Validate string length
 */
export const validateStringLength = (
  input: string,
  min?: number,
  max?: number,
  fieldName = "Trường này"
): { valid: boolean; error?: string } => {
  if (typeof input !== "string") {
    return { valid: false, error: `${fieldName} phải là chuỗi` }
  }

  const length = input.trim().length

  if (min !== undefined && length < min) {
    return { valid: false, error: `${fieldName} phải có ít nhất ${min} ký tự` }
  }

  if (max !== undefined && length > max) {
    return { valid: false, error: `${fieldName} không được vượt quá ${max} ký tự` }
  }

  return { valid: true }
}

/**
 * Validate integer
 */
export const validateInteger = (
  input: unknown,
  min?: number,
  max?: number,
  fieldName = "Trường này"
): { valid: boolean; error?: string; value?: number } => {
  if (typeof input === "string") {
    const parsed = parseInt(input, 10)
    if (isNaN(parsed)) {
      return { valid: false, error: `${fieldName} phải là số nguyên hợp lệ` }
    }
    return validateInteger(parsed, min, max, fieldName)
  }

  if (typeof input !== "number" || !Number.isInteger(input)) {
    return { valid: false, error: `${fieldName} phải là số nguyên` }
  }

  if (min !== undefined && input < min) {
    return { valid: false, error: `${fieldName} phải lớn hơn hoặc bằng ${min}` }
  }

  if (max !== undefined && input > max) {
    return { valid: false, error: `${fieldName} phải nhỏ hơn hoặc bằng ${max}` }
  }

  return { valid: true, value: input }
}

/**
 * Validate UUID
 */
export const validateUUID = (uuid: string): { valid: boolean; error?: string } => {
  if (!uuid || typeof uuid !== "string") {
    return { valid: false, error: "UUID là bắt buộc" }
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (!uuidRegex.test(uuid)) {
    return { valid: false, error: "UUID không hợp lệ" }
  }

  return { valid: true }
}

/**
 * Validate CUID (Collision-resistant Unique Identifier)
 */
export const validateCUID = (cuid: string): { valid: boolean; error?: string } => {
  if (!cuid || typeof cuid !== "string") {
    return { valid: false, error: "CUID là bắt buộc" }
  }

  const trimmed = cuid.trim()
  
  if (trimmed.length < 20 || trimmed.length > 30) {
    return { valid: false, error: "CUID phải có độ dài từ 20-30 ký tự" }
  }

  const cuidRegex = /^[a-z0-9]{20,30}$/i

  if (!cuidRegex.test(trimmed)) {
    return { valid: false, error: "CUID không hợp lệ (chỉ chứa chữ cái và số)" }
  }

  return { valid: true }
}

/**
 * Validate ID - hỗ trợ cả UUID và CUID
 */
export const validateID = (id: string): { valid: boolean; error?: string } => {
  if (!id || typeof id !== "string") {
    return { valid: false, error: "ID là bắt buộc" }
  }

  if (validateUUID(id).valid || validateCUID(id).valid) {
    return { valid: true }
  }

  if (id.trim().length >= 10 && id.trim().length <= 50 && /^[a-zA-Z0-9_-]+$/.test(id)) {
    return { valid: true }
  }

  return { valid: false, error: "ID không hợp lệ (phải là UUID hoặc CUID format)" }
}

/**
 * Validate array
 */
export const validateArray = <T>(
  input: unknown,
  minLength?: number,
  maxLength?: number,
  fieldName = "Mảng"
): { valid: boolean; error?: string; value?: T[] } => {
  if (!Array.isArray(input)) {
    return { valid: false, error: `${fieldName} phải là một mảng` }
  }

  if (minLength !== undefined && input.length < minLength) {
    return { valid: false, error: `${fieldName} phải có ít nhất ${minLength} phần tử` }
  }

  if (maxLength !== undefined && input.length > maxLength) {
    return { valid: false, error: `${fieldName} không được vượt quá ${maxLength} phần tử` }
  }

  return { valid: true, value: input as T[] }
}

/**
 * Sanitize object - recursively sanitize all string values
 */
export const sanitizeObject = <T extends Record<string, unknown>>(obj: T): T => {
  const sanitized = { ...obj } as Record<string, unknown>

  for (const key in sanitized) {
    const value = sanitized[key]
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value)
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item: unknown) =>
        typeof item === "string" ? sanitizeString(item) : typeof item === "object" && item !== null ? sanitizeObject(item as Record<string, unknown>) : item
      )
    }
  }

  return sanitized as T
}

/**
 * Validate pagination parameters
 */
export const validatePagination = (params: {
  page?: unknown
  limit?: unknown
}): { valid: boolean; error?: string; page?: number; limit?: number } => {
  const pageValidation = validateInteger(params.page, 1, 1000, "Trang")
  if (!pageValidation.valid) {
    return pageValidation
  }

  const limitValidation = validateInteger(params.limit, 1, 100, "Giới hạn")
  if (!limitValidation.valid) {
    return limitValidation
  }

  return {
    valid: true,
    page: pageValidation.value ?? 1,
    limit: limitValidation.value ?? 10,
  }
}

/**
 * Validate enum value
 */
export const validateEnum = <T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  fieldName = "Giá trị"
): { valid: boolean; error?: string; value?: T } => {
  if (typeof value !== "string") {
    return { valid: false, error: `${fieldName} phải là chuỗi` }
  }

  if (!allowedValues.includes(value as T)) {
    return {
      valid: false,
      error: `${fieldName} phải là một trong các giá trị: ${allowedValues.join(", ")}`,
    }
  }

  return { valid: true, value: value as T }
}

/**
 * Prevent SQL injection by checking for dangerous patterns
 */
export const containsSQLInjection = (input: string): boolean => {
  if (typeof input !== "string") {
    return false
  }

  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/i,
    /(--|\/\*|\*\/|;|\||&|>|<)/,
    /(\bor\b\s*\d+\s*=\s*\d+)/i,
    /(\band\b\s*\d+\s*=\s*\d+)/i,
    /('|('|\\')|(\\";)|(\\";)|(\\)|(\\\\))/i,
  ]

  return dangerousPatterns.some((pattern) => pattern.test(input))
}

/**
 * Validate date range filter format (fromDate|toDate)
 */
const isValidDateRangeFormat = (value: string): boolean => {
  const parts = value.split("|")
  if (parts.length !== 2) return false
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  const fromStr = parts[0]?.trim()
  const toStr = parts[1]?.trim()
  
  if (fromStr && !dateRegex.test(fromStr)) return false
  if (toStr && !dateRegex.test(toStr)) return false
  if (!fromStr && !toStr) return false
  
  return true
}

/**
 * Validate và sanitize search query
 */
export const sanitizeSearchQuery = (query: string, maxLength: number | undefined = 1000): { valid: boolean; error?: string; value?: string } => {
  if (typeof query !== "string") {
    return { valid: false, error: "Truy vấn tìm kiếm phải là chuỗi" }
  }

  if (maxLength !== undefined && maxLength !== Infinity && query.length > maxLength) {
    return {
      valid: false,
      error: `Truy vấn tìm kiếm không được vượt quá ${maxLength} ký tự`,
    }
  }

  if (query.includes("|")) {
    if (isValidDateRangeFormat(query)) {
      return { valid: true, value: query }
    } else {
      return { valid: false, error: "Định dạng khoảng thời gian không hợp lệ" }
    }
  }

  if (containsSQLInjection(query)) {
    return { valid: false, error: "Truy vấn tìm kiếm chứa ký tự không hợp lệ" }
  }

  return { valid: true, value: sanitizeString(query) }
}

/**
 * Parse column filters from URL search params
 */
export const parseColumnFilters = (searchParams: URLSearchParams, maxLength: number | undefined = 1000): Record<string, string> => {
  const filters: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    if (key.startsWith("filter[")) {
      const k = key.replace("filter[", "").replace("]", "")
      const v = sanitizeSearchQuery(value, maxLength === 1000 ? Infinity : maxLength)
      if (v.valid && v.value) filters[k] = v.value
    }
  })
  return filters
}

/**
 * Build filters object from columnFilters with automatic mapping
 */
export const buildFilters = <T extends Record<string, unknown>>(
  columnFilters: Record<string, string>,
  status: "active" | "deleted" | "all",
  filterKeys: (keyof T)[]
): Partial<T> & { deleted?: boolean } => {
  const filters = {} as Partial<T> & { deleted?: boolean }
  
  if (status === "deleted") filters.deleted = true
  else if (status === "active") filters.deleted = false
  
  for (const key of filterKeys) {
    const value = columnFilters[key as string]
    if (value) {
      const keyStr = key as string
      ;(filters as Record<string, unknown>)[keyStr] = key === "approved" ? value === "true" : value
    }
  }
  
  return filters
}

/**
 * Helper function to convert filters object to undefined if empty
 */
export const filtersOrUndefined = <T extends Record<string, unknown>>(
  filters: T
): T | undefined => (Object.keys(filters).length > 0 ? filters : undefined)
