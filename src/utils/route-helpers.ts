/**
 * Route helper utilities
 * Shared across features to get routes from appFeatures
 */

import { appFeatures } from "@/constants"
import { getResourceMainRoute } from "@/permissions"

/**
 * Get route from appFeatures by key
 * @param key - Feature key
 * @returns Route path or null
 */
export const getRouteFromFeature = (key: string): string | null => {
  const feature = appFeatures.find((f) => f.key === key)
  if (!feature?.navigation) return null

  const { navigation: nav } = feature
  if (nav.href) return nav.href

  if (nav.resourceName) {
    const route = getResourceMainRoute(nav.resourceName)
    return route?.path || null
  }

  return null
}
