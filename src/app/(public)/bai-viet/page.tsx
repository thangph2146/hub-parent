import type { Metadata } from "next"
import { TypographyH2, TypographyPMuted } from "@/components/ui/typography"
import { Filter, Tags } from "lucide-react"
import { PostList } from "@/features/public/post/components/post-list"
import { PostCategoryNav } from "@/features/public/post/components/post-category-nav"
import { PostTagNav } from "@/features/public/post/components/post-tag-nav"
import { PostSort } from "@/features/public/post/components/post-sort"
import { PostDateRange } from "@/features/public/post/components/post-date-range"
import { getPosts, getCategories, getTags } from "@/features/public/post/server/queries"
import { appConfig, getOpenGraphConfig, getTwitterConfig } from "@/lib/config"
import { CollapsibleSection } from "@/features/public/post/components/collapsible-section"
import { PostBreadcrumb } from "@/components/public/post/post-breadcrumb"

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
    // Giữ lại images từ appConfig
    images: openGraphConfig.images,
  },
  twitter: {
    ...twitterConfig,
    title: `Bài viết - ${appConfig.name}`,
    description: `Đọc các bài viết mới nhất về tin tức, hoạt động và thông tin của ${appConfig.namePublic || appConfig.name}`,
    // Giữ lại images từ appConfig
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
      {/* Breadcrumb */}
      <div className="mb-6">
        <PostBreadcrumb
          categoryName={category?.name}
          categorySlug={category?.slug}
          tagName={tag?.name}
          tagSlug={tag?.slug}
          isListPage={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr] gap-6 sm:gap-8 lg:gap-12">
        {/* Sidebar - Category Navigation & Tags */}
        <aside className="lg:sticky lg:top-20 lg:h-fit lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
          <div className="space-y-6 mb-6 lg:mb-0">
            {/* Category Navigation */}
            <CollapsibleSection
              title="Danh mục:"
              icon={<Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
              defaultOpen={true}
            >
              <PostCategoryNav categories={categories} />
            </CollapsibleSection>

            {/* Tag Navigation */}
            <CollapsibleSection
              title="Thẻ tag:"
              icon={<Tags className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
              defaultOpen={true}
            >
              <PostTagNav tags={tags} />
            </CollapsibleSection>
          </div>
        </aside>

        {/* Main Content */}
        <div className="min-w-0">
          {/* Header with Sort and Date Range */}
          <div className="sticky top-14.5 z-10 w-full flex items-center justify-between gap-4 mb-8 border-b bg-background supports-[backdrop-filter]:bg-background/70 border-border backdrop-blur-lg">
            <div>
              <TypographyH2>Tất cả bài viết</TypographyH2>
              <TypographyPMuted className="mt-1">
                {result.pagination.total} bài viết
              </TypographyPMuted>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <PostDateRange />
              <PostSort />
            </div>
          </div>

          {/* Post List */}
          <PostList
            posts={result.data}
            currentPage={result.pagination.page}
            totalPages={result.pagination.totalPages}
          />
        </div>
      </div>
    </div>
  )
}

