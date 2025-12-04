export const CONTACT_REQUEST_STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  NEW: "default",
  IN_PROGRESS: "secondary",
  RESOLVED: "outline",
  CLOSED: "destructive",
} as const

export const CONTACT_REQUEST_PRIORITY_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  LOW: "outline",
  MEDIUM: "default",
  HIGH: "secondary",
  URGENT: "destructive",
} as const

