"use client";

import { Trash2, AlertTriangle, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Flex } from "@/components/ui/flex";
import { TypographySpanSmall, TypographySpanSmallMuted, IconSize } from "@/components/ui/typography";
import { SelectionActionsWrapper } from "@/features/admin/resources/components";
import type { UserRow } from "../../types";
import { USER_LABELS, PROTECTED_SUPER_ADMIN_EMAIL } from "../../constants";

interface UserSelectionActionsProps {
  selectedIds: string[];
  selectedRows: UserRow[];
  clearSelection: () => void;
  refresh: () => void;
  canManage: boolean;
  canRestore?: boolean;
  isProcessing: boolean;
  executeBulk: (action: any, ids: string[], rows: UserRow[], refresh: () => void, clear: () => void) => void;
}

export const ActiveUserSelectionActions = ({
  selectedIds,
  selectedRows,
  clearSelection,
  refresh,
  canManage,
  isProcessing,
  executeBulk,
}: UserSelectionActionsProps) => {
  const deletableRows = selectedRows.filter((row) => row.email !== PROTECTED_SUPER_ADMIN_EMAIL);
  const hasSuperAdmin = selectedRows.some((row) => row.email === PROTECTED_SUPER_ADMIN_EMAIL);

  return (
    <Flex direction="col" align="start" justify="between" gap={3} className="sm:flex-row sm:items-center">
      <Flex direction="col" gap={1} className="flex-shrink-0 sm:flex-row sm:items-center">
        <TypographySpanSmall>
          {USER_LABELS.SELECTED_USERS(selectedIds.length)}
        </TypographySpanSmall>
        {hasSuperAdmin && (
          <TypographySpanSmallMuted className="sm:ml-2">
            (Tài khoản super admin không thể xóa)
          </TypographySpanSmallMuted>
        )}
      </Flex>
      <Flex align="center" gap={2} wrap>
        {canManage && (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isProcessing || selectedIds.length === 0}
              onClick={() => executeBulk("active", selectedIds, selectedRows, refresh, clearSelection)}
              className="whitespace-nowrap border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 gap-2"
            >
              <IconSize size="md">
                <CheckCircle />
              </IconSize>
              <span className="hidden sm:inline">
                {USER_LABELS.ACTIVE_SELECTED(selectedIds.length)}
              </span>
              <span className="sm:hidden">Kích hoạt</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isProcessing || deletableRows.length === 0}
              onClick={() => executeBulk("unactive", deletableRows.map((r) => r.id), deletableRows, refresh, clearSelection)}
              className="whitespace-nowrap border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700 gap-2"
            >
              <IconSize size="md">
                <XCircle />
              </IconSize>
              <span>
                {USER_LABELS.UNACTIVE_SELECTED(deletableRows.length)}
              </span>
            </Button>
          </>
        )}
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={isProcessing || deletableRows.length === 0}
          onClick={() => executeBulk("delete", deletableRows.map((r) => r.id), deletableRows, refresh, clearSelection)}
          className="whitespace-nowrap gap-2"
        >
          <IconSize size="md">
            <Trash2 />
          </IconSize>
          <span>
            {USER_LABELS.DELETE_SELECTED(deletableRows.length)}
          </span>
        </Button>
        {canManage && (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={isProcessing || deletableRows.length === 0}
            onClick={() => executeBulk("hard-delete", deletableRows.map((r) => r.id), deletableRows, refresh, clearSelection)}
            className="whitespace-nowrap gap-2"
          >
            <IconSize size="md">
              <AlertTriangle />
            </IconSize>
            <span>
              {USER_LABELS.HARD_DELETE_SELECTED(deletableRows.length)}
            </span>
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={clearSelection}
          className="whitespace-nowrap"
        >
          {USER_LABELS.CLEAR_SELECTION}
        </Button>
      </Flex>
    </Flex>
  );
};

export const DeletedUserSelectionActions = ({
  selectedIds,
  selectedRows,
  clearSelection,
  refresh,
  canManage,
  canRestore,
  isProcessing,
  executeBulk,
}: UserSelectionActionsProps) => {
  return (
    <SelectionActionsWrapper
      label={USER_LABELS.SELECTED_DELETED_USERS(selectedIds.length)}
      actions={
        <>
          {canRestore && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isProcessing || selectedIds.length === 0}
              onClick={() => executeBulk("restore", selectedIds, selectedRows, refresh, clearSelection)}
              className="whitespace-nowrap gap-2"
            >
              <IconSize size="md">
                <RotateCcw />
              </IconSize>
              <span>
                {USER_LABELS.RESTORE_SELECTED(selectedIds.length)}
              </span>
            </Button>
          )}
          {canManage && (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={isProcessing || selectedIds.length === 0}
              onClick={() => executeBulk("hard-delete", selectedIds, selectedRows, refresh, clearSelection)}
              className="whitespace-nowrap gap-2"
            >
              <IconSize size="md">
                <AlertTriangle />
              </IconSize>
              <span>
                {USER_LABELS.HARD_DELETE_SELECTED(selectedIds.length)}
              </span>
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={clearSelection}
            className="whitespace-nowrap"
          >
            {USER_LABELS.CLEAR_SELECTION}
          </Button>
        </>
      }
    />
  );
};
