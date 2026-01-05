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
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldContent,
  FieldSet,
  FieldLegend,
  FieldGroup,
} from "@/components/ui/field"
import { Loader2 } from "lucide-react"
import { IconSize } from "@/components/ui/typography"
import { logger } from "@/lib/config/logger"
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
      <DialogContent className="sm:max-w-[540px] md:max-w-[600px] lg:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa nhóm</DialogTitle>
          <DialogDescription>Cập nhật tên và mô tả cho nhóm</DialogDescription>
        </DialogHeader>
        <FieldSet className="group/field-set">
          <FieldLegend variant="legend">Thông tin nhóm</FieldLegend>
          <FieldGroup>
            <Field orientation="responsive">
              <FieldLabel htmlFor="group-name">Tên nhóm</FieldLabel>
              <FieldContent>
                <Input 
                  id="group-name" 
                  value={groupName} 
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full"
                  disabled={isSaving}
                />
                <FieldDescription>
                  Tên nhóm sẽ hiển thị trong danh sách và cuộc trò chuyện
                </FieldDescription>
              </FieldContent>
            </Field>
            <Field orientation="responsive">
              <FieldLabel htmlFor="group-description">Mô tả</FieldLabel>
              <FieldContent>
                <Textarea 
                  id="group-description" 
                  value={groupDescription} 
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="w-full min-h-[100px] sm:min-h-[120px]"
                  disabled={isSaving}
                />
                <FieldDescription>
                  Mô tả về nhóm (tùy chọn)
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>
        </FieldSet>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            Hủy
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !groupName.trim()}
            className="w-full sm:w-auto"
          >
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
