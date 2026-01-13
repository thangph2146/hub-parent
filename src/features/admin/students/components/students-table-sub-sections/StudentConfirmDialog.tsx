"use client";

import { ConfirmDialog } from "@/components/dialogs";
import type { StudentRow } from "../../types";
import { STUDENT_CONFIRM_MESSAGES } from "../../constants/messages";

interface StudentConfirmDialogProps {
  deleteConfirm: {
    open: boolean;
    type: "soft" | "hard" | "restore";
    row?: StudentRow;
    bulkIds?: string[];
  } | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isProcessing: boolean;
  deletingIds: Set<string>;
  restoringIds: Set<string>;
  hardDeletingIds: Set<string>;
}

export const StudentConfirmDialog = ({
  deleteConfirm,
  onOpenChange,
  onConfirm,
  isProcessing,
  deletingIds,
  restoringIds,
  hardDeletingIds,
}: StudentConfirmDialogProps) => {
  if (!deleteConfirm) return null;

  const getTitle = () => {
    if (deleteConfirm.type === "hard") {
      return STUDENT_CONFIRM_MESSAGES.HARD_DELETE_TITLE(
        deleteConfirm.bulkIds?.length,
        deleteConfirm.row?.studentCode
      );
    }
    if (deleteConfirm.type === "restore") {
      return STUDENT_CONFIRM_MESSAGES.RESTORE_TITLE(
        deleteConfirm.bulkIds?.length,
        deleteConfirm.row?.studentCode
      );
    }
    return STUDENT_CONFIRM_MESSAGES.DELETE_TITLE(
      deleteConfirm.bulkIds?.length,
      deleteConfirm.row?.studentCode
    );
  };

  const getDescription = () => {
    if (deleteConfirm.type === "hard") {
      return STUDENT_CONFIRM_MESSAGES.HARD_DELETE_DESCRIPTION(
        deleteConfirm.bulkIds?.length,
        deleteConfirm.row?.studentCode
      );
    }
    if (deleteConfirm.type === "restore") {
      return STUDENT_CONFIRM_MESSAGES.RESTORE_DESCRIPTION(
        deleteConfirm.bulkIds?.length,
        deleteConfirm.row?.studentCode
      );
    }
    return STUDENT_CONFIRM_MESSAGES.DELETE_DESCRIPTION(
      deleteConfirm.bulkIds?.length,
      deleteConfirm.row?.studentCode
    );
  };

  const getVariant = () => {
    if (deleteConfirm.type === "hard") return "destructive";
    if (deleteConfirm.type === "restore") return "default";
    return "destructive";
  };

  const getConfirmLabel = () => {
    if (deleteConfirm.type === "hard") return STUDENT_CONFIRM_MESSAGES.HARD_DELETE_LABEL;
    if (deleteConfirm.type === "restore") return STUDENT_CONFIRM_MESSAGES.RESTORE_LABEL;
    return STUDENT_CONFIRM_MESSAGES.CONFIRM_LABEL;
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
      cancelLabel={STUDENT_CONFIRM_MESSAGES.CANCEL_LABEL}
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
};
