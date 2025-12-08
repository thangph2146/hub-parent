import { prisma } from "@/lib/database"
import { getSocketServer } from "@/lib/socket/state"
import { mapProductRecord, serializeProductForTable } from "./helpers"
import type { ProductRow } from "../types"
import { resourceLogger } from "@/lib/config"

const SUPER_ADMIN_ROOM = "role:super_admin"

export type ProductStatus = "active" | "deleted"

function resolveStatusFromRow(row: ProductRow): ProductStatus {
  return row.deletedAt ? "deleted" : "active"
}

async function fetchProductRow(productId: string): Promise<ProductRow | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      images: {
        orderBy: {
          order: "asc",
        },
      },
    },
  })

  if (!product) {
    return null
  }

  const listed = mapProductRecord(product)
  return serializeProductForTable(listed)
}

export async function emitProductUpsert(
  productId: string,
  previousStatus: ProductStatus | null,
): Promise<void> {
  const io = getSocketServer()
  if (!io) return

  const row = await fetchProductRow(productId)
  if (!row) {
    if (previousStatus) {
      emitProductRemove(productId, previousStatus)
    }
    return
  }

  const newStatus = resolveStatusFromRow(row)

  io.to(SUPER_ADMIN_ROOM).emit("product:upsert", {
    product: row,
    previousStatus,
    newStatus,
  })
}

export async function emitBatchProductUpsert(
  productIds: string[],
  previousStatus: ProductStatus | null,
): Promise<void> {
  const io = getSocketServer()
  if (!io || productIds.length === 0) return

  const startTime = Date.now()
  resourceLogger.actionFlow({
    resource: "products",
    action: "socket-update",
    step: "start",
    metadata: { count: productIds.length, previousStatus, type: "batch" },
  })

  // Fetch all products in parallel
  const productPromises = productIds.map((id) => fetchProductRow(id))
  const rows = await Promise.all(productPromises)

  // Filter out nulls and emit events
  const validRows = rows.filter((row): row is ProductRow => row !== null)
  
  if (validRows.length > 0) {
    // Emit batch event với tất cả rows
    io.to(SUPER_ADMIN_ROOM).emit("product:batch-upsert", {
      products: validRows.map((row) => ({
        product: row,
        previousStatus,
        newStatus: resolveStatusFromRow(row),
      })),
    })

    resourceLogger.actionFlow({
      resource: "products",
      action: "socket-update",
      step: "success",
      duration: Date.now() - startTime,
      metadata: { count: validRows.length, emitted: validRows.length, type: "batch" },
    })
  }
}

export function emitProductRemove(productId: string, previousStatus: ProductStatus): void {
  const io = getSocketServer()
  if (!io) return

  io.to(SUPER_ADMIN_ROOM).emit("product:remove", {
    id: productId,
    previousStatus,
  })
}

