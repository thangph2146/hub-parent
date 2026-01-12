export interface ResourceMapEntry {
  /** Key được dùng trong apiRoutes hoặc các config khác */
  key: string
  /** Tên resource tương ứng trong route-config (slug) */
  resourceName: string
  /** Có bỏ qua resource này không (ví dụ pivot tables) */
  enabled?: boolean
}
