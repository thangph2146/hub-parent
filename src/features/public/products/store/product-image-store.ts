/**
 * Product Image Store (Zustand)
 * Quản lý UI state cho product image gallery để tránh lag và refresh dư thừa
 */

import { create } from "zustand"
import { devtools } from "zustand/middleware"

interface ProductImageState {
  // Selected image index per product
  selectedImageIndex: Record<string, number>
  
  // Scroll button visibility per product
  canScrollLeft: Record<string, boolean>
  canScrollRight: Record<string, boolean>
  
  // Preloaded images
  preloadedImages: Set<string>
  
  // Actions
  setSelectedImageIndex: (productId: string, index: number) => void
  setCanScrollLeft: (productId: string, canScroll: boolean) => void
  setCanScrollRight: (productId: string, canScroll: boolean) => void
  preloadImage: (url: string) => void
  isImagePreloaded: (url: string) => boolean
  resetProductState: (productId: string) => void
}

export const useProductImageStore = create<ProductImageState>()(
  devtools(
    (set, get) => ({
      selectedImageIndex: {},
      canScrollLeft: {},
      canScrollRight: {},
      preloadedImages: new Set<string>(),

      setSelectedImageIndex: (productId, index) =>
        set((state) => ({
          selectedImageIndex: {
            ...state.selectedImageIndex,
            [productId]: index,
          },
        })),

      setCanScrollLeft: (productId, canScroll) =>
        set((state) => ({
          canScrollLeft: {
            ...state.canScrollLeft,
            [productId]: canScroll,
          },
        })),

      setCanScrollRight: (productId, canScroll) =>
        set((state) => ({
          canScrollRight: {
            ...state.canScrollRight,
            [productId]: canScroll,
          },
        })),

      preloadImage: (url) => {
        const state = get()
        if (state.preloadedImages.has(url)) return

        const img = new Image()
        img.src = url
        set((state) => ({
          preloadedImages: new Set([...state.preloadedImages, url]),
        }))
      },

      isImagePreloaded: (url) => {
        return get().preloadedImages.has(url)
      },

      resetProductState: (productId) =>
        set((state) => {
          const newState = { ...state }
          delete newState.selectedImageIndex[productId]
          delete newState.canScrollLeft[productId]
          delete newState.canScrollRight[productId]
          return newState
        }),
    }),
    { name: "ProductImageStore" }
  )
)

