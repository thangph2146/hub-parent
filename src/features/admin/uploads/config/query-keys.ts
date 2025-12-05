/**
 * Uploads Query Keys
 * Quản lý query keys cho TanStack Query
 */

export const queryKeys = {
  uploads: {
    /**
     * Tất cả uploads queries
     */
    all: (): readonly unknown[] => ["uploads"],
    
    /**
     * Images queries
     */
    images: {
      /**
       * Images list với pagination
       */
      list: (page: number, limit: number): readonly unknown[] => [
        "uploads",
        "images",
        "list",
        page,
        limit,
      ],
      /**
       * Tất cả images queries (dùng để invalidate)
       */
      all: (): readonly unknown[] => ["uploads", "images"],
    },
    
    /**
     * Folders queries
     */
    folders: {
      /**
       * Folders list
       */
      list: (): readonly unknown[] => ["uploads", "folders", "list"],
      /**
       * Tất cả folders queries (dùng để invalidate)
       */
      all: (): readonly unknown[] => ["uploads", "folders"],
    },
  },
} as const

