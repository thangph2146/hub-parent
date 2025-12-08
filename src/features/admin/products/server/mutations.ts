"use server"

import type { Prisma } from "@prisma/client"
import { PERMISSIONS } from "@/lib/permissions"
import { prisma } from "@/lib/database"
import { mapProductRecord, type ProductWithRelations } from "./helpers"
import {
  ApplicationError,
  ForbiddenError,
  NotFoundError,
  ensurePermission,
  logTableStatusAfterMutation,
  logActionFlow,
  logDetailAction,
  type AuthContext,
} from "@/features/admin/resources/server"
import type { BulkActionResult } from "@/features/admin/resources/types"
import { emitProductUpsert, emitProductRemove, type ProductStatus } from "./events"
import { createProductSchema, updateProductSchema, type CreateProductSchema, type UpdateProductSchema } from "./validation"

// Re-export for backward compatibility with API routes
export { ApplicationError, ForbiddenError, NotFoundError, type AuthContext, type BulkActionResult }

function sanitizeProduct(product: ProductWithRelations) {
  return mapProductRecord(product)
}

export async function createProduct(ctx: AuthContext, input: CreateProductSchema) {
  const startTime = Date.now()
  
  logActionFlow("products", "create", "start", { actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.PRODUCTS_MANAGE)

  const validated = createProductSchema.parse(input)

  // Check if slug already exists
  const existingSlug = await prisma.product.findUnique({ where: { slug: validated.slug } })
  if (existingSlug) {
    throw new ApplicationError("Slug đã tồn tại", 400)
  }

  // Check if SKU already exists
  const existingSku = await prisma.product.findUnique({ where: { sku: validated.sku } })
  if (existingSku) {
    throw new ApplicationError("SKU đã tồn tại", 400)
  }

  // Serialize description if it's an object (SerializedEditorState)
  const descriptionValue =
    validated.description === null
      ? null
      : validated.description && typeof validated.description === "object" && validated.description !== null
        ? JSON.stringify(validated.description)
        : typeof validated.description === "string"
          ? validated.description
          : validated.description !== undefined
            ? String(validated.description)
            : undefined

  // Create product with categories and images using transaction
  const product = await prisma.$transaction(async (tx) => {
    // Create product first
    const createdProduct = await tx.product.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        description: descriptionValue,
        shortDescription: validated.shortDescription,
        sku: validated.sku,
        price: validated.price,
        compareAtPrice: validated.compareAtPrice,
        cost: validated.cost,
        stock: validated.stock,
        trackInventory: validated.trackInventory,
        weight: validated.weight,
        status: validated.status,
        featured: validated.featured,
      },
    })

    // Create categories if provided
    if (validated.categoryIds && validated.categoryIds.length > 0) {
      await tx.productCategory.createMany({
        data: validated.categoryIds.map((categoryId) => ({
          productId: createdProduct.id,
          categoryId,
        })),
        skipDuplicates: true,
      })
    }

    // Create images if provided
    if (validated.images && validated.images.length > 0) {
      await tx.productImage.createMany({
        data: validated.images.map((img) => ({
          productId: createdProduct.id,
          url: img.url,
          alt: img.alt,
          order: img.order,
          isPrimary: img.isPrimary,
        })),
      })
    }

    // Create inventory record if trackInventory is true
    if (validated.trackInventory) {
      await tx.inventory.create({
        data: {
          productId: createdProduct.id,
          quantity: validated.stock,
          lowStockThreshold: 10,
        },
      })
    }

    // Fetch with relations
    return tx.product.findUnique({
      where: { id: createdProduct.id },
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
  })

  if (!product) {
    throw new ApplicationError("Không thể tạo sản phẩm", 500)
  }

  const sanitized = sanitizeProduct(product as ProductWithRelations)

  // Emit socket event for real-time updates
  await emitProductUpsert(sanitized.id, null)

  logActionFlow("products", "create", "success", { productId: sanitized.id, productName: sanitized.name }, startTime)
  logDetailAction("products", "create", sanitized.id, sanitized as unknown as Record<string, unknown>)

  return sanitized
}

