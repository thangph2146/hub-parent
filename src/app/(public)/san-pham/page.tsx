import { ProductList } from "@/features/public/products/components"

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; page?: string; sortBy?: string }>
}) {
  const params = await searchParams
  
  return (
    <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-4 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-8">Sản phẩm</h1>
      <ProductList
        category={params.category}
        search={params.search}
        page={params.page ? parseInt(params.page) : 1}
        limit={12}
        sortBy={
          params.sortBy && ["price_asc", "price_desc", "name_asc", "name_desc", "created_desc"].includes(params.sortBy)
            ? (params.sortBy as "price_asc" | "price_desc" | "name_asc" | "name_desc" | "created_desc")
            : "created_desc"
        }
      />
    </div>
  )
}

