import {
  applyResourceSegmentToPath,
  getResourceCreateRoute,
  getResourceMainRoute,
  getResourceSubRoutes,
  type Permission,
  type RoutePermissionConfig,
} from "@/permissions"
import { MenuItem, MenuSubItem, FeatureDefinition, FeatureKey, FeatureGroup, FeatureComponentStrategy, FeatureApiConfig } from "@/types"
import { appFeatures } from "@/constants"

export const hasAnyPermission = (required: ReadonlyArray<Permission>, granted: Permission[]): boolean => {
  if (!required.length) {
    return true
  }
  return required.some((perm) => granted.includes(perm))
}

export const buildResourceSubItems = (resourceName: string, resourceSegment: string): MenuSubItem[] => {
  const items: MenuSubItem[] = []
  const mainRoute = getResourceMainRoute(resourceName)
  if (mainRoute) {
    items.push({
      title: "Danh sách",
      url: applyResourceSegmentToPath(mainRoute.path, resourceSegment),
      permissions: mainRoute.permissions as Permission[],
    })
  }

  const createRoute = getResourceCreateRoute(resourceName)
  if (createRoute) {
    items.push({
      title: "Thêm mới",
      url: applyResourceSegmentToPath(createRoute.path, resourceSegment),
      permissions: createRoute.permissions as Permission[],
    })
  }

  getResourceSubRoutes(resourceName).forEach((route: RoutePermissionConfig) => {
    const routeName = route.path.split("/").pop() || ""
    const title = routeName
      .split("-")
      .map((segment: string) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ")
    items.push({
      title,
      url: applyResourceSegmentToPath(route.path, resourceSegment),
      permissions: route.permissions as Permission[],
    })
  })

  return items
}

export const resolveBaseUrl = (nav: { href?: string; resourceName?: string } | null | undefined, resourceSegment: string): string | null => {
  if (!nav) {
    return null
  }

  if (nav.href) {
    return applyResourceSegmentToPath(nav.href, resourceSegment)
  }

  if (nav.resourceName) {
    const route = getResourceMainRoute(nav.resourceName)
    if (!route) {
      const fallbackPath = `/admin/${nav.resourceName}`
      const baseUrl = applyResourceSegmentToPath(fallbackPath, resourceSegment)
      return baseUrl
    }
    const baseUrl = applyResourceSegmentToPath(route.path, resourceSegment)
    return baseUrl
  }

  return null
}

export const buildMenuItemFromFeature = (
  feature: FeatureDefinition,
  userPermissions: Permission[],
  resourceSegment: string,
): MenuItem | null => {
  const nav = feature.navigation
  if (!nav) {
    return null
  }

  if (!hasAnyPermission(feature.permissions, userPermissions)) {
    return null
  }

  const baseUrl = resolveBaseUrl(nav, resourceSegment)
  if (!baseUrl) {
    return null
  }

  const iconElement = feature.icon

  const subItems: MenuSubItem[] = []

  if (nav.autoGenerateSubRoutes && nav.resourceName) {
    subItems.push(...buildResourceSubItems(nav.resourceName, resourceSegment))
  }

  if (nav.subItems?.length) {
    subItems.push(
      ...nav.subItems.map((item) => ({
        ...item,
        url: item.url ? applyResourceSegmentToPath(item.url, resourceSegment) : item.url,
      })),
    )
  }

  const filteredSubItems = subItems.length
    ? subItems.filter(
        (item) => !item.permissions || hasAnyPermission(item.permissions, userPermissions),
      )
    : undefined

  const menuItem = {
    key: feature.key,
    title: feature.title,
    url: baseUrl,
    icon: iconElement,
    isActive: nav.isActive,
    items: filteredSubItems && filteredSubItems.length ? filteredSubItems : undefined,
    permissions: feature.permissions,
  }

  return menuItem
}

export const buildNavigationMenu = (
  group: FeatureGroup,
  userPermissions: Permission[],
  resourceSegment: string,
): MenuItem[] => {
  const features = (appFeatures as unknown as FeatureDefinition[]).filter((feature) => feature.navigation?.group === group)

  const sortedFeatures = features.sort((a, b) => {
    const orderA = a.navigation?.order ?? 0
    const orderB = b.navigation?.order ?? 0
    return orderA - orderB
  })

  return sortedFeatures
    .map((feature) => buildMenuItemFromFeature(feature, userPermissions, resourceSegment))
    .filter((item): item is MenuItem => Boolean(item))
}

export const getFeatureComponentStrategies = (key: FeatureKey): FeatureComponentStrategy[] =>
  (appFeatures as unknown as FeatureDefinition[]).find((feature) => feature.key === key)?.components ?? []

export const getFeatureApiConfig = (key: FeatureKey): FeatureApiConfig | undefined =>
  (appFeatures as unknown as FeatureDefinition[]).find((feature) => feature.key === key)?.api
