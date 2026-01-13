"use client";

import { Trash2, AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconSize } from "@/components/ui/typography";
import { SelectionActionsWrapper } from "@/features/admin/resources/components";
import type { RoleRow } from "../../types";
import { ROLE_LABELS } from "../../constants/messages";

interface RoleSelectionActionsProps {
  selectedIds: string[];
  selectedRows: RoleRow[];
  clearSelection: () => void;
  refresh: () => void;
  canManage: boolean;
  canRestore?: boolean;
  isProcessing: boolean;
  executeBulk: (action: "delete" | "restore" | "hard-delete", ids: string[], refresh: () => void, clear: () => void) => void;
}

export const ActiveRoleSelectionActions = ({
  selectedIds,
  selectedRows,
  clearSelection,
  refresh,
  canManage,
  isProcessing,
  executeBulk,
}: RoleSelectionActionsProps) => {
  const deletableRows = selectedRows.filter((row) => row.name !== "super_admin");
  const hasSuperAdmin = selectedRows.some((row) => row.name === "super_admin");

  return (
    <SelectionActionsWrapper
      label={ROLE_LABELS.SELECTED_ROLES(selectedIds.length)}
      labelSuffix={
        hasSuperAdmin ? <>{ROLE_LABELS.CANNOT_DELETE_SUPER_ADMIN_HINT}</> : undefined
      }
      actions={
        <>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={isProcessing || deletableRows.length === 0}
            onClick={() =>
              executeBulk(
                "delete",
                deletableRows.map((row) => row.id),
                refresh,
                clearSelection,
              )
            }
            className="whitespace-nowrap"
          >
            <IconSize size="md" className="mr-2 shrink-0">
              <Trash2 />
            </IconSize>
            <span className="hidden sm:inline">
              {ROLE_LABELS.DELETE_SELECTED(deletableRows.length)}
            </span>
            <span className="sm:hidden">Xóa</span>
          </Button>
          {canManage && (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={isProcessing || deletableRows.length === 0}
              onClick={() =>
                executeBulk(
                  "hard-delete",
                  deletableRows.map((row) => row.id),
                  refresh,
                  clearSelection,
                )
              }
              className="whitespace-nowrap"
            >
              <IconSize size="md" className="mr-2 shrink-0">
                <AlertTriangle />
              </IconSize>
              <span className="hidden sm:inline">
                {ROLE_LABELS.HARD_DELETE_SELECTED(deletableRows.length)}
              </span>
              <span className="sm:hidden">Xóa vĩnh viễn</span>
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={clearSelection}
            className="whitespace-nowrap"
          >
            {ROLE_LABELS.CLEAR_SELECTION}
          </Button>
        </>
      }
    />
  );
};

export const DeletedRoleSelectionActions = ({
  selectedIds,
  selectedRows,
  clearSelection,
  refresh,
  canManage,
  canRestore,
  isProcessing,
  executeBulk,
}: RoleSelectionActionsProps) => {
  const deletableRows = selectedRows.filter((row) => row.name !== "super_admin");
  const hasSuperAdmin = selectedRows.some((row) => row.name === "super_admin");

  return (
    <SelectionActionsWrapper
      label={ROLE_LABELS.SELECTED_DELETED_ROLES(selectedIds.length)}
      labelSuffix={
        hasSuperAdmin ? <>{ROLE_LABELS.CANNOT_HARD_DELETE_SUPER_ADMIN_HINT}</> : undefined
      }
      actions={
        <>
          {canRestore && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isProcessing || selectedIds.length === 0}
              onClick={() => executeBulk("restore", selectedIds, refresh, clearSelection)}
              className="whitespace-nowrap"
            >
              <IconSize size="md" className="mr-2 shrink-0">
                <RotateCcw />
              </IconSize>
              <span className="hidden sm:inline">
                {ROLE_LABELS.RESTORE_SELECTED(selectedIds.length)}
              </span>
              <span className="sm:hidden">Khôi phục</span>
            </Button>
          )}
          {canManage && (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={isProcessing || deletableRows.length === 0}
              onClick={() =>
                executeBulk(
                  "hard-delete",
                  deletableRows.map((row) => row.id),
                  refresh,
                  clearSelection,
                )
              }
              className="whitespace-nowrap"
            >
              <IconSize size="md" className="mr-2 shrink-0">
                <AlertTriangle />
              </IconSize>
              <span className="hidden sm:inline">
                {ROLE_LABELS.HARD_DELETE_SELECTED(deletableRows.length)}
              </span>
              <span className="sm:hidden">Xóa vĩnh viễn</span>
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={clearSelection}
            className="whitespace-nowrap"
          >
            {ROLE_LABELS.CLEAR_SELECTION}
          </Button>
        </>
      }
    />
  );
};
