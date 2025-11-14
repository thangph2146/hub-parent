import { NextRequest, NextResponse } from "next/server"
import { updatePost, deletePost, type AuthContext, type UpdatePostInput, ApplicationError, NotFoundError } from "@/features/admin/posts/server/mutations"
import { createPutRoute, createDeleteRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { validateID } from "@/lib/api/validation"
import type { Prisma } from "@prisma/client"

async function putPostHandler(req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  const { params } = args[0] as { params: Promise<{ id: string }> }
  const { id } = await params

  const idValidation = validateID(id)
  if (!idValidation.valid) {
    return NextResponse.json({ error: idValidation.error || "ID không hợp lệ" }, { status: 400 })
  }

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại." }, { status: 400 })
  }

  const ctx: AuthContext = {
    actorId: context.session.user?.id ?? "unknown",
    permissions: context.permissions,
    roles: context.roles,
  }

  // Validate và transform payload thành UpdatePostInput
  const updateInput: UpdatePostInput = {}
  
  if (payload.title !== undefined) {
    updateInput.title = typeof payload.title === "string" ? payload.title : String(payload.title)
  }
  if (payload.content !== undefined) {
    updateInput.content = payload.content as Prisma.InputJsonValue
  }
  if (payload.excerpt !== undefined) {
    updateInput.excerpt = payload.excerpt === null ? null : typeof payload.excerpt === "string" ? payload.excerpt : String(payload.excerpt)
  }
  if (payload.slug !== undefined) {
    updateInput.slug = typeof payload.slug === "string" ? payload.slug : String(payload.slug)
  }
  if (payload.image !== undefined) {
    updateInput.image = payload.image === null ? null : typeof payload.image === "string" ? payload.image : String(payload.image)
  }
  if (payload.published !== undefined) {
    updateInput.published = typeof payload.published === "boolean" ? payload.published : Boolean(payload.published)
  }
  if (payload.publishedAt !== undefined) {
    updateInput.publishedAt = payload.publishedAt === null 
      ? null 
      : payload.publishedAt instanceof Date 
        ? payload.publishedAt 
        : typeof payload.publishedAt === "string" 
          ? new Date(payload.publishedAt) 
          : null
  }
  if (payload.authorId !== undefined) {
    updateInput.authorId = typeof payload.authorId === "string" ? payload.authorId : String(payload.authorId)
  }

  try {
    const updated = await updatePost(ctx, id, updateInput)
    return NextResponse.json({ data: updated })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message || "Không tìm thấy bài viết" }, { status: 404 })
    }
    if (error instanceof ApplicationError) {
      return NextResponse.json({ error: error.message || "Không thể cập nhật bài viết" }, { status: error.status || 400 })
    }
    console.error("Error updating post:", error)
    return NextResponse.json({ error: "Đã xảy ra lỗi khi cập nhật bài viết" }, { status: 500 })
  }
}

async function deletePostHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  const { params } = args[0] as { params: Promise<{ id: string }> }
  const { id } = await params

  const idValidation = validateID(id)
  if (!idValidation.valid) {
    return NextResponse.json({ error: idValidation.error }, { status: 400 })
  }

  const ctx: AuthContext = {
    actorId: context.session.user?.id ?? "unknown",
    permissions: context.permissions,
    roles: context.roles,
  }

  try {
    await deletePost(ctx, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message || "Không tìm thấy bài viết" }, { status: 404 })
    }
    if (error instanceof ApplicationError) {
      return NextResponse.json({ error: error.message || "Không thể xóa bài viết" }, { status: error.status || 400 })
    }
    console.error("Error deleting post:", error)
    return NextResponse.json({ error: "Đã xảy ra lỗi khi xóa bài viết" }, { status: 500 })
  }
}

export const PUT = createPutRoute(putPostHandler)
export const DELETE = createDeleteRoute(deletePostHandler)

