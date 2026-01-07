/**
 * Config Generator cho Admin Features
 * Chỉ cần định nghĩa API endpoints và form-fields là có thể sử dụng ngay
 */

import type {
  ResourceFormField,
  ResourceFormSection,
} from "@/features/admin/resources/components";

// Re-export server generator types
export type { ServerConfig } from "./server-generator";
export {
  generateHelpersFile,
  generateQueriesFile,
  generateEventsFile,
  generateServerIndexFile,
} from "./server-generator";

// Re-export schema and mutations generators
export { generateSchemasFile } from "./schema-generator";
export { generateMutationsFile } from "./mutations-generator";

// Re-export API route generators
export {
  generateAllApiRouteFiles,
  generateMainRouteFile,
  generateDetailRouteFile,
  generateRestoreRouteFile,
  generateHardDeleteRouteFile,
  generateBulkRouteFile,
} from "./api-route-generator";

// Re-export types generator
export { generateTypesFile } from "./types-generator";

// Re-export create feature (also available from main index.ts)
export { createFeature, createFeatureConfig } from "./create-feature";
export type { CompleteFeatureConfig, GeneratedFiles } from "./create-feature";

/**
 * Config tối thiểu để tạo một admin feature mới
 */
export interface AdminFeatureConfig<
  TRow extends { id: string },
  TFormData = Record<string, unknown>
> {
  // Tên resource (singular và plural)
  resourceName: {
    singular: string; // "post", "category", "user"
    plural: string; // "posts", "categories", "users"
    displayName: string; // "Bài viết", "Danh mục", "Người dùng"
  };

  // API Endpoints
  apiEndpoints: {
    list: string; // "/api/admin/posts"
    detail: (id: string) => string; // (id) => `/api/admin/posts/${id}`
    create: string; // "/api/admin/posts"
    update: (id: string) => string; // (id) => `/api/admin/posts/${id}`
    delete: (id: string) => string;
    restore: (id: string) => string;
    hardDelete: (id: string) => string;
    bulk: string; // "/api/admin/posts/bulk"
  };

  // Form Fields Configuration
  formFields: {
    sections: ResourceFormSection[];
    fields: ResourceFormField<TFormData>[];
    getFields?: (
      options?: Record<string, unknown>
    ) => ResourceFormField<TFormData>[];
  };

  // Messages (optional - có thể tự động generate)
  messages?: {
    DELETE_SUCCESS?: string;
    DELETE_ERROR?: string;
    RESTORE_SUCCESS?: string;
    RESTORE_ERROR?: string;
    HARD_DELETE_SUCCESS?: string;
    HARD_DELETE_ERROR?: string;
    BULK_DELETE_SUCCESS?: string;
    BULK_DELETE_ERROR?: string;
    BULK_RESTORE_SUCCESS?: string;
    BULK_RESTORE_ERROR?: string;
    BULK_HARD_DELETE_SUCCESS?: string;
    BULK_HARD_DELETE_ERROR?: string;
    UNKNOWN_ERROR?: string;
  };

  // Record name getter (để hiển thị trong messages)
  getRecordName: (row: TRow) => string;

  // Optional: Custom hooks
  customHooks?: {
    useActions?: () => unknown;
    useFeedback?: () => unknown;
    useDeleteConfirm?: () => unknown;
  };

  // Optional: Toggle status support
  hasToggleStatus?: boolean;
  toggleStatusConfig?: {
    updateRoute: (id: string) => string;
    validateToggle?: (
      row: TRow,
      newStatus: boolean
    ) => { valid: boolean; error?: string };
  };
}

/**
 * Generate messages tự động từ config
 */
export const generateMessages = <TRow extends { id: string }>(
  config: AdminFeatureConfig<TRow>
) => {
  const { displayName } = config.resourceName;
  const defaultMessages = {
    DELETE_SUCCESS: `Xóa ${displayName.toLowerCase()} thành công`,
    DELETE_ERROR: `Xóa ${displayName.toLowerCase()} thất bại`,
    RESTORE_SUCCESS: `Khôi phục ${displayName.toLowerCase()} thành công`,
    RESTORE_ERROR: `Khôi phục ${displayName.toLowerCase()} thất bại`,
    HARD_DELETE_SUCCESS: `Xóa vĩnh viễn ${displayName.toLowerCase()} thành công`,
    HARD_DELETE_ERROR: `Xóa vĩnh viễn ${displayName.toLowerCase()} thất bại`,
    BULK_DELETE_SUCCESS: `Xóa hàng loạt ${displayName.toLowerCase()} thành công`,
    BULK_DELETE_ERROR: `Xóa hàng loạt ${displayName.toLowerCase()} thất bại`,
    BULK_RESTORE_SUCCESS: `Khôi phục hàng loạt ${displayName.toLowerCase()} thành công`,
    BULK_RESTORE_ERROR: `Khôi phục hàng loạt ${displayName.toLowerCase()} thất bại`,
    BULK_HARD_DELETE_SUCCESS: `Xóa vĩnh viễn hàng loạt ${displayName.toLowerCase()} thành công`,
    BULK_HARD_DELETE_ERROR: `Xóa vĩnh viễn hàng loạt ${displayName.toLowerCase()} thất bại`,
    UNKNOWN_ERROR: "Đã xảy ra lỗi không xác định",
  };

  return { ...defaultMessages, ...config.messages };
};

