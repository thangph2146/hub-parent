import React from "react";
import { Flex } from "@/components/ui/flex";
import { Button } from "@/components/ui/button";
import { Square, CheckSquare2, ChevronsUpDown, ChevronsDownUp } from "lucide-react";

interface PermissionsTableHeaderProps {
  readOnly: boolean;
  handleSelectAll: () => void;
  handleExpandAll: () => void;
  allSelected: boolean;
  allExpanded: boolean;
  someSelected: boolean;
  selectedCount: number;
  totalCount: number;
  disabled?: boolean;
  isPending?: boolean;
}

export const PermissionsTableHeader = ({
  readOnly,
  handleSelectAll,
  handleExpandAll,
  allSelected,
  allExpanded,
  someSelected,
  selectedCount,
  totalCount,
  disabled,
  isPending,
}: PermissionsTableHeaderProps) => {
  if (readOnly) return null;

  return (
    <Flex align="center" justify="between" fullWidth paddingX={1} gap={2}>
      <Flex align="center" gap={2}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          disabled={disabled || isPending || totalCount === 0}
          className="gap-2"
        >
          {allSelected ? (
            <>
              <Square className="h-4 w-4" />
              Bỏ chọn tất cả
            </>
          ) : (
            <>
              <CheckSquare2 className="h-4 w-4" />
              Chọn tất cả
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExpandAll}
          disabled={disabled || isPending || totalCount === 0}
          className="gap-2"
        >
          {allExpanded ? (
            <>
              <ChevronsUpDown className="h-4 w-4" />
              Thu gọn tất cả
            </>
          ) : (
            <>
              <ChevronsDownUp className="h-4 w-4" />
              Mở tất cả
            </>
          )}
        </Button>
      </Flex>
      {someSelected && (
        <span className="text-sm text-muted-foreground">
          Đã chọn {selectedCount} / {totalCount} quyền
        </span>
      )}
    </Flex>
  );
};
