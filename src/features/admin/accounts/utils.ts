export const validateName = (value: unknown): { valid: boolean; error?: string } => {
  if (value && typeof value === "string" && value.trim().length < 2) {
    return { valid: false, error: "Tên phải có ít nhất 2 ký tự" }
  }
  return { valid: true }
}

export const validatePassword = (value: unknown, allowEmpty = false): { valid: boolean; error?: string } => {
  if (allowEmpty && (!value || value === "")) {
    return { valid: true }
  }
  if (!value || value === "" || typeof value !== "string") {
    return { valid: false, error: "Mật khẩu là bắt buộc" }
  }
  if (value.length < 6) {
    return { valid: false, error: "Mật khẩu phải có ít nhất 6 ký tự" }
  }
  return { valid: true }
}

export const getUserInitials = (name?: string | null, email?: string): string => {
  if (name) {
    const parts = name.trim().split(" ")
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase()
  }
  return email ? email.substring(0, 2).toUpperCase() : "U"
}

type StructuredAddress = {
  address?: string
  ward?: string
  district?: string
  city?: string
  postalCode?: string
}

type ParsedAddress = {
  addressStreet?: string | null
  addressWard?: string | null
  addressDistrict?: string | null
  addressCity?: string | null
  addressPostalCode?: string | null
}

const ADDRESS_FIELD_MAP: Record<string, string> = {
  addressStreet: "address",
  addressWard: "ward",
  addressDistrict: "district",
  addressCity: "city",
  addressPostalCode: "postalCode",
}

export const parseAddressToFormFields = (address: string | null): ParsedAddress => {
  if (!address) return {}
  try {
    const parsed = typeof address === "string" ? JSON.parse(address) : address
    if (parsed && typeof parsed === "object" && parsed !== null) {
      return {
        addressStreet: parsed.address || null,
        addressWard: parsed.ward || null,
        addressDistrict: parsed.district || null,
        addressCity: parsed.city || null,
        addressPostalCode: parsed.postalCode || null,
      }
    }
  } catch {
    // Legacy support: keep as simple string
  }
  return {}
}

export const parseAddressToStructured = (address: string | null): StructuredAddress | null => {
  if (!address) return null
  try {
    const parsed = typeof address === "string" ? JSON.parse(address) : address
    if (parsed && typeof parsed === "object" && parsed !== null) {
      return parsed as StructuredAddress
    }
  } catch {
    // If not JSON, return null
  }
  return null
}

export const formatAddressForDisplay = (address: string | null): string => {
  if (!address) return ""
  const structured = parseAddressToStructured(address)
  if (structured) {
    const parts = [
      structured.address,
      structured.ward,
      structured.district,
      structured.city,
      structured.postalCode,
    ].filter(Boolean)
    return parts.join(", ")
  }
  return address
}

export const transformAddressFieldsForSubmit = (
  data: Record<string, unknown>
): string | null => {
  const structuredAddress: Record<string, string> = {}
  Object.entries(ADDRESS_FIELD_MAP).forEach(([field, key]) => {
    const value = data[field]
    if (value && typeof value === "string" && value.trim() !== "") {
      structuredAddress[key] = value.trim()
    }
  })

  if (Object.keys(structuredAddress).length > 0) {
    return JSON.stringify(structuredAddress)
  }

  return data.address === "" ? null : (data.address as string | null)
}

