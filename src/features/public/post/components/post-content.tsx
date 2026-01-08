"use client"

import dynamic from "next/dynamic"
import { Card } from "@/components/ui/card"
import { TypographyPMuted } from "@/components/ui/typography"
import type { SerializedEditorState } from "lexical"
import { findFirstImageSrc } from "../utils/content-helpers"
import { PriorityImageContext } from "@/components/editor/context/priority-image-context"

// Lazy load Editor component to reduce initial bundle size for mobile
// Editor contains Lexical which is a large library
const Editor = dynamic(
  () => import("@/components/editor/editor-x/editor").then(mod => ({ default: mod.Editor })),
  {
    ssr: true, // Keep SSR for SEO
    loading: () => (
      <Card className="border border-border/50 bg-card p-6">
        <TypographyPMuted className="text-center">
          Đang tải nội dung...
        </TypographyPMuted>
      </Card>
    ),
  }
)

interface PostContentProps {
  content: SerializedEditorState
}

export const PostContent = ({ content }: PostContentProps) => {
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

  // Find priority image (LCP)
  const priorityImageSrc = content.root ? findFirstImageSrc(content.root) : null

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
