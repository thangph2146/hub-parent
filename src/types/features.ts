import type * as React from "react"
import type { Permission } from "@/permissions"
import type { MenuSubItem } from "./navigation"

export type FeatureGroup = "main" | "secondary" | "public"
export type ComponentRenderMode = "static" | "dynamic"

export interface FeatureComponentStrategy {
  id: string
  label: string
  mode: ComponentRenderMode
  modulePath: string
  description?: string
}

export interface FeatureNavigationConfig {
  group: FeatureGroup
  order: number
  resourceName?: string
  href?: string
  isActive?: boolean
  autoGenerateSubRoutes?: boolean
  subItems?: ReadonlyArray<MenuSubItem>
}

export interface FeatureApiConfig {
  type: "resource" | "custom"
  resourceName?: string
  alias?: string
}

export interface FeatureDefinition {
  key: string
  title: string
  description?: string
  permissions: ReadonlyArray<Permission>
  icon: React.ReactElement
  navigation?: FeatureNavigationConfig
  components?: FeatureComponentStrategy[]
  api?: FeatureApiConfig
}

export type FeatureKey = string
