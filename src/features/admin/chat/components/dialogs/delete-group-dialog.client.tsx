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
import { Loader2, AlertTriangle, Trash } from "lucide-react"
import { IconSize } from "@/components/ui/typography"
import type { Contact, Group } from "@/components/chat/types"
import { HardDeleteGroupDialog } from "./hard-delete-group-dialog.client"
import { useGroupDeleteConfirm } from "../../hooks/use-group-delete-confirm"
import { useGroupDialogActions } from "../../hooks/use-group-dialog-actions"
import { useGroupFeedback } from "../../hooks/use-group-feedback"
import { GROUP_CONFIRM_MESSAGES, GROUP_LABELS } from "../../constants"
import { useChatSocketBridge } from "../../hooks/use-chat-socket-bridge"
import { FeedbackDialog } from "@/components/dialogs"

interface DeleteGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group | null
  onSuccess?: () => void
  currentUserId: string
  role?: string | null
  setContactsState: React.Dispatch<React.SetStateAction<Contact[]>>
}

export const DeleteGroupDialog = ({ 
  open, 
  onOpenChange, 
  group, 
  onSuccess,
  currentUserId,
  role,
  setContactsState,
}: DeleteGroupDialogProps) => {
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false)
  const { socket } = useChatSocketBridge({
    currentUserId,
    role,
    setContactsState,
  })
  const { feedback, showFeedback, handleFeedbackOpenChange } = useGroupFeedback()
  const { deleteConfirm, setDeleteConfirm, handleDeleteConfirm } = useGroupDeleteConfirm()
  const { executeSingleAction, deletingGroups, hardDeletingGroups } = useGroupDialogActions({
    canDelete: true,
    canRestore: false,
    canManage: true,
    isSocketConnected: socket?.connected ?? false,
    showFeedback,
    onSuccess,
  })

  const handleSoftDelete = async () => {
    if (!group) return

    setDeleteConfirm({
      open: true,
      type: "soft",
      row: group,
      onConfirm: async () => {
        await executeSingleAction("delete", group)
        onOpenChange(false)
      },
    })
  }

  const handleHardDeleteClick = () => {
    if (!group) return

    setDeleteConfirm({
      open: true,
      type: "hard",
      row: group,
      onConfirm: async () => {
        await executeSingleAction("hard-delete", group)
        onOpenChange(false)
      },
    })
  }

  const isDeleting = group ? deletingGroups.has(group.id) : false
  const isHardDeleting = group ? hardDeletingGroups.has(group.id) : false
  const isProcessing = isDeleting || isHardDeleting

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconSize size="md" className="text-destructive">
                <AlertTriangle />
              </IconSize>
              {GROUP_CONFIRM_MESSAGES.DELETE_TITLE(group?.name)}
            </DialogTitle>
            <DialogDescription>
              {GROUP_CONFIRM_MESSAGES.DELETE_DESCRIPTION(group?.name)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Button 
              variant="secondary" 
              onClick={handleSoftDelete} 
              disabled={isProcessing} 
              className="w-full justify-start"
            >
              {isDeleting ? (
                <IconSize size="sm" className="mr-2 animate-spin">
                  <Loader2 />
                </IconSize>
              ) : (
                <IconSize size="sm" className="mr-2">
                  <Trash />
                </IconSize>
              )}
              {GROUP_LABELS.SOFT_DELETE}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleHardDeleteClick} 
              disabled={isProcessing}
              className="w-full justify-start"
            >
              {isHardDeleting ? (
                <IconSize size="sm" className="mr-2 animate-spin">
                  <Loader2 />
                </IconSize>
              ) : (
                <IconSize size="sm" className="mr-2">
                  <Trash />
                </IconSize>
              )}
              {GROUP_LABELS.HARD_DELETE}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
              {GROUP_CONFIRM_MESSAGES.CANCEL_LABEL}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <Dialog open={deleteConfirm.open} onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null)
        }}>
          <DialogContent className="sm:max-w-[460px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <IconSize size="md" className="text-destructive">
                <AlertTriangle />
              </IconSize>
                {deleteConfirm.type === "hard"
                  ? GROUP_CONFIRM_MESSAGES.HARD_DELETE_TITLE(deleteConfirm.row?.name)
                  : deleteConfirm.type === "restore"
                    ? GROUP_CONFIRM_MESSAGES.RESTORE_TITLE(deleteConfirm.row?.name)
                    : GROUP_CONFIRM_MESSAGES.DELETE_TITLE(deleteConfirm.row?.name)}
              </DialogTitle>
              <DialogDescription>
                {deleteConfirm.type === "hard"
                  ? GROUP_CONFIRM_MESSAGES.HARD_DELETE_DESCRIPTION(deleteConfirm.row?.name)
                  : deleteConfirm.type === "restore"
                    ? GROUP_CONFIRM_MESSAGES.RESTORE_DESCRIPTION(deleteConfirm.row?.name)
                    : GROUP_CONFIRM_MESSAGES.DELETE_DESCRIPTION(deleteConfirm.row?.name)}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={isProcessing}>
                {GROUP_CONFIRM_MESSAGES.CANCEL_LABEL}
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isProcessing}>
                {(deleteConfirm.type === "hard" ? isHardDeleting : isDeleting) && (
                  <IconSize size="sm" className="mr-2 animate-spin">
                  <Loader2 />
                </IconSize>
                )}
                {deleteConfirm.type === "hard"
                  ? GROUP_CONFIRM_MESSAGES.HARD_DELETE_LABEL
                  : deleteConfirm.type === "restore"
                    ? GROUP_CONFIRM_MESSAGES.RESTORE_LABEL
                    : GROUP_CONFIRM_MESSAGES.CONFIRM_LABEL}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <HardDeleteGroupDialog
        open={hardDeleteDialogOpen}
        onOpenChange={setHardDeleteDialogOpen}
        group={group}
        onSuccess={onSuccess}
        currentUserId={currentUserId}
        role={role}
        setContactsState={setContactsState}
      />

      {/* Feedback Dialog */}
      {feedback && (
        <FeedbackDialog
          open={feedback.open}
          onOpenChange={handleFeedbackOpenChange}
          variant={feedback.variant}
          title={feedback.title}
          description={feedback.description}
          details={feedback.details}
        />
      )}
    </>
  )
}
