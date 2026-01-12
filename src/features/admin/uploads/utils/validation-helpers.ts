/**
 * Validation Helpers
 * Utility functions cho validation và error handling
 */

export const showValidationError = (
  toast: ReturnType<typeof import("@/hooks").useToast>["toast"],
  message: string
) => {
  toast({
    title: "Lỗi",
    description: message,
    variant: "destructive",
  })
}

export interface FolderValidationResult {
  folderName: string
  parentPath: string | null
  isValid: boolean
  error?: string
}

export const validateTreeMode = (folderName: string): FolderValidationResult => {
  if (!folderName.trim()) {
    return {
      folderName: "",
      parentPath: null,
      isValid: false,
      error: "Vui lòng nhập tên thư mục",
    }
  }

  return {
    folderName: folderName.trim(),
    parentPath: null,
    isValid: true,
  }
}

export const validateStringMode = (
  folderPathString: string,
  rootFolderForString: string | null
): FolderValidationResult => {
  if (!folderPathString.trim() && !rootFolderForString) {
    return {
      folderName: "",
      parentPath: null,
      isValid: false,
      error: "Vui lòng chọn thư mục gốc hoặc nhập đường dẫn",
    }
  }

  if (rootFolderForString && !folderPathString.trim()) {
    return {
      folderName: "",
      parentPath: null,
      isValid: false,
      error: "Vui lòng nhập tên thư mục hoặc đường dẫn con",
    }
  }

  return {
    folderName: "",
    parentPath: null,
    isValid: true,
  }
}

