"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import type { ProductsResult } from "../server/queries"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductListPagination } from "./product-list-pagination"

export interface ProductListClientProps {
  initialData: ProductsResult
}

export function ProductListClient({ initialData }: ProductListClientProps) {
  const [data] = useState(initialData)

  if (data.products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Không tìm thấy sản phẩm nào</p>
        <Button asChild variant="outline">
          <Link href="/san-pham">Xem tất cả sản phẩm</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {data.products.map((product) => {
        const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0]
        const price = parseFloat(product.price)
        const comparePrice = product.compareAtPrice ? parseFloat(product.compareAtPrice) : null

        return (
          <Card key={product.id} className="flex flex-col hover:shadow-lg transition-shadow">
            <Link href={`/san-pham/${product.slug}`} className="flex flex-col flex-1">
              <CardHeader className="p-0">
                {primaryImage ? (
                  <div className="relative w-full aspect-square overflow-hidden">
                    <Image
                      src={primaryImage.url}
                      alt={primaryImage.alt || product.name}
                      fill
                      className="object-cover rounded-t-lg transition-transform hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-muted rounded-t-lg flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">No Image</span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-1 p-3 md:p-4">
                <CardTitle className="text-base md:text-lg mb-2 line-clamp-2 min-h-[3rem]">
                  {product.name}
                </CardTitle>
                {product.shortDescription && (
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-3 md:mb-4">
                    {product.shortDescription}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-base md:text-lg font-bold">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(price)}
                  </span>
                  {comparePrice && comparePrice > price && (
                    <span className="text-xs md:text-sm text-muted-foreground line-through">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(comparePrice)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Link>
            <CardFooter className="p-3 md:p-4 pt-0">
              <Button asChild className="w-full text-sm md:text-base">
                <Link href={`/san-pham/${product.slug}`}>Xem chi tiết</Link>
              </Button>
            </CardFooter>
          </Card>
        )
      })}
      </div>
      
      {data.totalPages > 1 && (
        <ProductListPagination currentPage={data.page} totalPages={data.totalPages} />
      )}
    </>
  )
}

