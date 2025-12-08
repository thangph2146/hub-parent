export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  sku: string
  price: string
  compareAtPrice: string | null
  stock: number
  status: string
  featured: boolean
  images?: Array<{
    id: string
    url: string
    alt: string | null
    order: number
    isPrimary: boolean
  }>
  categories?: Array<{
    id: string
    name: string
    slug: string
  }>
}

export interface ProductDetail extends Product {
  images: Array<{
    id: string
    url: string
    alt: string | null
    order: number
    isPrimary: boolean
  }>
  categories: Array<{
    id: string
    name: string
    slug: string
  }>
  relatedProductIds?: string[]
}

