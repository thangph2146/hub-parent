"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { logger } from "@/lib/config"
import type { Group } from "@/components/chat/types"
import { apiRoutes } from "@/lib/api/routes"
import { useToast } from "@/hooks/use-toast"
import { withApiBase } from "@/lib/config/api-paths"
import { requestJson, toJsonBody } from "@/lib/api/client"

interface EditGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group | null
  onSuccess?: () => void
}

export const EditGroupDialog = ({ open, onOpenChange, group, onSuccess }: EditGroupDialogProps) => {
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (group) {
      setGroupName(group.name)
      setGroupDescription(group.description || "")
    }
  }, [group])

  const handleSave = async () => {
    if (!group || !groupName.trim()) return

    setIsSaving(true)
    try {
      const response = await requestJson(withApiBase(apiRoutes.adminGroups.update(group.id)), {
        method: "PUT",
        ...toJsonBody({
          name: groupName.trim(),
          description: groupDescription.trim() || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error(response.error || "Failed to update group")
      }

      toast({
        variant: "success",
        title: "Thành công",
        description: "Đã cập nhật thông tin nhóm",
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      logger.error("Error updating group", error as Error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi cập nhật nhóm",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa nhóm</DialogTitle>
          <DialogDescription>Cập nhật tên và mô tả cho nhóm</DialogDescription>
        </DialogHeader>
        <Flex direction="col" gap={4} paddingY={2}>
          <Flex direction="col" gap={2}>
            <Label htmlFor="group-name">Tên nhóm</Label>
            <Input id="group-name" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
          </Flex>
          <Flex direction="col" gap={2}>
            <Label htmlFor="group-description">Mô tả</Label>
            <Textarea id="group-description" value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} />
          </Flex>
        </Flex>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && (
              <IconSize size="sm" className="mr-2 animate-spin">
                <Loader2 />
              </IconSize>
            )}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
