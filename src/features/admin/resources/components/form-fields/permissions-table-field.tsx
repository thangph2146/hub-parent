"use client";

import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from "react";
import { ChevronDown, CheckSquare2, Square, ChevronRight, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useElementSize } from "@/hooks/use-element-size";
import type { ResourceFormField } from "../resource-form";

interface PermissionsTableFieldProps<T> {
  field: ResourceFormField<T>;
  fieldValue: unknown;
  error?: string;
  onChange: (value: unknown) => void;
  isPending?: boolean;
  availablePermissions?: string[]; // Optional: permissions that user can assign
  readOnly?: boolean; // If true, hide action buttons and make it view-only
}

interface PermissionOption {
  label: string;
  value: string | number;
}

interface PermissionGroup {
  label: string;
  options: PermissionOption[];
}

interface ParsedPermission {
  resource: string;
  action: string;
  fullValue: string;
  displayLabel: string;
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

  // Parse permissions từ groups và nhóm theo resource
  const parsedGroups = useMemo(() => {
    if (groups.length === 0) return [];
    return groups.map((group) => {
      const parsedPermissions: ParsedPermission[] = group.options.map(
        (option) => {
          const valueStr = String(option.value);
          const [resource, action] = valueStr.split(":");
          return {
            resource,
            action,
            fullValue: valueStr,
            displayLabel: option.label,
          };
        }
      );

      // Nhóm permissions theo resource
      const resourceMap = new Map<string, ParsedPermission[]>();
      parsedPermissions.forEach((perm) => {
        if (!resourceMap.has(perm.resource)) {
          resourceMap.set(perm.resource, []);
        }
        resourceMap.get(perm.resource)!.push(perm);
      });

      return {
        groupLabel: group.label,
        resources: Array.from(resourceMap.entries()).map(
          ([resource, perms]) => ({
            resource,
            permissions: perms.sort((a, b) => {
              // Sắp xếp: view, create, update, delete trước, sau đó các actions khác
              const order = ["view", "create", "update", "delete"];
              const aIndex = order.indexOf(a.action);
              const bIndex = order.indexOf(b.action);
              if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
              if (aIndex !== -1) return -1;
              if (bIndex !== -1) return 1;
              return a.action.localeCompare(b.action);
            }),
          })
        ),
      };
    });
  }, [groups]);