/**
 * Generate resource actions hook từ config
 */
export const generateResourceActionsHook = <TRow extends { id: string }>(
  config: AdminFeatureConfig<TRow>
) => {
  const messages = generateMessages(config);
  const resourceName = config.resourceName.plural;

  return {
    resourceName,
    messages,
    getRecordName: config.getRecordName,
    getLogMetadata: (row: TRow) => ({
      [`${config.resourceName.singular}Id`]: row.id,
      [`${config.resourceName.singular}Name`]: config.getRecordName(row),
    }),
  };
};

/**
 * Generate constants/messages file content
 */
export const generateMessagesFile = <TRow extends { id: string }>(
  config: AdminFeatureConfig<TRow>
) => {
  const messages = generateMessages(config);
  const { displayName, plural } = config.resourceName;
  const resourceUpper = plural.toUpperCase();

  return `export const ${resourceUpper}_MESSAGES = ${JSON.stringify(
    messages,
    null,
    2
  )} as const

export const ${resourceUpper}_LABELS = {
  ACTIVE: "Hoạt động",
  DELETED: "Đã xóa",
  VIEW_DETAIL: "Xem chi tiết",
  EDIT: "Chỉnh sửa",
  DELETE: "Xóa",
  RESTORE: "Khôi phục",
  HARD_DELETE: "Xóa vĩnh viễn",
  CLEAR_SELECTION: "Bỏ chọn",
  DELETING: "Đang xóa...",
  RESTORING: "Đang khôi phục...",
  HARD_DELETING: "Đang xóa vĩnh viễn...",
  ACTIVE_VIEW: "Đang hoạt động",
  DELETED_VIEW: "Đã xóa",
  NO_${resourceUpper}: "Không tìm thấy ${displayName.toLowerCase()} nào phù hợp",
  NO_DELETED_${resourceUpper}: "Không có ${displayName.toLowerCase()} đã xóa",
  SELECTED_${resourceUpper}: (count: number) => \`Đã chọn \${count} ${displayName.toLowerCase()}\`,
  DELETE_SELECTED: (count: number) => \`Xóa đã chọn (\${count})\`,
  RESTORE_SELECTED: (count: number) => \`Khôi phục (\${count})\`,
  HARD_DELETE_SELECTED: (count: number) => \`Xóa vĩnh viễn (\${count})\`,
  MANAGE_${resourceUpper}: "Quản lý ${displayName}",
  ADD_NEW: "Thêm mới",
} as const

export const ${resourceUpper}_CONFIRM_MESSAGES = {
  DELETE_TITLE: (count?: number) => count ? \`Xóa \${count} ${displayName.toLowerCase()}?\` : "Xóa ${displayName.toLowerCase()}?",
  DELETE_DESCRIPTION: (count?: number, name?: string) =>
    count
      ? \`Bạn có chắc chắn muốn xóa \${count} ${displayName.toLowerCase()}? Chúng sẽ được chuyển vào thùng rác và có thể khôi phục sau.\`
      : \`Bạn có chắc chắn muốn xóa ${displayName.toLowerCase()} "\${name || ""}"? ${displayName} sẽ được chuyển vào thùng rác và có thể khôi phục sau.\`,
  RESTORE_TITLE: (count?: number) => count ? \`Khôi phục \${count} ${displayName.toLowerCase()}?\` : "Khôi phục ${displayName.toLowerCase()}?",
  RESTORE_DESCRIPTION: (count?: number, name?: string) =>
    count
      ? \`Bạn có chắc chắn muốn khôi phục \${count} ${displayName.toLowerCase()}? Chúng sẽ được chuyển về trạng thái hoạt động.\`
      : \`Bạn có chắc chắn muốn khôi phục ${displayName.toLowerCase()} "\${name || ""}"? ${displayName} sẽ được chuyển về trạng thái hoạt động.\`,
  HARD_DELETE_TITLE: (count?: number) =>
    count ? \`Xóa vĩnh viễn \${count} ${displayName.toLowerCase()}?\` : "Xóa vĩnh viễn ${displayName.toLowerCase()}?",
  HARD_DELETE_DESCRIPTION: (count?: number, name?: string) =>
    count
      ? \`Hành động này sẽ xóa vĩnh viễn \${count} ${displayName.toLowerCase()} khỏi hệ thống. Dữ liệu sẽ không thể khôi phục. Bạn có chắc chắn muốn tiếp tục?\`
      : \`Hành động này sẽ xóa vĩnh viễn ${displayName.toLowerCase()} "\${name || ""}" khỏi hệ thống. Dữ liệu sẽ không thể khôi phục. Bạn có chắc chắn muốn tiếp tục?\`,
  CONFIRM_LABEL: "Xóa",
  RESTORE_LABEL: "Khôi phục",
  HARD_DELETE_LABEL: "Xóa vĩnh viễn",
  CANCEL_LABEL: "Hủy",
} as const
`;
};

