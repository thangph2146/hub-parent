/**
 * Shared Components Barrel Export
 * 
 * Export các shared/common components từ một nơi
 * 
 * Note: PermissionRouter là Server Component, không export từ đây
 * Import trực tiếp từ "@/components/layouts/shared/permission/permission-router"
 */

export { HeroSection } from "./hero-section"
export { ModeToggle } from "./mode-toggle"
export { ForbiddenNotice } from "./permission/forbidden-notice"
export { UnauthenticatedNotice } from "./permission/unauthenticated-notice"
export { PermissionGate } from "./permission/gate/permission-gate"

