import { resourceLogger } from "@/utils";
import {
  createNotificationForAllAdmins,
  emitNotificationToAllAdminsAfterCreate,
} from "@/features/admin/notifications/server/mutations";
import {
  getActorInfo,
  formatItemNames,
  logNotificationError,
} from "@/features/admin/notifications/server/notification-helpers";
import { NotificationKind } from "@prisma/client";

const formatPostTitles = (
  posts: Array<{ title: string }>,
  maxTitles = 3
): string => {
  return formatItemNames(posts, (p) => p.title, maxTitles, "bài viết");
};

export const notifySuperAdminsOfPostAction = async (
  action: "create" | "update" | "delete" | "restore" | "hard-delete",
  actorId: string,
  targetPost: { id: string; title: string; slug: string },
  changes?: {
    title?: { old: string; new: string };
    published?: { old: boolean; new: boolean };
  }
) => {
  try {
    const actor = await getActorInfo(actorId);
    const actorName = actor?.name || actor?.email || "Hệ thống";
    const targetPostTitle = targetPost.title;

    let title = "";
    let description = "";
    const actionUrl = `/admin/posts/${targetPost.id}`;

    switch (action) {
      case "create":
        title = "📝 Bài viết mới được tạo";
        description = `${actorName} đã tạo bài viết mới: ${targetPostTitle}`;
        break;
      case "update":
        const changeDescriptions: string[] = [];
        if (changes?.title) {
          changeDescriptions.push(
            `Tiêu đề: ${changes.title.old} → ${changes.title.new}`
          );
        }
        if (changes?.published !== undefined) {
          changeDescriptions.push(
            `Trạng thái: ${
              changes.published.old ? "Đã xuất bản" : "Bản nháp"
            } → ${changes.published.new ? "Đã xuất bản" : "Bản nháp"}`
          );
        }
        title = "✏️ Bài viết được cập nhật";
        description = `${actorName} đã cập nhật bài viết: ${targetPostTitle}${
          changeDescriptions.length > 0
            ? `\nThay đổi: ${changeDescriptions.join(", ")}`
            : ""
        }`;
        break;
      case "delete":
        title = "🗑️ Bài viết bị xóa";
        description = `${actorName} đã xóa bài viết: ${targetPostTitle}`;
        break;
      case "restore":
        title = "♻️ Bài viết được khôi phục";
        description = `${actorName} đã khôi phục bài viết: ${targetPostTitle}`;
        break;
      case "hard-delete":
        title = "⚠️ Bài viết bị xóa vĩnh viễn";
        description = `${actorName} đã xóa vĩnh viễn bài viết: ${targetPostTitle}`;
        break;
    }

    const result = await createNotificationForAllAdmins(
      title,
      description,
      actionUrl,
      NotificationKind.SYSTEM,
      {
        type: `post_${action}`,
        actorId,
        actorName: actor?.name || actor?.email,
        actorEmail: actor?.email,
        targetPostId: targetPost.id,
        targetPostTitle,
        targetPostSlug: targetPost.slug,
        changes,
        timestamp: new Date().toISOString(),
      }
    );

    // Emit socket event nếu có socket server
    if (result.count > 0) {
      await emitNotificationToAllAdminsAfterCreate(
        title,
        description,
        actionUrl,
        NotificationKind.SYSTEM,
        {
          type: `post_${action}`,
          actorId,
          actorName: actor?.name || actor?.email,
          actorEmail: actor?.email,
          targetPostId: targetPost.id,
          targetPostTitle,
          targetPostSlug: targetPost.slug,
          changes,
          timestamp: new Date().toISOString(),
        }
      );
    }
  } catch (error) {
    logNotificationError(
      "posts",
      action === "create"
        ? "create"
        : action === "update"
        ? "update"
        : action === "delete"
        ? "delete"
        : action === "restore"
        ? "restore"
        : "hard-delete",
      error as Record<string, unknown>,
      { postId: targetPost.id }
    );
  }
};

export const notifySuperAdminsOfBulkPostAction = async (
  action: "delete" | "restore" | "hard-delete",
  actorId: string,
  count: number,
  posts?: Array<{ title: string }>
) => {
  const startTime = Date.now();

  resourceLogger.logFlow({
    resource: "posts",
    action:
      action === "delete"
        ? "bulk-delete"
        : action === "restore"
        ? "bulk-restore"
        : "bulk-hard-delete",
    step: "start",
    details: { count, postCount: posts?.length || 0, actorId },
  });

  try {
    const actor = await getActorInfo(actorId);
    const actorName = actor?.name || actor?.email || "Hệ thống";

    let title = "";
    let description = "";

    // Format post titles - hiển thị tối đa 3 tiêu đề đầu tiên để rút gọn notification
    const titlesText =
      posts && posts.length > 0 ? formatPostTitles(posts, 3) : "";

    switch (action) {
      case "delete":
        title = "🗑️ Đã xóa nhiều bài viết";
        description = titlesText
          ? `${actorName} đã xóa ${count} bài viết: ${titlesText}`
          : `${actorName} đã xóa ${count} bài viết`;
        break;
      case "restore":
        title = "♻️ Đã khôi phục nhiều bài viết";
        description = titlesText
          ? `${actorName} đã khôi phục ${count} bài viết: ${titlesText}`
          : `${actorName} đã khôi phục ${count} bài viết`;
        break;
      case "hard-delete":
        title = "⚠️ Đã xóa vĩnh viễn nhiều bài viết";
        description = titlesText
          ? `${actorName} đã xóa vĩnh viễn ${count} bài viết: ${titlesText}`
          : `${actorName} đã xóa vĩnh viễn ${count} bài viết`;
        break;
    }

    const actionUrl = `/admin/posts`;

    const result = await createNotificationForAllAdmins(
      title,
      description,
      actionUrl,
      NotificationKind.SYSTEM,
      {
        type: `post_bulk_${action}`,
        actorId,
        actorName: actor?.name || actor?.email,
        actorEmail: actor?.email,
        count,
        postTitles: posts?.map((p) => p.title) || [],
        timestamp: new Date().toISOString(),
      }
    );

    // Emit socket event nếu có socket server
    if (result.count > 0) {
      await emitNotificationToAllAdminsAfterCreate(
        title,
        description,
        actionUrl,
        NotificationKind.SYSTEM,
        {
          type: `post_bulk_${action}`,
          actorId,
          actorName: actor?.name || actor?.email,
          actorEmail: actor?.email,
          count,
          postTitles: posts?.map((p) => p.title) || [],
          timestamp: new Date().toISOString(),
        }
      );
    }

    resourceLogger.logFlow({
      resource: "posts",
      action:
        action === "delete"
          ? "bulk-delete"
          : action === "restore"
          ? "bulk-restore"
          : "bulk-hard-delete",
      step: "success",
      durationMs: Date.now() - startTime,
      details: { count, postCount: posts?.length || 0 },
    });
  } catch (error) {
    logNotificationError(
      "posts",
      action === "delete"
        ? "bulk-delete"
        : action === "restore"
        ? "bulk-restore"
        : "bulk-hard-delete",
      error as Record<string, unknown>,
      { count }
    );
  }
};