/**
 * Generate hooks file content
 */
export const generateHooksFile = <
  TRow extends { id: string },
  TFormData extends Record<string, unknown> = Record<string, unknown>
>(
  config: AdminFeatureConfig<TRow, TFormData>
) => {
  const { singular, plural } = config.resourceName;
  const ResourceRow = `${
    singular.charAt(0).toUpperCase() + singular.slice(1)
  }Row`;
  const resourceUpper = plural.toUpperCase();

  const adminQueryKeyName =
    "admin" + plural.charAt(0).toUpperCase() + plural.slice(1);

  let content = `import { createResourceHooks${
    config.hasToggleStatus ? ", useToggleStatus" : ""
  } } from "@/features/admin/resources/hooks"
import { useResourceFormSubmit } from "@/features/admin/resources/hooks"
import { createAdminResourceKeys } from "@/lib/query-keys"
import type { ${ResourceRow} } from "../types"
import { ${resourceUpper}_MESSAGES } from "../constants/messages"

const ${resourceUpper}_QUERY_KEYS = createAdminResourceKeys("${adminQueryKeyName}")

const ${resourceUpper}_ACTION_ROUTES = {
  delete: ${config.apiEndpoints.delete.toString()},
  restore: ${config.apiEndpoints.restore.toString()},
  hardDelete: ${config.apiEndpoints.hardDelete.toString()},
  bulk: "${config.apiEndpoints.bulk}",
}

const { useActions, useFeedback, useDeleteConfirm } = createResourceHooks<${ResourceRow}>({
  resourceName: "${plural}",
  messages: ${resourceUpper}_MESSAGES,
  getRecordName: (row) => ${config.getRecordName
    .toString()
    .replace(/\(row\) => /, "")},
  getLogMetadata: (row) => ({
    ${singular}Id: row.id,
    ${singular}Name: ${config.getRecordName
    .toString()
    .replace(/\(row\) => /, "")},
  }),
  customApiRoutes: ${resourceUpper}_ACTION_ROUTES,
  customQueryKeys: {
    all: () => ${resourceUpper}_QUERY_KEYS.all(),
    detail: (id) => ${resourceUpper}_QUERY_KEYS.detail(id),
  },
})

export const use${
    singular.charAt(0).toUpperCase() + singular.slice(1)
  }Actions = useActions
export const use${
    singular.charAt(0).toUpperCase() + singular.slice(1)
  }Feedback = useFeedback
export const use${
    singular.charAt(0).toUpperCase() + singular.slice(1)
  }DeleteConfirm = useDeleteConfirm

/**
 * Hook để submit form create/update ${config.resourceName.displayName.toLowerCase()}
 * Tự động sử dụng API endpoints từ config
 */
export const use${
    singular.charAt(0).toUpperCase() + singular.slice(1)
  }FormSubmit = (resourceId?: string) => {
  return useResourceFormSubmit({
    apiRoute: resourceId ? ${config.apiEndpoints.update.toString()} : ${config.apiEndpoints.create.toString()},
    method: resourceId ? "PUT" : "POST",
    resourceId,
    messages: {
      successTitle: resourceId ? "Cập nhật thành công" : "Tạo mới thành công",
      successDescription: resourceId ? "Đã cập nhật ${config.resourceName.displayName.toLowerCase()} thành công" : "Đã tạo ${config.resourceName.displayName.toLowerCase()} thành công",
      errorTitle: resourceId ? "Cập nhật thất bại" : "Tạo mới thất bại",
      errorDescription: ${resourceUpper}_MESSAGES.UNKNOWN_ERROR || "Đã xảy ra lỗi",
    },
    navigation: {
      toDetail: true,
      fallback: ${config.apiEndpoints.list.toString()},
    },
  })
}
`;

  if (config.hasToggleStatus && config.toggleStatusConfig) {
    content += `
export const use${
      singular.charAt(0).toUpperCase() + singular.slice(1)
    }ToggleStatus = (canManage: boolean) => 
  useToggleStatus<${ResourceRow}>({
    resourceName: "${plural}",
    updateRoute: ${config.toggleStatusConfig.updateRoute.toString()},
    queryKeys: {
      all: () => ${resourceUpper}_QUERY_KEYS.all(),
      detail: (id) => ${resourceUpper}_QUERY_KEYS.detail(id),
    },
    messages: ${resourceUpper}_MESSAGES,
    getRecordName: (row) => ${config.getRecordName
      .toString()
      .replace(/\(row\) => /, "")},
    canManage,
    ${
      config.toggleStatusConfig.validateToggle
        ? `validateToggle: ${config.toggleStatusConfig.validateToggle.toString()},`
        : ""
    }
  })
`;
  }

  return content;
};