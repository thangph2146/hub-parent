"use client";

import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import {
  ChevronDown,
  CheckSquare2,
  Square,
  ChevronsDownUp,
  ChevronsUpDown,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FieldContent, FieldError } from "@/components/ui/field";
import { Flex } from "@/components/ui/flex";
import { cn } from "@/utils";
import { useElementSize } from "@/hooks";
import type { ResourceFormField } from "../resource-form";
import {
  type PermissionGroup,
  type ParsedPermission,
  parsePermissionGroups,
  groupPermissionsByDisplayName,
} from "./permissions-utils";

interface PermissionsTableFieldProps<T> {
  field: ResourceFormField<T>;
  fieldValue: unknown;
  error?: string;
  onChange: (value: unknown) => void;
  isPending?: boolean;
  availablePermissions?: string[]; // Optional: permissions that user can assign
  readOnly?: boolean; // If true, hide action buttons and make it view-only
}

export const PermissionsTableField = <T,>({
  field,
  fieldValue,
  error,
  onChange,
  isPending = false,
  availablePermissions,
  readOnly = false,
}: PermissionsTableFieldProps<T>) => {
  const { ref: tableRef, width: tableWidth } = useElementSize<HTMLDivElement>();

  // Initialize state
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [openResources, setOpenResources] = useState<Set<string>>(new Set());

  const selectedValues = useMemo(() => {
    return Array.isArray(fieldValue)
      ? fieldValue.map((v) => String(v))
      : fieldValue !== null && fieldValue !== undefined && fieldValue !== ""
      ? [String(fieldValue)]
      : [];
  }, [fieldValue]);

  const groups: PermissionGroup[] = useMemo(() => {
    if (!field.optionGroups) return [];
    return field.optionGroups.map((group) => ({
      label: group.label,
      options: group.options.map((opt) => ({
        label: opt.label,
        value: String(opt.value),
      })),
    }));
  }, [field.optionGroups]);

  // Get all available permissions
  const allAvailablePermissions = useMemo(() => {
    if (groups.length === 0) return [];
    return groups.flatMap((group) =>
      group.options.map((opt) => String(opt.value))
    );
  }, [groups]);

  // Check if permission is available (can be assigned)
  const isPermissionAvailable = (permissionValue: string) => {
    if (!availablePermissions) return true; // If not provided, assume all are available
    return availablePermissions.includes(permissionValue);
  };

  // Parse permissions using shared utility
  const parsedGroups = useMemo(() => {
    return parsePermissionGroups(groups);
  }, [groups]);

  // Auto-expand all in read-only mode
  useLayoutEffect(() => {
    if (!readOnly || parsedGroups.length === 0) return;
    const allGroupLabels = new Set(parsedGroups.map((g) => g.groupLabel));
    const allResourceKeys = new Set(
      parsedGroups.flatMap((group) =>
        group.resources.map(
          (resource) => `${group.groupLabel}-${resource.resource}`
        )
      )
    );
    const groupsChanged =
      openGroups.size !== allGroupLabels.size ||
      Array.from(allGroupLabels).some((g) => !openGroups.has(g));
    const resourcesChanged =
      openResources.size !== allResourceKeys.size ||
      Array.from(allResourceKeys).some((r) => !openResources.has(r));
    if (groupsChanged || resourcesChanged) {
      setOpenGroups(allGroupLabels);
      setOpenResources(allResourceKeys);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, parsedGroups]);

  // Check if all permissions are selected
  const allSelected = useMemo(() => {
    if (allAvailablePermissions.length === 0) return false;
    return allAvailablePermissions.every((perm) =>
      selectedValues.includes(perm)
    );
  }, [allAvailablePermissions, selectedValues]);

  // Check if some permissions are selected
  const someSelected = useMemo(() => {
    if (allAvailablePermissions.length === 0) return false;
    const selectedCount = allAvailablePermissions.filter((perm) =>
      selectedValues.includes(perm)
    ).length;
    return selectedCount > 0 && selectedCount < allAvailablePermissions.length;
  }, [allAvailablePermissions, selectedValues]);

  const toggleGroup = (groupLabel: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupLabel)) {
        next.delete(groupLabel);
      } else {
        next.add(groupLabel);
      }
      return next;
    });
  };

  const toggleResource = (resourceKey: string) => {
    setOpenResources((prev) => {
      const next = new Set(prev);
      if (next.has(resourceKey)) {
        next.delete(resourceKey);
      } else {
        next.add(resourceKey);
      }
      return next;
    });
  };


  // Check if all groups and resources are open
  const allExpanded = useMemo(() => {
    if (parsedGroups.length === 0) return false;
    return (
      parsedGroups.every((group) => openGroups.has(group.groupLabel)) &&
      parsedGroups.every((group) =>
        group.resources.every(
          (resource) =>
            openResources.has(`${group.groupLabel}-${resource.resource}`)
        )
      )
    );
  }, [parsedGroups, openGroups, openResources]);

  // Handle expand/collapse all
  const handleExpandAll = () => {
    if (allExpanded) {
      setOpenGroups(new Set());
      setOpenResources(new Set());
    } else {
      setOpenGroups(new Set(parsedGroups.map((g) => g.groupLabel)));
      setOpenResources(
        new Set(
          parsedGroups.flatMap((group) =>
            group.resources.map(
              (resource) => `${group.groupLabel}-${resource.resource}`
            )
          )
        )
      );
    }
  };

  const handleSelectAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange([...allAvailablePermissions]);
    }
  };

  const handlePermissionToggle = (permissionValue: string) => {
    if (!isPermissionAvailable(permissionValue)) return;
    const valueStr = String(permissionValue);
    const newValues = selectedValues.includes(valueStr)
      ? selectedValues.filter((v) => v !== valueStr)
      : [...selectedValues, valueStr];
    onChange(newValues.length > 0 ? newValues : []);
  };


  const isPermissionSelected = (permissionValue: string) => {
    return selectedValues.includes(String(permissionValue));
  };


  // Get available permissions from array
  const getAvailablePermissions = (permissions: ParsedPermission[]) =>
    permissions
      .filter((p) => isPermissionAvailable(p.fullValue))
      .map((p) => p.fullValue);

  // Check if all permissions in a permissions array are selected
  const areAllPermissionsSelected = (permissions: ParsedPermission[]) => {
    const availablePerms = getAvailablePermissions(permissions);
    return availablePerms.length > 0 && availablePerms.every((p) => selectedValues.includes(p));
  };

  // Check if some permissions in a permissions array are selected
  const areSomePermissionsSelected = (permissions: ParsedPermission[]) => {
    const availablePerms = getAvailablePermissions(permissions);
    if (availablePerms.length === 0) return false;
    const selectedCount = availablePerms.filter((p) => selectedValues.includes(p)).length;
    return selectedCount > 0 && selectedCount < availablePerms.length;
  };

  // Toggle all permissions in a permissions array
  const handleToggleAllPermissions = (permissions: ParsedPermission[]) => {
    const availablePerms = getAvailablePermissions(permissions);
    if (availablePerms.length === 0) return;

    const allSelected = availablePerms.every((p) => selectedValues.includes(p));
    const newValues = allSelected
      ? selectedValues.filter((v) => !availablePerms.includes(v))
      : [...new Set([...selectedValues, ...availablePerms])];
    onChange(newValues);
  };


  // Calculate column widths based on table width
  const columnWidths = useMemo(() => {
    if (tableWidth === 0) {
      // Default widths when table is not measured yet
      return {
        function: 280,
        action: 90,
        options: 200,
      };
    }

    // Calculate proportional widths
    const padding = 16; // Total horizontal padding
    const borderWidth = 5; // Total border width
    const availableWidth = tableWidth - padding - borderWidth;

    // Define proportions
    const functionProportion = 0.35; // 35% for "Chức năng"
    const actionProportion = 0.11; // 11% for each action column (Xem, Thêm, Sửa, Xóa)
    const optionsProportion = 0.21; // 21% for "Tùy chọn"

    return {
      function: Math.max(200, Math.floor(availableWidth * functionProportion)),
      action: Math.max(70, Math.floor(availableWidth * actionProportion)),
      options: Math.max(150, Math.floor(availableWidth * optionsProportion)),
    };
  }, [tableWidth]);

  const fieldId = field.name as string;
  const errorId = error ? `${fieldId}-error` : undefined;

  if (groups.length === 0) {
    return (
      <FieldContent>
        <div className="rounded-lg border border-border bg-background p-6 text-center text-sm text-muted-foreground">
          Không có quyền nào để hiển thị
        </div>
        {error && <FieldError id={errorId}>{error}</FieldError>}
      </FieldContent>
    );
  }

  return (
    <FieldContent className="items-start justify-start w-full gap-3 min-w-0 flex-1 min-h-0">
      {/* Action Buttons - Only show in edit mode */}
      {!readOnly && (
        <Flex align="center" justify="between" fullWidth paddingX={1} gap={2}>
          <Flex align="center" gap={2}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={
                field.disabled ||
                isPending ||
                allAvailablePermissions.length === 0
              }
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
              disabled={
                field.disabled || isPending || parsedGroups.length === 0
              }
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
              Đã chọn {selectedValues.length} / {allAvailablePermissions.length}{" "}
              quyền
            </span>
          )}
        </Flex>
      )}

      <div
        ref={tableRef}
        className={cn(
          "rounded-lg border border-border bg-background w-full shadow-sm flex-1",
          error && "border-destructive"
        )}
      >
        <div className="overflow-x-auto overflow-y-visible -mx-1 px-1 w-full">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                <TableHead
                  className="font-semibold text-foreground h-12 px-4 border-r border-border/50 align-middle"
                  style={{
                    width: `${columnWidths.function}px`,
                    minWidth: `${columnWidths.function}px`,
                  }}
                >
                  Chức năng
                </TableHead>
                <TableHead
                  className="text-center font-semibold text-foreground h-12 px-2 border-r border-border/50 align-middle"
                  style={{
                    width: `${columnWidths.action}px`,
                    minWidth: `${columnWidths.action}px`,
                  }}
                >
                  Xem
                </TableHead>
                <TableHead
                  className="text-center font-semibold text-foreground h-12 px-2 border-r border-border/50 align-middle"
                  style={{
                    width: `${columnWidths.action}px`,
                    minWidth: `${columnWidths.action}px`,
                  }}
                >
                  Thêm
                </TableHead>
                <TableHead
                  className="text-center font-semibold text-foreground h-12 px-2 border-r border-border/50 align-middle"
                  style={{
                    width: `${columnWidths.action}px`,
                    minWidth: `${columnWidths.action}px`,
                  }}
                >
                  Sửa
                </TableHead>
                <TableHead
                  className="text-center font-semibold text-foreground h-12 px-2 border-r border-border/50 align-middle"
                  style={{
                    width: `${columnWidths.action}px`,
                    minWidth: `${columnWidths.action}px`,
                  }}
                >
                  Xóa
                </TableHead>
                <TableHead
                  className="text-left font-semibold text-foreground h-12 px-4 align-middle"
                  style={{
                    width: `${columnWidths.options}px`,
                    minWidth: `${columnWidths.options}px`,
                  }}
                >
                  Tùy chọn
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsedGroups.map((parsedGroup) => {
                const isGroupOpen = openGroups.has(parsedGroup.groupLabel);

                return (
                  <React.Fragment key={parsedGroup.groupLabel}>
                    {/* Group Header Row */}
                    <TableRow
                      className="bg-muted/40 hover:bg-muted/60 border-b-2 border-border/50"
                      data-display-name={`Group-${parsedGroup.groupLabel}`}
                    >
                      <TableCell colSpan={6} className="p-0">
                        <button
                          type="button"
                          onClick={() => toggleGroup(parsedGroup.groupLabel)}
                          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/80 transition-colors cursor-pointer h-12"
                        >
                          <ChevronDown
                            className={cn(
                              "h-5 w-5 transition-transform shrink-0 text-muted-foreground",
                              isGroupOpen &&
                                "transform rotate-180 text-foreground"
                            )}
                          />
                          <span className="font-semibold text-base text-foreground flex-1 text-left">
                            {parsedGroup.groupLabel}
                          </span>
                        </button>
                      </TableCell>
                    </TableRow>
                    {/* Resources Rows - Only render when group is open */}
                    {isGroupOpen &&
                      parsedGroup.resources.map((resourceData) => {
                        const resourceKey = `${parsedGroup.groupLabel}-${resourceData.resource}`;
                        const isResourceOpen = openResources.has(resourceKey);

                        // Group permissions by display name using shared utility
                        const permissionsByDisplay = groupPermissionsByDisplayName(resourceData.permissions);

                        return (
                          <React.Fragment key={resourceData.resource}>
                            {/* Resource Header Row */}
                            <TableRow
                              className="bg-muted/30 hover:bg-muted/50 border-b border-border/40"
                              data-display-name={`Resource-${resourceData.resource}`}
                            >
                              <TableCell colSpan={6} className="p-0">
                                <button
                                  type="button"
                                  onClick={() => toggleResource(resourceKey)}
                                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/80 transition-colors cursor-pointer h-12 pl-8"
                                >
                                  <ChevronDown
                                    className={cn(
                                      "h-5 w-5 transition-transform shrink-0 text-muted-foreground",
                                      isResourceOpen &&
                                        "transform rotate-180 text-foreground"
                                    )}
                                  />
                                  <span className="font-medium text-sm text-foreground flex-1 text-left">
                                    {resourceData.resource}
                                  </span>
                                </button>
                              </TableCell>
                            </TableRow>
                            {/* Permission Rows - Child Nodes */}
                            {isResourceOpen &&
                              Array.from(permissionsByDisplay.entries()).map(
                                ([displayName, perms]) => {
                                  // Find standard actions
                                  const viewPerm = perms.find(
                                    (p) => p.action === "view"
                                  );
                                  const createPerm = perms.find(
                                    (p) => p.action === "create"
                                  );
                                  const updatePerm = perms.find(
                                    (p) => p.action === "update"
                                  );
                                  const deletePerm = perms.find(
                                    (p) => p.action === "delete"
                                  );
                                  const otherPerms = perms.filter(
                                    (p) =>
                                      ![
                                        "view",
                                        "create",
                                        "update",
                                        "delete",
                                      ].includes(p.action)
                                  );

                                  return (
                                    <TableRow
                                      key={displayName}
                                      className="hover:bg-muted/20 transition-colors border-b border-border/30"
                                      data-display-name={`Permission-${displayName}`}
                                    >
                                      <TableCell
                                        className="pl-16 h-12 px-4 py-0 border-r border-border/30 align-middle"
                                        style={{
                                          width: `${columnWidths.function}px`,
                                        }}
                                      >
                                        <ResourceCheckbox
                                          checked={areAllPermissionsSelected(perms)}
                                          indeterminate={areSomePermissionsSelected(perms)}
                                          onCheckedChange={() =>
                                            handleToggleAllPermissions(perms)
                                          }
                                          disabled={
                                            field.disabled ||
                                            isPending ||
                                            readOnly ||
                                            perms.length === 0 ||
                                            perms.every(
                                              (p) =>
                                                !isPermissionAvailable(p.fullValue)
                                            )
                                          }
                                          readOnly={readOnly}
                                          label={displayName}
                                        />
                                      </TableCell>
                                      <TableCell
                                        className="text-center align-middle h-12 px-2 py-0 border-r border-border/30"
                                        style={{
                                          width: `${columnWidths.action}px`,
                                        }}
                                      >
                                        {viewPerm && (
                                          <Flex
                                            align="center"
                                            justify="center"
                                            height="12"
                                            className="h-12"
                                          >
                                            <label className="flex items-center gap-2 cursor-pointer">
                                              <Checkbox
                                                checked={isPermissionSelected(
                                                  viewPerm.fullValue
                                                )}
                                                onCheckedChange={() =>
                                                  handlePermissionToggle(
                                                    viewPerm.fullValue
                                                  )
                                                }
                                                disabled={
                                                  field.disabled ||
                                                  isPending ||
                                                  readOnly ||
                                                  !isPermissionAvailable(
                                                    viewPerm.fullValue
                                                  )
                                                }
                                                data-readonly={readOnly ? "true" : undefined}
                                                className={cn(
                                                  readOnly && "!opacity-100 disabled:!opacity-100 [&:disabled]:!opacity-100 cursor-default bg-muted/30 border-muted-foreground/30",
                                                  (field.disabled || isPending || readOnly) && !readOnly && "!opacity-100"
                                                )}
                                              />
                                              <span className="text-xs text-foreground leading-relaxed select-none group-hover:text-foreground">
                                                Xem
                                              </span>
                                            </label>
                                          </Flex>
                                        )}
                                      </TableCell>
                                      <TableCell
                                        className="text-center align-middle h-12 px-2 py-0 border-r border-border/30"
                                        style={{
                                          width: `${columnWidths.action}px`,
                                        }}
                                      >
                                        {createPerm && (
                                          <Flex
                                            align="center"
                                            justify="center"
                                            height="12"
                                            className="h-12"
                                          >
                                            <label className="flex items-center gap-2 cursor-pointer">
                                              <Checkbox
                                                checked={isPermissionSelected(
                                                  createPerm.fullValue
                                                )}
                                                onCheckedChange={() =>
                                                  handlePermissionToggle(
                                                    createPerm.fullValue
                                                  )
                                                }
                                                disabled={
                                                  field.disabled ||
                                                  isPending ||
                                                  readOnly ||
                                                  !isPermissionAvailable(
                                                    createPerm.fullValue
                                                  )
                                                }
                                                data-readonly={readOnly ? "true" : undefined}
                                                className={cn(
                                                  readOnly && "!opacity-100 disabled:!opacity-100 [&:disabled]:!opacity-100 cursor-default bg-muted/30 border-muted-foreground/30",
                                                  (field.disabled || isPending || readOnly) && !readOnly && "!opacity-100"
                                                )}
                                              />
                                              <span className="text-xs text-foreground leading-relaxed select-none group-hover:text-foreground">
                                                Thêm
                                              </span>
                                            </label>
                                          </Flex>
                                        )}
                                      </TableCell>
                                      <TableCell
                                        className="text-center align-middle h-12 px-2 py-0 border-r border-border/30"
                                        style={{
                                          width: `${columnWidths.action}px`,
                                        }}
                                      >
                                        {updatePerm && (
                                          <Flex
                                            align="center"
                                            justify="center"
                                            height="12"
                                            className="h-12"
                                          >
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                              <Checkbox
                                                checked={isPermissionSelected(
                                                  updatePerm.fullValue
                                                )}
                                                onCheckedChange={() =>
                                                  handlePermissionToggle(
                                                    updatePerm.fullValue
                                                  )
                                                }
                                                disabled={
                                                  field.disabled ||
                                                  isPending ||
                                                  readOnly ||
                                                  !isPermissionAvailable(
                                                    updatePerm.fullValue
                                                  )
                                                }
                                                data-readonly={readOnly ? "true" : undefined}
                                                className={cn(
                                                  readOnly && "!opacity-100 disabled:!opacity-100 [&:disabled]:!opacity-100 cursor-default bg-muted/30 border-muted-foreground/30",
                                                  (field.disabled || isPending || readOnly) && !readOnly && "!opacity-100"
                                                )}
                                              />
                                              <span className="text-xs text-foreground leading-relaxed select-none group-hover:text-foreground">
                                                Sửa
                                              </span>
                                            </label>
                                          </Flex>
                                        )}
                                      </TableCell>
                                      <TableCell
                                        className="text-center align-middle h-12 px-2 py-0 border-r border-border/30"
                                        style={{
                                          width: `${columnWidths.action}px`,
                                        }}
                                      >
                                        {deletePerm && (
                                          <Flex
                                            align="center"
                                            justify="center"
                                            height="12"
                                            className="h-12"
                                          >
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                              <Checkbox
                                                checked={isPermissionSelected(
                                                  deletePerm.fullValue
                                                )}
                                                onCheckedChange={() =>
                                                  handlePermissionToggle(
                                                    deletePerm.fullValue
                                                  )
                                                }
                                                disabled={
                                                  field.disabled ||
                                                  isPending ||
                                                  readOnly ||
                                                  !isPermissionAvailable(
                                                    deletePerm.fullValue
                                                  )
                                                }
                                                data-readonly={readOnly ? "true" : undefined}
                                                className={cn(
                                                  readOnly && "!opacity-100 disabled:!opacity-100 [&:disabled]:!opacity-100 cursor-default bg-muted/30 border-muted-foreground/30",
                                                  (field.disabled || isPending || readOnly) && !readOnly && "!opacity-100"
                                                )}
                                              />
                                              <span className="text-xs text-foreground leading-relaxed select-none group-hover:text-foreground">
                                                Xóa
                                              </span>
                                            </label>
                                          </Flex>
                                        )}
                                      </TableCell>
                                      <TableCell
                                        className="align-center h-12 px-4 py-0"
                                        style={{
                                          width: `${columnWidths.options}px`,
                                        }}
                                      >
                                        {otherPerms.length > 0 && (
                                          <Flex
                                            direction="col"
                                            align="start"
                                            gap={0}
                                          >
                                            {otherPerms.map((perm) => {
                                              const isAvailable =
                                                isPermissionAvailable(
                                                  perm.fullValue
                                                );

                                              // Extract option label from display label
                                              const actionLabelMap: Record<
                                                string,
                                                string
                                              > = {
                                                publish: "Xuất bản",
                                                approve: "Duyệt",
                                                assign: "Gán",
                                                manage: "Quản lý",
                                                active: "Kích hoạt",
                                              };

                                              let optionLabel =
                                                perm.displayLabel;
                                              if (
                                                perm.displayLabel.includes(
                                                  " - "
                                                )
                                              ) {
                                                const actionPart =
                                                  perm.displayLabel.split(
                                                    " - "
                                                  )[0];
                                                optionLabel =
                                                  actionLabelMap[perm.action] ||
                                                  actionPart;
                                              }

                                              return (
                                                <label
                                                  key={perm.fullValue}
                                                  className={cn(
                                                    "flex items-center gap-2.5 cursor-pointer hover:bg-muted/60 rounded-md px-2 py-1.5 transition-colors group",
                                                    !isAvailable &&
                                                      "opacity-50 cursor-not-allowed"
                                                  )}
                                                >
                                                  <Checkbox
                                                    checked={isPermissionSelected(
                                                      perm.fullValue
                                                    )}
                                                    onCheckedChange={() =>
                                                      handlePermissionToggle(
                                                        perm.fullValue
                                                      )
                                                    }
                                                    disabled={
                                                      field.disabled ||
                                                      isPending ||
                                                      readOnly ||
                                                      !isAvailable
                                                    }
                                                    data-readonly={readOnly ? "true" : undefined}
                                                    className={cn(
                                                      readOnly && "!opacity-100 disabled:!opacity-100 [&:disabled]:!opacity-100 cursor-default bg-muted/30 border-muted-foreground/30",
                                                      (field.disabled || isPending || readOnly) && !readOnly && "!opacity-100"
                                                    )}
                                                    onClick={(e) =>
                                                      e.stopPropagation()
                                                    }
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
                                }
                              )}
                          </React.Fragment>
                        );
                      })}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </FieldContent>
  );
};

// Helper component for checkbox with indeterminate support
function ResourceCheckbox({
  checked,
  indeterminate,
  onCheckedChange,
  disabled,
  readOnly,
  label,
}: {
  checked: boolean;
  indeterminate: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  readOnly?: boolean;
  label: string;
}) {
  const checkboxRef = useRef<React.ElementRef<typeof Checkbox>>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      const element = checkboxRef.current as unknown as {
        indeterminate?: boolean;
      };
      if (element) {
        element.indeterminate = indeterminate;
      }
    }
  }, [indeterminate]);

  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <Checkbox
        ref={checkboxRef}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        data-readonly={readOnly ? "true" : undefined}
        className={cn(
          readOnly && "!opacity-100 disabled:!opacity-100 [&:disabled]:!opacity-100 cursor-default bg-muted/30 border-muted-foreground/30",
          disabled && !readOnly && "!opacity-100"
        )}
      />
      <span className="font-semibold text-sm text-foreground leading-relaxed">
        {label}
      </span>
    </label>
  );
}
