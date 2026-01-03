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

