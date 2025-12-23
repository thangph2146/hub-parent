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
  content: unknown
}

export const PostContent = ({ content }: PostContentProps) => {
  // Parse content as SerializedEditorState
  let editorState: SerializedEditorState | null = null
  
  try {
    if (content && typeof content === "object") {
      editorState = content as unknown as SerializedEditorState
    }
  } catch (error) {
    console.error("[PostContent] Failed to parse editor state:", error)
  }

  if (!editorState) {
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
        editorSerializedState={editorState}
        readOnly={true}
      />
    </div>
  )
}

