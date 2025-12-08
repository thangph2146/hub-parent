import { createNotificationForSuperAdmins } from "@/features/admin/notifications/server/mutations"
import { NotificationKind } from "@prisma/client"
import { logger } from "@/lib/config"

export async function notifySuperAdminsOfOrderAction(
  action: "create" | "update" | "delete" | "restore",
  actorId: string,
  order: { id: string; orderNumber: string; customerName: string; customerEmail: string; total: string },
  changes?: {
    status?: { old: string; new: string }
    paymentStatus?: { old: string; new: string }
  }
) {
  try {
    let title = ""
    let description = ""
    const actionUrl = `/admin/orders/${order.id}`

    switch (action) {
      case "create":
        title = "Đơn hàng mới"
        description = `Đơn hàng ${order.orderNumber} từ ${order.customerName} (${order.customerEmail}) với tổng tiền ${order.total}`
        break
      case "update":
        const statusChange = changes?.status
          ? `Trạng thái: ${changes.status.old} → ${changes.status.new}`
          : ""
        const paymentChange = changes?.paymentStatus
          ? `Thanh toán: ${changes.paymentStatus.old} → ${changes.paymentStatus.new}`
          : ""
        const changeText = [statusChange, paymentChange].filter(Boolean).join(", ")
        title = "Đơn hàng được cập nhật"
        description = `Đơn hàng ${order.orderNumber}: ${changeText || "Đã cập nhật"}`
        break
      case "delete":
        title = "Đơn hàng bị xóa"
        description = `Đơn hàng ${order.orderNumber} đã bị xóa`
        break
      case "restore":
        title = "Đơn hàng được khôi phục"
        description = `Đơn hàng ${order.orderNumber} đã được khôi phục`
        break
    }

    await createNotificationForSuperAdmins(
      title,
      description,
      actionUrl,
      NotificationKind.SYSTEM,
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        action,
        actorId,
      }
    )

    logger.info("Order action notification sent to super admins", {
      action,
      orderId: order.id,
      orderNumber: order.orderNumber,
      actorId,
    })
  } catch (error) {
    logger.error("Failed to send order action notification to super admins", error instanceof Error ? error : new Error(String(error)))
  }
}

