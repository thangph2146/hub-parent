export interface CartItem {
  id: string
  productId: string
  productName: string
  productSlug: string
  productImage: string | null
  price: string
  quantity: number
  total: string
}

export interface Cart {
  id: string
  items: CartItem[]
  subtotal: string
  total: string
  itemCount: number
}

