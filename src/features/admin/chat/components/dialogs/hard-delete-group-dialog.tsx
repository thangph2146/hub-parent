"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, AlertTriangle } from "lucide-react"
import type { Group } from "@/components/chat/types"
import { apiRoutes } from "@/lib/api/routes"
import { useToast } from "@/hooks/use-toast"

interface HardDeleteGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group | null
  onSuccess?: () => void
}

export function HardDeleteGroupDialog({
  open,
  onOpenChange,
  group,
  onSuccess,
}: HardDeleteGroupDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleConfirm = async () => {
    if (!group) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api${apiRoutes.adminGroups.hardDelete(group.id)}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to hard delete group" }))
        throw new Error(errorData.error || "Failed to hard delete group")
      }

      toast({
        title: "Thành công",
        description: "Đã xóa vĩnh viễn nhóm",
      })

      onOpenChange(false)
      setTimeout(() => {
        onSuccess?.()
      }, 100)
    } catch (error) {
      console.error("Error hard deleting group:", error)
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi xóa vĩnh viễn nhóm",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Xóa vĩnh viễn nhóm
          </DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa vĩnh viễn nhóm <strong>{group?.name}</strong>? Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xóa...
              </>
            ) : (
              "Xóa vĩnh viễn"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

