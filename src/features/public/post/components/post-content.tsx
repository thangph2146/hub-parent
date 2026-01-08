"use client"

import dynamic from "next/dynamic"
import { Card } from "@/components/ui/card"
import { TypographyPMuted } from "@/components/ui/typography"
import type { SerializedEditorState } from "lexical"

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

  return (
    <div className="w-full">
      <Editor
        editorSerializedState={content}
        readOnly={true}
      />
    </div>
  )
}
