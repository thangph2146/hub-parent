import { ProductDetail } from "@/features/public/products/components"

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <ProductDetail slug={slug} />
}

