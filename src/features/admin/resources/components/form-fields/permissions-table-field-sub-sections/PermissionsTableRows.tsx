import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { ChevronDown } from "lucide-react";
import { Flex } from "@/components/ui/flex";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/utils";
import { ResourceCheckbox } from "./ResourceCheckbox";
import type { ParsedPermission } from "../permissions-utils";

interface GroupRowProps {
  groupLabel: string;
  isOpen: boolean;
  onToggle: () => void;
}

export const GroupRow = ({ groupLabel, isOpen, onToggle }: GroupRowProps) => (
  <TableRow
    className="bg-muted/40 hover:bg-muted/60 border-b-2 border-border/50"
    data-display-name={`Group-${groupLabel}`}
  >
    <TableCell colSpan={6} className="p-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/80 transition-colors cursor-pointer h-12"
      >
        <ChevronDown
          className={cn(
            "h-5 w-5 transition-transform shrink-0 text-muted-foreground",
            isOpen && "transform rotate-180 text-foreground"
          )}
        />
        <span className="font-semibold text-base text-foreground flex-1 text-left">
          {groupLabel}
        </span>
      </button>
    </TableCell>
  </TableRow>
);

interface ResourceRowProps {
  resourceName: string;
  isOpen: boolean;
  onToggle: () => void;
}

export const ResourceRow = ({ resourceName, isOpen, onToggle }: ResourceRowProps) => (
  <TableRow
    className="bg-muted/30 hover:bg-muted border-b border-border/40"
    data-display-name={`Resource-${resourceName}`}
  >
    <TableCell colSpan={6} className="p-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/80 transition-colors cursor-pointer h-12 pl-8"
      >
        <ChevronDown
          className={cn(
            "h-5 w-5 transition-transform shrink-0 text-muted-foreground",
            isOpen && "transform rotate-180 text-foreground"
          )}
        />
        <span className="font-medium text-sm text-foreground flex-1 text-left">
          {resourceName}
        </span>
      </button>
    </TableCell>
  </TableRow>
);

interface PermissionItemRowProps {
  displayName: string;
  perms: ParsedPermission[];
  columnWidths: { function: number; action: number; options: number };
  isPermissionSelected: (val: string) => boolean;
  isPermissionAvailable: (val: string) => boolean;
  handlePermissionToggle: (val: string) => void;
  areAllPermissionsSelected: (perms: ParsedPermission[]) => boolean;
  areSomePermissionsSelected: (perms: ParsedPermission[]) => boolean;
  handleToggleAllPermissions: (perms: ParsedPermission[]) => void;
  disabled?: boolean;
  isPending?: boolean;
  readOnly?: boolean;
}

export const PermissionItemRow = ({
  displayName,
  perms,
  columnWidths,
  isPermissionSelected,
  isPermissionAvailable,
  handlePermissionToggle,
  areAllPermissionsSelected,
  areSomePermissionsSelected,
  handleToggleAllPermissions,
  disabled,
  isPending,
  readOnly,
}: PermissionItemRowProps) => {
  const viewPerm = perms.find((p) => p.action === "view");
  const createPerm = perms.find((p) => p.action === "create");
  const updatePerm = perms.find((p) => p.action === "update");
  const deletePerm = perms.find((p) => p.action === "delete");
  const otherPerms = perms.filter(
    (p) => !["view", "create", "update", "delete"].includes(p.action)
  );

  const renderActionCell = (perm: ParsedPermission | undefined, label: string) => (
    <TableCell
      className="text-center align-middle h-12 px-2 py-0 border-r border-border/30"
      style={{ width: `${columnWidths.action}px` }}
    >
      {perm && (
        <Flex align="center" justify="center" height="12" className="h-12">
          <label className="flex items-center gap-2 cursor-pointer group">
            <Checkbox
              checked={isPermissionSelected(perm.fullValue)}
              onCheckedChange={() => handlePermissionToggle(perm.fullValue)}
              disabled={disabled || isPending || readOnly || !isPermissionAvailable(perm.fullValue)}
              data-readonly={readOnly ? "true" : undefined}
              className={cn(
                readOnly && "!opacity-100 disabled:!opacity-100 [&:disabled]:!opacity-100 cursor-default bg-muted/30 border-muted-foreground/30",
                (disabled || isPending || readOnly) && !readOnly && "!opacity-100"
              )}
            />
            <span className="text-xs text-foreground leading-relaxed select-none group-hover:text-foreground">
              {label}
            </span>
          </label>
        </Flex>
      )}
    </TableCell>
  );

  return (
    <TableRow
      className="hover:bg-muted/20 transition-colors border-b border-border/30"
      data-display-name={`Permission-${displayName}`}
    >
      <TableCell
        className="pl-16 h-12 px-4 py-0 border-r border-border/30 align-middle"
        style={{ width: `${columnWidths.function}px` }}
      >
        <ResourceCheckbox
          checked={areAllPermissionsSelected(perms)}
          indeterminate={areSomePermissionsSelected(perms)}
          onCheckedChange={() => handleToggleAllPermissions(perms)}
          disabled={disabled || isPending || readOnly}
          readOnly={readOnly}
          label={displayName}
        />
      </TableCell>
      
      {renderActionCell(viewPerm, "Xem")}
      {renderActionCell(createPerm, "Thêm")}
      {renderActionCell(updatePerm, "Sửa")}
      {renderActionCell(deletePerm, "Xóa")}

      <TableCell
        className="align-center h-12 px-4 py-0"
        style={{ width: `${columnWidths.options}px` }}
      >
        {otherPerms.length > 0 && (
          <Flex direction="col" align="start" gap={0}>
            {otherPerms.map((perm) => {
              const isAvailable = isPermissionAvailable(perm.fullValue);
              const actionLabelMap: Record<string, string> = {
                publish: "Xuất bản",
                approve: "Duyệt",
                assign: "Gán",
                manage: "Quản lý",
                active: "Kích hoạt",
              };

              let optionLabel = perm.displayLabel;
              if (perm.displayLabel.includes(" - ")) {
                const actionPart = perm.displayLabel.split(" - ")[0];
                optionLabel = actionLabelMap[perm.action] || actionPart;
              }

              return (
                <label
                  key={perm.fullValue}
                  className={cn(
                    "flex items-center gap-2.5 cursor-pointer hover:bg-muted/60 rounded-md px-2 py-1.5 transition-colors group",
                    !isAvailable && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Checkbox
                    checked={isPermissionSelected(perm.fullValue)}
                    onCheckedChange={() => handlePermissionToggle(perm.fullValue)}
                    disabled={disabled || isPending || readOnly || !isAvailable}
                    data-readonly={readOnly ? "true" : undefined}
                    className={cn(
                      readOnly && "!opacity-100 disabled:!opacity-100 [&:disabled]:!opacity-100 cursor-default bg-muted/30 border-muted-foreground/30",
                      (disabled || isPending || readOnly) && !readOnly && "!opacity-100"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-xs text-foreground leading-relaxed select-none group-hover:text-foreground">
                    {optionLabel}
                  </span>
                </label>
              );
            })}
          </Flex>
        )}
      </TableCell>
    </TableRow>
  );
};
