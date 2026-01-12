/**
 * API Route: /api/admin/uploads
 * Uploads API routes - Upload, list, delete images and folders
 */

import { NextRequest } from "next/server"
import { createPostRoute, createGetRoute, createDeleteRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import { UPLOADS_PERMISSION_GROUPS } from "@/features/admin/uploads/config/permissions"
import {
  uploadImageHandler,
  listImagesHandler,
  listFoldersHandler,
  createFolderHandler,
  deleteImageHandler,
  deleteFolderHandler,
} from "@/features/admin/uploads/server/handlers"

export const POST = createPostRoute(
  async (req: NextRequest, context: ApiRouteContext) => {
    const formData = await req.formData()
    const action = formData.get("action") as string | null
    
    if (action === "createFolder") {
      const folderName = formData.get("folderName") as string | null
      const parentPath = formData.get("parentPath") as string | null
      return createFolderHandler(req, context, folderName, parentPath)
    }
    
    return uploadImageHandler(req, context, formData)
  },
  {
    permissions: [...UPLOADS_PERMISSION_GROUPS.UPLOAD],
  }
)

export const GET = createGetRoute(
  (req: NextRequest, context: ApiRouteContext) => {
    const { searchParams } = new URL(req.url)
    const listFolders = searchParams.get("listFolders") === "true"

    if (listFolders) {
      return listFoldersHandler(req, context)
    }

    return listImagesHandler(req, context)
  },
  {
    permissions: [...UPLOADS_PERMISSION_GROUPS.VIEW],
  }
    )

export const DELETE = createDeleteRoute(
  (req: NextRequest, context: ApiRouteContext) => {
    const { searchParams } = new URL(req.url)
    const deleteFolder = searchParams.get("deleteFolder") === "true"

    if (deleteFolder) {
      return deleteFolderHandler(req, context)
    }

    return deleteImageHandler(req, context)
  },
  {
    permissions: [...UPLOADS_PERMISSION_GROUPS.MANAGE],
    allowSuperAdmin: true,
  }
)
