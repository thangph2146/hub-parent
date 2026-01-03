"use client"

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb"

export interface PostBreadcrumbProps {
  /**
   * Tiêu đề bài viết hiện tại (cho trang chi tiết)
   */
  postTitle?: string
  /**
   * Tên danh mục (nếu có)
   */
  categoryName?: string
  /**
   * Slug của danh mục (nếu có)
   */
  categorySlug?: string
  /**
   * Tên tag (nếu có)
   */
  tagName?: string
  /**
   * Slug của tag (nếu có)
   */
  tagSlug?: string
  /**
   * Có phải trang danh sách bài viết không
   */
  isListPage?: boolean
}

/**
 * Breadcrumb component cho các trang bài viết
 * Hiển thị đường dẫn điều hướng: Trang chủ > Bài viết > [Danh mục/Tag] > [Tiêu đề bài viết]
 */
export function PostBreadcrumb({
  postTitle,
  categoryName,
  categorySlug,
  tagName,
  tagSlug,
  isListPage = false,
}: PostBreadcrumbProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        {/* Trang danh sách bài viết */}
        {isListPage && !postTitle && (
          <>
            <BreadcrumbItem>
              <BreadcrumbPage>Bài viết</BreadcrumbPage>
            </BreadcrumbItem>
            {categoryName && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{categoryName}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
            {tagName && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{tagName}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </>
        )}

        {/* Trang chi tiết bài viết */}
        {!isListPage && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink href="/bai-viet">Bài viết</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />

            {/* Danh mục */}
            {categoryName && (
              <>
                <BreadcrumbItem>
                  {categorySlug ? (
                    <BreadcrumbLink href={`/bai-viet?category=${categorySlug}`}>
                      {categoryName}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{categoryName}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}

            {/* Tag */}
            {tagName && (
              <>
                <BreadcrumbItem>
                  {tagSlug ? (
                    <BreadcrumbLink href={`/bai-viet?tag=${tagSlug}`}>
                      {tagName}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{tagName}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}

            {/* Tiêu đề bài viết */}
            {postTitle && (
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1 max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
                  {postTitle}
                </BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
