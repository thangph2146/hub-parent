import type { Metadata } from "next"
import { TypographyH1, TypographyPMuted } from "@/components/ui/typography"
import { PostPageClient } from "@/features/public/post/components/post-page-client"
import { PostSort } from "@/features/public/post/components/post-sort"
import { PostDateRange } from "@/features/public/post/components/post-date-range"
import { getPosts, getCategories, getTags } from "@/features/public/post/server/queries"
import { appConfig, getOpenGraphConfig, getTwitterConfig } from "@/constants"
import { PostBreadcrumb } from "@/features/public/post/components"
import { PostSidebarSheet } from "@/features/public/post/components/post-sidebar-sheet"

const openGraphConfig = getOpenGraphConfig();
const twitterConfig = getTwitterConfig();

export const metadata: Metadata = {
  title: {
    absolute: `Bài viết | ${appConfig.name}`,
  },
  description: `Đọc các bài viết mới nhất về tin tức, hoạt động và thông tin của ${appConfig.namePublic || appConfig.name}`,
  openGraph: {
    ...openGraphConfig,
    url: `${appConfig.url}/bai-viet`,
    title: `Bài viết - ${appConfig.name}`,
    description: `Đọc các bài viết mới nhất về tin tức, hoạt động và thông tin của ${appConfig.namePublic || appConfig.name}`,
    images: openGraphConfig.images,
  },
  twitter: {
    ...twitterConfig,
    title: `Bài viết - ${appConfig.name}`,
    description: `Đọc các bài viết mới nhất về tin tức, hoạt động và thông tin của ${appConfig.namePublic || appConfig.name}`,
    images: twitterConfig.images,
  },
}

interface PostPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    category?: string | string[]
    tag?: string | string[]
    sort?: string
    dateFrom?: string
    dateTo?: string
  }>
}

export default async function PostPage({ searchParams }: PostPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || "1", 10)
  const limit = 12

  // Normalize category and tag to arrays
  const categoriesParam = Array.isArray(params.category)
    ? params.category
    : params.category
      ? [params.category]
      : []
  const tagsParam = Array.isArray(params.tag)
    ? params.tag
    : params.tag
      ? [params.tag]
      : []

  const [result, categories, tags] = await Promise.all([
    getPosts({
      page,
      limit,
      search: params.search,
      categories: categoriesParam,
      tags: tagsParam,
      sort: (params.sort as "newest" | "oldest") || "newest",
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    }),
    getCategories(),
    getTags(),
  ])

  // Get category and tag names for breadcrumb
  const firstCategorySlug = categoriesParam[0]
  const firstTagSlug = tagsParam[0]
  const category = firstCategorySlug
    ? categories.find(cat => cat.slug === firstCategorySlug)
    : null
  const tag = firstTagSlug
    ? tags.find(t => t.slug === firstTagSlug)
    : null

  return (
    <div className="container min-h-[calc(100vh-64px)] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 xl:py-12">
      {/* Breadcrumb */}
      <div className="mb-4 sm:mb-6">
        <PostBreadcrumb
          categoryName={category?.name}
          categorySlug={category?.slug}
          tagName={tag?.name}
          tagSlug={tag?.slug}
          isListPage={true}
        />
      </div>

      {/* Main Content */}
      <div className="min-w-0">
        {/* Header with Sort and Date Range */}
        <div className="sticky top-14 z-10 w-full mx-auto flex items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8 px-4 sm:px-0 -mx-4 sm:mx-0 py-3 sm:py-0 border-b bg-background/95 supports-[backdrop-filter]:bg-background/80 border-border backdrop-blur-lg overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div>
              <TypographyH1 className="text-base sm:text-xl lg:text-2xl whitespace-nowrap">Tất cả bài viết</TypographyH1>
              <TypographyPMuted className="mt-0.5 text-[10px] sm:text-sm lg:text-base whitespace-nowrap">
                {result.pagination.total} bài viết
              </TypographyPMuted>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <PostDateRange />
            <PostSort />
            {/* Mobile Filter Button */}
            <PostSidebarSheet categories={categories} tags={tags} />
          </div>
        </div>

        {/* Post List */}
        <PostPageClient
          posts={result.data}
          currentPage={result.pagination.page}
          totalPages={result.pagination.totalPages}
        />
      </div>
    </div>
  )
}

