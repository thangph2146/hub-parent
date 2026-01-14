/**
 * Public Post Detail Page
 * 
 * Server Component - handles metadata generation and data fetching
 * Pattern: Page (Server) → PostDetail (Server) → PostDetailClient (Client)
 * 
 * SEO Optimizations:
 * - Dynamic metadata với Open Graph và Twitter Cards
 * - Canonical URL để tránh duplicate content
 * - Structured data (JSON-LD) cho rich snippets
 */

import type { Metadata } from "next"
import { getPostBySlug } from "@/features/public/post/server/queries"
import { PostDetail } from "@/features/public/post/components/post-detail"
import { appConfig, getOpenGraphConfig, getTwitterConfig } from "@/constants"
import Script from "next/script"

interface PostDetailPageProps {
  params: Promise<{ slug: string }>
}

/**
 * Helper function to convert Date to ISO string
 * Handles both Date objects and string values
 */
function toISOString(date: Date | string | null | undefined): string | undefined {
  if (!date) return undefined
  if (typeof date === "string") return date
  if (date instanceof Date) return date.toISOString()
  // Fallback: convert to Date and then to ISO string
  const dateValue = date as string | number | Date
  return new Date(dateValue).toISOString()
}

export async function generateMetadata({
  params,
}: PostDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return {
      title: "Không tìm thấy",
    }
  }

  const postUrl = `${appConfig.url}/bai-viet/${slug}`
  const description = post.excerpt || `Đọc bài viết: ${post.title}`
  const imageUrl = post.image ? (post.image.startsWith('http') ? post.image : `${appConfig.url}${post.image}`) : undefined
  
  // Lấy base config từ appConfig
  const openGraphConfig = getOpenGraphConfig();
  const twitterConfig = getTwitterConfig();

  return {
    title: post.title,
    description,
    keywords: [
      ...(appConfig.keywords || []),
      ...post.categories.map(cat => cat.name),
      ...post.tags.map(tag => tag.name),
    ],
    authors: post.author.name ? [{ name: post.author.name }] : appConfig.authors,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      ...openGraphConfig,
      type: "article",
      url: postUrl,
      title: post.title,
      description,
      // Dynamic: Sử dụng hình ảnh từ bài viết nếu có, nếu không thì fallback về appConfig
      images: imageUrl ? [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ] : openGraphConfig.images,
      publishedTime: toISOString(post.publishedAt),
      modifiedTime: toISOString(post.updatedAt),
      authors: post.author.name ? [post.author.name] : undefined,
      section: post.categories[0]?.name,
      tags: post.tags.map(tag => tag.name),
    },
    twitter: {
      ...twitterConfig,
      title: post.title,
      description,
      // Dynamic: Sử dụng hình ảnh từ bài viết nếu có, nếu không thì fallback về appConfig
      images: imageUrl ? [imageUrl] : twitterConfig.images,
    },
  }
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return null
  }

  // Structured data (JSON-LD) for SEO
  const blogPostingData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.title,
    image: post.image ? (post.image.startsWith('http') ? post.image : `${appConfig.url}${post.image}`) : undefined,
    datePublished: toISOString(post.publishedAt),
    dateModified: toISOString(post.updatedAt) || new Date().toISOString(),
    author: {
      "@type": "Person",
      name: post.author.name || post.author.email,
    },
    publisher: {
      "@type": "Organization",
      name: appConfig.namePublic || appConfig.name,
      url: appConfig.url,
      logo: {
        "@type": "ImageObject",
        url: appConfig.openGraph.images[0].url,
      }
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${appConfig.url}/bai-viet/${slug}`,
    },
    articleSection: post.categories[0]?.name,
    keywords: [
      ...post.categories.map(cat => cat.name),
      ...post.tags.map(tag => tag.name),
    ].join(", "),
  }

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Trang chủ",
        "item": appConfig.url
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Bài viết",
        "item": `${appConfig.url}/bai-viet`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": `${appConfig.url}/bai-viet/${slug}`
      }
    ]
  }

  return (
    <>
      <Script
        id="post-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingData) }}
      />
      <Script
        id="breadcrumb-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <PostDetail slug={slug} />
    </>
  )
}