  // Auto-expand all in read-only mode
  // Using useLayoutEffect to sync state before paint for better UX
  useLayoutEffect(() => {
    if (readOnly && parsedGroups.length > 0) {
      const allGroupLabels = new Set(parsedGroups.map((g) => g.groupLabel));
      const allResourceKeys = new Set<string>();
      parsedGroups.forEach((group) => {
        group.resources.forEach((resource) => {
          const resourceKey = `${group.groupLabel}-${resource.resource}`;
          allResourceKeys.add(resourceKey);
        });
      });
      
      // Only update if different
      if (
        openGroups.size !== allGroupLabels.size ||
        openResources.size !== allResourceKeys.size
      ) {
        setOpenGroups(allGroupLabels);
        setOpenResources(allResourceKeys);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, parsedGroups.length]);

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
    const newOpenGroups = new Set(openGroups);
    if (newOpenGroups.has(groupLabel)) {
      newOpenGroups.delete(groupLabel);
    } else {
      newOpenGroups.add(groupLabel);
    }
    setOpenGroups(newOpenGroups);
  };

  const toggleResource = (resourceKey: string) => {
    const newOpenResources = new Set(openResources);
    if (newOpenResources.has(resourceKey)) {
      newOpenResources.delete(resourceKey);
    } else {
      newOpenResources.add(resourceKey);
    }
    setOpenResources(newOpenResources);
  };

  // Check if all groups and resources are open
  const allExpanded = useMemo(() => {
    if (parsedGroups.length === 0) return false;
    
    // Check if all groups are open
    const allGroupsOpen = parsedGroups.every((group) =>
      openGroups.has(group.groupLabel)
    );
    
    if (!allGroupsOpen) return false;
    
    // Check if all resources in all groups are open
    const allResourcesOpen = parsedGroups.every((group) =>
      group.resources.every((resource) => {
        const resourceKey = `${group.groupLabel}-${resource.resource}`;
        return openResources.has(resourceKey);
      })
    );
    
    return allResourcesOpen;
  }, [parsedGroups, openGroups, openResources]);

  // Handle expand/collapse all
  const handleExpandAll = () => {
    if (allExpanded) {
      // Collapse all
      setOpenGroups(new Set());
      setOpenResources(new Set());
    } else {
      // Expand all
      const allGroupLabels = new Set(parsedGroups.map((g) => g.groupLabel));
      setOpenGroups(allGroupLabels);
      
      const allResourceKeys = new Set<string>();
      parsedGroups.forEach((group) => {
        group.resources.forEach((resource) => {
          const resourceKey = `${group.groupLabel}-${resource.resource}`;
          allResourceKeys.add(resourceKey);
        });
      });
      setOpenResources(allResourceKeys);
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
    const currentValues = selectedValues;

    if (currentValues.includes(valueStr)) {
      const newValues = currentValues.filter((v) => v !== valueStr);
      onChange(newValues.length > 0 ? newValues : []);
    } else {
      onChange([...currentValues, valueStr]);
    }
  };

  const handleResourceToggle = (resource: string, groupLabel: string) => {
    const group = parsedGroups.find((g) => g.groupLabel === groupLabel);
    if (!group) return;

    const resourceData = group.resources.find((r) => r.resource === resource);
    if (!resourceData) return;

    // Filter only available permissions
    const resourcePermissions = resourceData.permissions
      .filter((p) => isPermissionAvailable(p.fullValue))
      .map((p) => p.fullValue);

    if (resourcePermissions.length === 0) return;

    const allSelected = resourcePermissions.every((p) =>
      selectedValues.includes(p)
    );

    if (allSelected) {
      const newValues = selectedValues.filter(
        (v) => !resourcePermissions.includes(v)
      );
      onChange(newValues);
    } else {
      const newValues = [
        ...new Set([...selectedValues, ...resourcePermissions]),
      ];
      onChange(newValues);
    }
  };

  const isPermissionSelected = (permissionValue: string) => {
    return selectedValues.includes(String(permissionValue));
  };

  const isResourceFullySelected = (resource: string, groupLabel: string) => {
    const group = parsedGroups.find((g) => g.groupLabel === groupLabel);
    if (!group) return false;

    const resourceData = group.resources.find((r) => r.resource === resource);
    if (!resourceData) return false;

    const resourcePermissions = resourceData.permissions
      .filter((p) => isPermissionAvailable(p.fullValue))
      .map((p) => p.fullValue);

    if (resourcePermissions.length === 0) return false;
    return resourcePermissions.every((p) => selectedValues.includes(p));
  };

  const isResourcePartiallySelected = (
    resource: string,
    groupLabel: string
  ) => {
    const group = parsedGroups.find((g) => g.groupLabel === groupLabel);
    if (!group) return false;

    const resourceData = group.resources.find((r) => r.resource === resource);
    if (!resourceData) return false;

    const resourcePermissions = resourceData.permissions
      .filter((p) => isPermissionAvailable(p.fullValue))
      .map((p) => p.fullValue);

    const selectedCount = resourcePermissions.filter((p) =>
      selectedValues.includes(p)
    ).length;
    return selectedCount > 0 && selectedCount < resourcePermissions.length;
  };

  const getPermissionDisplayName = (permission: ParsedPermission) => {
    // Extract resource name from display label (format: "Action - Resource")
    const parts = permission.displayLabel.split(" - ");
    if (parts.length === 2) {
      return parts[1]; // Return resource name
    }
    return permission.resource;
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
    <FieldContent className="items-start justify-start w-full gap-3">
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
                field.disabled || isPending || allAvailablePermissions.length === 0
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
              disabled={field.disabled || isPending || parsedGroups.length === 0}
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
      
      {/* Summary info for read-only mode */}
      {readOnly && (
        <Flex align="center" justify="between" fullWidth paddingX={1}>
          <span className="text-sm text-muted-foreground">
            {selectedValues.length} quyền đã được gán
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleExpandAll}
            disabled={parsedGroups.length === 0}
            className="gap-2 h-7"
          >
            {allExpanded ? (
              <>
                <ChevronsUpDown className="h-3.5 w-3.5" />
                Thu gọn
              </>
            ) : (
              <>
                <ChevronsDownUp className="h-3.5 w-3.5" />
                Mở tất cả
              </>
            )}
          </Button>
        </Flex>
      )}

      <div
        ref={tableRef}
        className={cn(
          "rounded-lg border border-border bg-background overflow-hidden w-full shadow-sm",
          error && "border-destructive"
        )}
      >
        <div className="overflow-x-auto">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                <TableHead
                  className="font-semibold text-foreground h-12 px-4 border-r border-border/50 align-middle"
                  style={{ width: `${columnWidths.function}px`, minWidth: `${columnWidths.function}px` }}
                >
                  Chức năng
                </TableHead>
                <TableHead
                  className="text-center font-semibold text-foreground h-12 px-2 border-r border-border/50 align-middle"
                  style={{ width: `${columnWidths.action}px`, minWidth: `${columnWidths.action}px` }}
                >
                  Xem
                </TableHead>
                <TableHead
                  className="text-center font-semibold text-foreground h-12 px-2 border-r border-border/50 align-middle"
                  style={{ width: `${columnWidths.action}px`, minWidth: `${columnWidths.action}px` }}
                >
                  Thêm
                </TableHead>
                <TableHead
                  className="text-center font-semibold text-foreground h-12 px-2 border-r border-border/50 align-middle"
                  style={{ width: `${columnWidths.action}px`, minWidth: `${columnWidths.action}px` }}
                >
                  Sửa
                </TableHead>
                <TableHead
                  className="text-center font-semibold text-foreground h-12 px-2 border-r border-border/50 align-middle"
                  style={{ width: `${columnWidths.action}px`, minWidth: `${columnWidths.action}px` }}
                >
                  Xóa
                </TableHead>
                <TableHead
                  className="text-left font-semibold text-foreground h-12 px-4 align-middle"
                  style={{ width: `${columnWidths.options}px`, minWidth: `${columnWidths.options}px` }}
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
                    <TableRow className="bg-muted/40 hover:bg-muted/60 border-b-2 border-border/50">
                      <TableCell colSpan={6} className="p-0">
                        <button
                          type="button"
                          onClick={() => toggleGroup(parsedGroup.groupLabel)}
                          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/80 transition-colors cursor-pointer h-12"
                        >
                          <ChevronDown
                            className={cn(
                              "h-5 w-5 transition-transform shrink-0 text-muted-foreground",
                              isGroupOpen && "transform rotate-180 text-foreground"
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
                                const isResourceFully = isResourceFullySelected(
                                  resourceData.resource,
                                  parsedGroup.groupLabel
                                );
                                const isResourcePartial = isResourcePartiallySelected(
                                  resourceData.resource,
                                  parsedGroup.groupLabel
                                );

                                // Get all permissions for this resource, grouped by display name
                                const permissionsByDisplay = new Map<
                                  string,
                                  ParsedPermission[]
                                >();
                                resourceData.permissions.forEach((perm) => {
                                  const displayName = getPermissionDisplayName(perm);
                                  if (!permissionsByDisplay.has(displayName)) {
                                    permissionsByDisplay.set(displayName, []);
                                  }
                                  permissionsByDisplay.get(displayName)!.push(perm);
                                });

                        return (
                          <React.Fragment key={resourceData.resource}>
                            {/* Resource Row - Parent Node */}
                            <TableRow className="bg-muted/30 hover:bg-muted/40 border-b border-border/40">
                                      <TableCell
                                        className="pl-4 h-12 px-4 py-0 border-r border-border/30 align-middle"
                                        style={{ width: `${columnWidths.function}px` }}
                                      >
                                        <Flex align="center" gap={2} height="12" className="h-12">
                                          <button
                                            type="button"
                                            onClick={() => toggleResource(resourceKey)}
                                            className="p-0.5 hover:bg-muted/60 rounded transition-colors"
                                            disabled={field.disabled || isPending}
                                          >
                                            {isResourceOpen ? (
                                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            )}
                                          </button>
                                          <ResourceCheckbox
                                            checked={isResourceFully}
                                            indeterminate={isResourcePartial}
                                            onCheckedChange={() =>
                                              handleResourceToggle(
                                                resourceData.resource,
                                                parsedGroup.groupLabel
                                              )
                                            }
                                            disabled={field.disabled || isPending}
                                            label={resourceData.resource}
                                          />
                                        </Flex>
                                      </TableCell>
                                      <TableCell
                                        className="h-12 py-0 border-r border-border/30"
                                        style={{ width: `${columnWidths.action}px` }}
                                      ></TableCell>
                                      <TableCell
                                        className="h-12 py-0 border-r border-border/30"
                                        style={{ width: `${columnWidths.action}px` }}
                                      ></TableCell>
                                      <TableCell
                                        className="h-12 py-0 border-r border-border/30"
                                        style={{ width: `${columnWidths.action}px` }}
                                      ></TableCell>
                                      <TableCell
                                        className="h-12 py-0 border-r border-border/30"
                                        style={{ width: `${columnWidths.action}px` }}
                                      ></TableCell>
                                      <TableCell
                                        className="h-12 py-0"
                                        style={{ width: `${columnWidths.options}px` }}
                              ></TableCell>
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
                                    >
                                      <TableCell
                                        className="pl-16 h-12 px-4 py-0 border-r border-border/30 align-middle"
                                        style={{ width: `${columnWidths.function}px` }}
                                      >
                                        <span className="text-sm font-medium text-foreground leading-relaxed">
                                          {displayName}
                                        </span>
                                      </TableCell>
                                      <TableCell
                                        className="text-center align-middle h-12 px-2 py-0 border-r border-border/30"
                                        style={{ width: `${columnWidths.action}px` }}
                                      >
                                        {viewPerm && (
                                          <Flex
                                            align="center"
                                            justify="center"
                                            height="12"
                                            className="h-12"
                                          >
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
                                                !isPermissionAvailable(
                                                  viewPerm.fullValue
                                                )
                                              }
                                            />
                                          </Flex>
                                        )}
                                      </TableCell>
                                      <TableCell
                                        className="text-center align-middle h-12 px-2 py-0 border-r border-border/30"
                                        style={{ width: `${columnWidths.action}px` }}
                                      >
                                        {createPerm && (
                                          <Flex
                                            align="center"
                                            justify="center"
                                            height="12"
                                            className="h-12"
                                          >
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
                                                !isPermissionAvailable(
                                                  createPerm.fullValue
                                                )
                                              }
                                            />
                                          </Flex>
                                        )}
                                      </TableCell>
                                      <TableCell
                                        className="text-center align-middle h-12 px-2 py-0 border-r border-border/30"
                                        style={{ width: `${columnWidths.action}px` }}
                                      >
                                        {updatePerm && (
                                          <Flex
                                            align="center"
                                            justify="center"
                                            height="12"
                                            className="h-12"
                                          >
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
                                                !isPermissionAvailable(
                                                  updatePerm.fullValue
                                                )
                                              }
                                            />
                                          </Flex>
                                        )}
                                      </TableCell>
                                      <TableCell
                                        className="text-center align-middle h-12 px-2 py-0 border-r border-border/30"
                                        style={{ width: `${columnWidths.action}px` }}
                                      >
                                        {deletePerm && (
                                          <Flex
                                            align="center"
                                            justify="center"
                                            height="12"
                                            className="h-12"
                                          >
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
                                                !isPermissionAvailable(
                                                  deletePerm.fullValue
                                                )
                                              }
                                            />
                                          </Flex>
                                        )}
                                      </TableCell>
                                      <TableCell
                                        className="align-center h-12 px-4 py-0"
                                        style={{ width: `${columnWidths.options}px` }}
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

                                              let optionLabel = perm.displayLabel;
                                              if (
                                                perm.displayLabel.includes(" - ")
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
                                                      !isAvailable
                                                    }
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
                                })}
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
  label,
}: {
  checked: boolean;
  indeterminate: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
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
      />
      <span className="font-semibold text-sm text-foreground leading-relaxed">
        {label}
      </span>
    </label>
  );
}
