"use client";

import { ConfirmDialog } from "@/components/dialogs";
import type { UserRow } from "../../types";
import { USER_CONFIRM_MESSAGES } from "../../constants";

interface UserConfirmDialogProps {
  deleteConfirm: {
    open: boolean;
    type: "soft" | "hard" | "restore" | "active" | "unactive";
    row?: UserRow;
    bulkIds?: string[];
  } | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isProcessing: boolean;
  deletingIds: Set<string>;
  restoringIds: Set<string>;
  hardDeletingIds: Set<string>;
}

export const UserConfirmDialog = ({
  deleteConfirm,
  onOpenChange,
  onConfirm,
  isProcessing,
  deletingIds,
  restoringIds,
  hardDeletingIds,
}: UserConfirmDialogProps) => {
  if (!deleteConfirm) return null;

  const getTitle = () => {
    if (deleteConfirm.type === "hard") {
      return USER_CONFIRM_MESSAGES.HARD_DELETE_TITLE(deleteConfirm.bulkIds?.length);
    }
    if (deleteConfirm.type === "restore") {
      return USER_CONFIRM_MESSAGES.RESTORE_TITLE(deleteConfirm.bulkIds?.length);
    }
    if (deleteConfirm.type === "active") {
      return USER_CONFIRM_MESSAGES.ACTIVE_TITLE(deleteConfirm.bulkIds?.length);
    }
    if (deleteConfirm.type === "unactive") {
      return USER_CONFIRM_MESSAGES.UNACTIVE_TITLE(deleteConfirm.bulkIds?.length);
    }
    return USER_CONFIRM_MESSAGES.DELETE_TITLE(deleteConfirm.bulkIds?.length);
  };

  const getDescription = () => {
    if (deleteConfirm.type === "hard") {
      return USER_CONFIRM_MESSAGES.HARD_DELETE_DESCRIPTION(
        deleteConfirm.bulkIds?.length,
        deleteConfirm.row?.email
      );
    }
    if (deleteConfirm.type === "restore") {
      return USER_CONFIRM_MESSAGES.RESTORE_DESCRIPTION(
        deleteConfirm.bulkIds?.length,
        deleteConfirm.row?.email
      );
    }
    if (deleteConfirm.type === "active") {
      return USER_CONFIRM_MESSAGES.ACTIVE_DESCRIPTION(deleteConfirm.bulkIds?.length);
    }
    if (deleteConfirm.type === "unactive") {
      return USER_CONFIRM_MESSAGES.UNACTIVE_DESCRIPTION(deleteConfirm.bulkIds?.length);
    }
    return USER_CONFIRM_MESSAGES.DELETE_DESCRIPTION(
      deleteConfirm.bulkIds?.length,
      deleteConfirm.row?.email
    );
  };

  const getVariant = () => {
    if (deleteConfirm.type === "hard") return "destructive";
    if (deleteConfirm.type === "restore" || deleteConfirm.type === "active" || deleteConfirm.type === "unactive") {
      return "default";
    }
    return "destructive";
  };

  const getConfirmLabel = () => {
    if (deleteConfirm.type === "hard") return USER_CONFIRM_MESSAGES.HARD_DELETE_LABEL;
    if (deleteConfirm.type === "restore") return USER_CONFIRM_MESSAGES.RESTORE_LABEL;
    if (deleteConfirm.type === "active") return USER_CONFIRM_MESSAGES.ACTIVE_LABEL;
    if (deleteConfirm.type === "unactive") return USER_CONFIRM_MESSAGES.UNACTIVE_LABEL;
    return USER_CONFIRM_MESSAGES.CONFIRM_LABEL;
  };

  const isLoading =
    isProcessing ||
    (deleteConfirm.row
      ? deleteConfirm.type === "restore"
        ? restoringIds.has(deleteConfirm.row.id)
        : deleteConfirm.type === "hard"
        ? hardDeletingIds.has(deleteConfirm.row.id)
        : deletingIds.has(deleteConfirm.row.id)
      : false);

  return (
    <ConfirmDialog
      open={deleteConfirm.open}
      onOpenChange={onOpenChange}
      title={getTitle()}
      description={getDescription()}
      variant={getVariant()}
      confirmLabel={getConfirmLabel()}
      cancelLabel={USER_CONFIRM_MESSAGES.CANCEL_LABEL}
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
};