export async function updateProduct(
  ctx: AuthContext,
  productId: string,
  input: UpdateProductSchema
) {
  const startTime = Date.now()
  
  logActionFlow("products", "update", "start", { productId, actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.PRODUCTS_UPDATE, PERMISSIONS.PRODUCTS_MANAGE)

  let validated: UpdateProductSchema
  try {
    validated = updateProductSchema.parse(input)
  } catch (error) {
    logActionFlow("products", "update", "error", { productId, error: "Validation failed", details: error })
    if (error instanceof Error) {
      throw new ApplicationError(`Validation error: ${error.message}`, 400)
    }
    throw new ApplicationError("Dữ liệu không hợp lệ", 400)
  }

  const existing = await prisma.product.findUnique({ where: { id: productId } })
  if (!existing) {
    logActionFlow("products", "update", "error", { productId, error: "Product not found" })
    throw new NotFoundError("Sản phẩm không tồn tại")
  }

  // Check if slug is being changed and if new slug already exists
  if (validated.slug && validated.slug !== existing.slug) {
    const slugExists = await prisma.product.findUnique({ where: { slug: validated.slug } })
    if (slugExists) {
      throw new ApplicationError("Slug đã tồn tại", 400)
    }
  }

  // Check if SKU is being changed and if new SKU already exists
  if (validated.sku && validated.sku !== existing.sku) {
    const skuExists = await prisma.product.findUnique({ where: { sku: validated.sku } })
    if (skuExists) {
      throw new ApplicationError("SKU đã tồn tại", 400)
    }
  }

  // Serialize description if it's an object (SerializedEditorState)
  const descriptionValue =
    validated.description !== undefined
      ? validated.description === null
        ? null
        : validated.description && typeof validated.description === "object" && validated.description !== null
          ? JSON.stringify(validated.description)
          : typeof validated.description === "string"
            ? validated.description
            : String(validated.description)
      : undefined

  const updateData: Prisma.ProductUpdateInput = {}
  
  if (validated.name !== undefined) updateData.name = validated.name
  if (validated.slug !== undefined) updateData.slug = validated.slug
  if (descriptionValue !== undefined) updateData.description = descriptionValue
  if (validated.shortDescription !== undefined) updateData.shortDescription = validated.shortDescription
  if (validated.sku !== undefined) updateData.sku = validated.sku
  if (validated.price !== undefined) updateData.price = validated.price
  if (validated.compareAtPrice !== undefined) updateData.compareAtPrice = validated.compareAtPrice
  if (validated.cost !== undefined) updateData.cost = validated.cost
  if (validated.stock !== undefined) updateData.stock = validated.stock
  if (validated.trackInventory !== undefined) updateData.trackInventory = validated.trackInventory
  if (validated.weight !== undefined) updateData.weight = validated.weight
  if (validated.status !== undefined) updateData.status = validated.status
  if (validated.featured !== undefined) updateData.featured = validated.featured

  // Handle categories and images update using transaction
  const product = await prisma.$transaction(async (tx) => {
    // Update product basic fields
    let updatedProduct
    if (Object.keys(updateData).length > 0) {
      updatedProduct = await tx.product.update({
        where: { id: productId },
        data: updateData,
      })
    } else {
      updatedProduct = await tx.product.findUnique({
        where: { id: productId },
      })
      if (!updatedProduct) {
        throw new NotFoundError("Sản phẩm không tồn tại")
      }
    }

    // Handle categories update
    if (validated.categoryIds !== undefined) {
      // Delete existing categories
      await tx.productCategory.deleteMany({
        where: { productId },
      })

      // Create new categories
      if (validated.categoryIds.length > 0) {
        await tx.productCategory.createMany({
          data: validated.categoryIds.map((categoryId) => ({
            productId,
            categoryId,
          })),
          skipDuplicates: true,
        })
      }
    }

    // Handle images update
    if (validated.images !== undefined) {
      // Delete existing images
      await tx.productImage.deleteMany({
        where: { productId },
      })

      // Create new images
      if (validated.images.length > 0) {
        await tx.productImage.createMany({
          data: validated.images.map((img) => ({
            productId,
            url: img.url || "",
            alt: img.alt || null,
            order: img.order ?? 0,
            isPrimary: img.isPrimary ?? false,
          })),
          skipDuplicates: true,
        })
      }
    }

    // Update inventory if stock changed
    if (validated.stock !== undefined && existing.trackInventory) {
      await tx.inventory.update({
        where: { productId },
        data: { quantity: validated.stock },
      })
    }

    // Fetch with relations
    return tx.product.findUnique({
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
  })

  if (!product) {
    throw new NotFoundError("Sản phẩm không tồn tại")
  }

  const sanitized = sanitizeProduct(product as ProductWithRelations)
  const previousStatus: ProductStatus = existing.deletedAt ? "deleted" : "active"

  // Emit socket event
  await emitProductUpsert(sanitized.id, previousStatus)

  logActionFlow("products", "update", "success", { productId: sanitized.id }, startTime)
  logDetailAction("products", "update", sanitized.id, sanitized as unknown as Record<string, unknown>)

  return sanitized
}

export async function deleteProduct(ctx: AuthContext, productId: string) {
  const startTime = Date.now()
  
  logActionFlow("products", "delete", "start", { productId, actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.PRODUCTS_DELETE, PERMISSIONS.PRODUCTS_MANAGE)

  const existing = await prisma.product.findUnique({ where: { id: productId } })
  if (!existing) {
    throw new NotFoundError("Sản phẩm không tồn tại")
  }

  const previousStatus: ProductStatus = existing.deletedAt ? "deleted" : "active"

  await prisma.product.update({
    where: { id: productId },
    data: { deletedAt: new Date() },
  })

  emitProductRemove(productId, previousStatus)

  logActionFlow("products", "delete", "success", { productId }, startTime)
  await logTableStatusAfterMutation({
    resource: "products",
    action: "delete",
    prismaModel: prisma.product,
    affectedIds: productId,
  })
}

export async function restoreProduct(ctx: AuthContext, productId: string) {
  const startTime = Date.now()
  
  logActionFlow("products", "restore", "start", { productId, actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.PRODUCTS_MANAGE)

  const existing = await prisma.product.findUnique({ where: { id: productId } })
  if (!existing) {
    throw new NotFoundError("Sản phẩm không tồn tại")
  }

  const previousStatus: ProductStatus = "deleted"

  await prisma.product.update({
    where: { id: productId },
    data: { deletedAt: null },
  })

  await emitProductUpsert(productId, previousStatus)

  logActionFlow("products", "restore", "success", { productId }, startTime)
  await logTableStatusAfterMutation({
    resource: "products",
    action: "restore",
    prismaModel: prisma.product,
    affectedIds: productId,
  })
}

export async function hardDeleteProduct(ctx: AuthContext, productId: string) {
  const startTime = Date.now()
  
  logActionFlow("products", "hard-delete", "start", { productId, actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.PRODUCTS_MANAGE)

  const existing = await prisma.product.findUnique({ where: { id: productId } })
  if (!existing) {
    throw new NotFoundError("Sản phẩm không tồn tại")
  }

  const previousStatus: ProductStatus = existing.deletedAt ? "deleted" : "active"

  await prisma.$transaction(async (tx) => {
    // Delete related records first
    await tx.productImage.deleteMany({ where: { productId } })
    await tx.productCategory.deleteMany({ where: { productId } })
    await tx.cartItem.deleteMany({ where: { productId } })
    await tx.orderItem.deleteMany({ where: { productId } })
    await tx.inventory.deleteMany({ where: { productId } })
    
    // Delete product
    await tx.product.delete({ where: { id: productId } })
  })

  emitProductRemove(productId, previousStatus)

  logActionFlow("products", "hard-delete", "success", { productId }, startTime)
  await logTableStatusAfterMutation({
    resource: "products",
    action: "delete",
    prismaModel: prisma.product,
    affectedIds: productId,
  })
}

