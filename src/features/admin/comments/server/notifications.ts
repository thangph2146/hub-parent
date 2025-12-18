import { createNotificationForAllAdmins, emitNotificationToAllAdminsAfterCreate } from "@/features/admin/notifications/server/mutations"
import { getActorInfo, logNotificationError, formatItemNames } from "@/features/admin/notifications/server/notification-helpers"
import { NotificationKind } from "@prisma/client"

export const formatCommentNames = (
  comments: Array<{ authorName: string | null; authorEmail: string; content?: string }>,
  maxDisplay: number = 3
): string => {
  return formatItemNames(
    comments,
    (c) => c.authorName || c.authorEmail || "Không xác định",
    maxDisplay,
    "bình luận"
  )
}

export const notifySuperAdminsOfCommentAction = async (
  action: "approve" | "unapprove" | "update" | "delete" | "restore" | "hard-delete",
  actorId: string,
  comment: { id: string; content: string; authorName: string | null; authorEmail: string; postTitle: string },
  changes?: {
    content?: { old: string; new: string }
    approved?: { old: boolean; new: boolean }
  }
) => {
  try {
    const actor = await getActorInfo(actorId)
    const _actorName = actor?.name || actor?.email || "Hệ thống"
    const authorName = comment.authorName || comment.authorEmail

    let title = ""
    let description = ""
    const actionUrl = `/admin/comments/${comment.id}`

    switch (action) {
      case "approve":
        title = "Bình luận được duyệt"
        description = `${authorName} - "${comment.postTitle}"`
        break
      case "unapprove":
        title = "Bình luận bị hủy duyệt"
        description = `${authorName} - "${comment.postTitle}"`
        break
      case "update":
        const changeDescriptions: string[] = []
        if (changes?.content) {
          const oldContent = changes.content.old.length > 50 ? changes.content.old.substring(0, 50) + "..." : changes.content.old
          const newContent = changes.content.new.length > 50 ? changes.content.new.substring(0, 50) + "..." : changes.content.new
          changeDescriptions.push(`Nội dung: ${oldContent} → ${newContent}`)
        }
        if (changes?.approved !== undefined) {
          changeDescriptions.push(
            `Trạng thái: ${changes.approved.old ? "Đã duyệt" : "Chưa duyệt"} → ${changes.approved.new ? "Đã duyệt" : "Chưa duyệt"}`
          )
        }
        title = "Bình luận được cập nhật"
        description = `${authorName} - "${comment.postTitle}"${changeDescriptions.length > 0 ? `\n${changeDescriptions.join(", ")}` : ""}`
        break
      case "delete":
        title = "Bình luận bị xóa"
        description = `${authorName} - "${comment.postTitle}"`
        break
      case "restore":
        title = "Bình luận được khôi phục"
        description = `${authorName} - "${comment.postTitle}"`
        break
      case "hard-delete":
        title = "Bình luận bị xóa vĩnh viễn"
        description = `${authorName} - "${comment.postTitle}"`
        break
    }

    // Tạo metadata một lần để tái sử dụng
    const metadata = {
      type: `comment_${action}`,
      actorId,
      actorName: actor?.name || actor?.email,
      actorEmail: actor?.email,
      commentId: comment.id,
      commentContent: comment.content.length > 100 ? comment.content.substring(0, 100) + "..." : comment.content,
      authorName: comment.authorName,
      authorEmail: comment.authorEmail,
      postTitle: comment.postTitle,
      ...(changes && { changes }),
      timestamp: new Date().toISOString(),
    }

    // Tạo notifications trong DB cho tất cả admin
    const result = await createNotificationForAllAdmins(
      title,
      description,
      actionUrl,
      NotificationKind.SYSTEM,
      metadata
    )

    // Emit socket event nếu có socket server
    if (result.count > 0) {
      await emitNotificationToAllAdminsAfterCreate(
        title,
        description,
        actionUrl,
        NotificationKind.SYSTEM,
        metadata
      )
    }
  } catch (error) {
    logNotificationError("comments", "notify-super-admins", { commentId: comment.id }, error)
  }
}

export const notifySuperAdminsOfBulkCommentAction = async (
  action: "approve" | "unapprove" | "delete" | "restore" | "hard-delete",
  actorId: string,
  comments: Array<{ id: string; content: string; authorName: string | null; authorEmail: string; postTitle: string }>
) => {
  if (comments.length === 0) return

  try {
    const actor = await getActorInfo(actorId)
    const _actorName = actor?.name || actor?.email || "Hệ thống"

    const namesText = formatCommentNames(comments, 3)
    const count = comments.length

    let title = ""
    let description = ""

    switch (action) {
      case "approve":
        title = `${count} Bình luận được duyệt`
        description = namesText ? `${namesText}` : `${count} bình luận`
        break
      case "unapprove":
        title = `${count} Bình luận bị hủy duyệt`
        description = namesText ? `${namesText}` : `${count} bình luận`
        break
      case "delete":
        title = `${count} Bình luận bị xóa`
        description = namesText ? `${namesText}` : `${count} bình luận`
        break
      case "restore":
        title = `${count} Bình luận được khôi phục`
        description = namesText ? `${namesText}` : `${count} bình luận`
        break
      case "hard-delete":
        title = `${count} Bình luận bị xóa vĩnh viễn`
        description = namesText ? `${namesText}` : `${count} bình luận`
        break
    }

    // Tạo metadata một lần để tái sử dụng
    const metadata = {
      type: `comment_bulk_${action}`,
      actorId,
      actorName: actor?.name || actor?.email,
      actorEmail: actor?.email,
      count,
      commentIds: comments.map((c) => c.id),
      timestamp: new Date().toISOString(),
    }

    const result = await createNotificationForAllAdmins(
      title,
      description,
      "/admin/comments",
      NotificationKind.SYSTEM,
      metadata
    )

    // Emit socket event nếu có socket server
    if (result.count > 0) {
      await emitNotificationToAllAdminsAfterCreate(
        title,
        description,
        "/admin/comments",
        NotificationKind.SYSTEM,
        metadata
      )
    }
  } catch (error) {
    logNotificationError("comments", "notify-all-admins-bulk", { count: comments.length }, error)
  }
}

