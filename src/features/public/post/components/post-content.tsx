"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import type { SerializedEditorState } from "lexical"
import { findFirstImageSrc } from "../utils/content-helpers"
import { PriorityImageContext } from "@/components/editor/context/priority-image-context"
import { Card, TypographyPMuted } from "@/components/ui"

// Lazy load Editor component to reduce initial bundle size for mobile
// Editor contains Lexical which is a large library
const Editor = dynamic(
  () => import("@/components/editor/editor-x/editor").then(mod => ({ default: mod.Editor })),
  {
    ssr: true, // Keep SSR for SEO
    loading: () => (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    ),
  }
)

interface PostContentProps {
  content: SerializedEditorState
  isPriority?: boolean
}

export const PostContent = ({ content, isPriority = true }: PostContentProps) => {
  // Content is now typed, but we still check if it's valid
  // Prisma might return null or mismatch if schema changed
  if (!content || typeof content !== "object") {
    return (
      <Card className="border border-border/50 bg-card p-6">
        <TypographyPMuted className="text-center">
          Không có nội dung hoặc định dạng không hợp lệ
        </TypographyPMuted>
      </Card>
    )
  }

  // Find priority image (LCP) - only if requested
  const priorityImageSrc = (isPriority && content.root) ? findFirstImageSrc(content.root) : null

  return (
    <div className="w-full">
      <PriorityImageContext.Provider value={priorityImageSrc}>
        <Editor
          editorSerializedState={content}
          readOnly={true}
        />
      </PriorityImageContext.Provider>
    </div>
  )
}
