/**
 * Clipboard Utilities
 * Helper functions cho clipboard operations với toast notifications
 */

export const copyToClipboard = async (
  text: string,
  toast: ReturnType<typeof import("@/hooks").useToast>["toast"]
): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    toast({
      title: "Đã copy",
      description: "URL đã được copy vào clipboard",
    })
    return true
  } catch {
    toast({
      title: "Lỗi",
      description: "Không thể copy vào clipboard",
      variant: "destructive",
    })
    return false
  }
}

