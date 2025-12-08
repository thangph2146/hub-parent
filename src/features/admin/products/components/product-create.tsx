import { getActiveCategoriesForSelect } from "@/features/admin/categories/server/queries"
import { ProductCreateClient } from "./product-create.client"

export interface ProductCreateProps {
  backUrl?: string
}

export async function ProductCreate({ backUrl = "/admin/products" }: ProductCreateProps) {
  const categories = await getActiveCategoriesForSelect()

  return <ProductCreateClient backUrl={backUrl} categories={categories} />
}

