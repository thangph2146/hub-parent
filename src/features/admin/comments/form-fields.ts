import type { ResourceFormField, ResourceFormSection } from "@/features/admin/resources/components"
import React from "react"
import { MessageSquare, User, Mail, FileText } from "lucide-react"

export interface CommentFormData {
  content: string
  authorName: string | null
  authorEmail: string
  postTitle: string
  [key: string]: unknown
}

export const getCommentFormSections = (): ResourceFormSection[] => [
  {
    id: "basic",
    title: "Thông tin cơ bản",
    description: "Thông tin về bình luận, người bình luận và bài viết",
  },
]

export const getBaseCommentFields = (): ResourceFormField<CommentFormData>[] => [
  {
    name: "content",
    label: "Nội dung",
    type: "textarea",
    placeholder: "Nội dung bình luận",
    required: true,
    icon: React.createElement(MessageSquare, { className: "h-4 w-4" }),
    section: "basic",
    className: "col-span-full",
  },
  {
    name: "authorName",
    label: "Người bình luận",
    type: "text",
    placeholder: "Tên người bình luận",
    icon: React.createElement(User, { className: "h-4 w-4" }),
    section: "basic",
  },
  {
    name: "authorEmail",
    label: "Email",
    type: "email",
    placeholder: "email@example.com",
    icon: React.createElement(Mail, { className: "h-4 w-4" }),
    section: "basic",
  },
  {
    name: "postTitle",
    label: "Bài viết",
    type: "text",
    placeholder: "Tiêu đề bài viết",
    icon: React.createElement(FileText, { className: "h-4 w-4" }),
    section: "basic",
  },
]

