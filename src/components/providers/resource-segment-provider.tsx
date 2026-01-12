"use client"

import * as React from "react"
import { DEFAULT_RESOURCE_SEGMENT } from "@/permissions"

export const ResourceSegmentContext = React.createContext<string>(DEFAULT_RESOURCE_SEGMENT)

export interface ResourceSegmentProviderProps {
  value: string
  children: React.ReactNode
}

/**
 * Provider để quản lý resource segment (vị trí tài nguyên) trong toàn bộ ứng dụng
 * Giúp các hooks và components có thể truy cập segment hiện tại mà không cần truyền props
 */
export const ResourceSegmentProvider = ({ value, children }: ResourceSegmentProviderProps) => (
  <ResourceSegmentContext.Provider value={value}>
    {children}
  </ResourceSegmentContext.Provider>
)
