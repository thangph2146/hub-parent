"use client"

import { Editor } from "@/components/blocks/editor-x/editor"
import { Card } from "@/components/ui/card"
import type { SerializedEditorState } from "lexical"

interface PostContentProps {
  content: unknown
}

export function PostContent({ content }: PostContentProps) {
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
        <div className="text-sm text-muted-foreground text-center">
          Không có nội dung hoặc định dạng không hợp lệ
        </div>
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

