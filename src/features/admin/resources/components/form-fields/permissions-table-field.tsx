"use client";

import React, {
  useState,
  useMemo,
  useLayoutEffect,
  useCallback,
} from "react";
import {
  Table,
  TableBody,
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

// Sub-sections
import { PermissionsTableHeader } from "./permissions-table-field-sub-sections/PermissionsTableHeader";
import { GroupRow, ResourceRow, PermissionItemRow } from "./permissions-table-field-sub-sections/PermissionsTableRows";

interface PermissionsTableFieldProps<T> {
  field: ResourceFormField<T>;
  fieldValue: unknown;
  error?: string;
  onChange: (value: unknown) => void;
  isPending?: boolean;
  availablePermissions?: string[];
  readOnly?: boolean;
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

  const allAvailablePermissions = useMemo(() => {
    if (groups.length === 0) return [];
    return groups.flatMap((group) =>
      group.options.map((opt) => String(opt.value))
    );
  }, [groups]);

  const isPermissionAvailable = useCallback((permissionValue: string) => {
    if (!availablePermissions) return true;
    return availablePermissions.includes(permissionValue);
  }, [availablePermissions]);

  const parsedGroups = useMemo(() => {
    return parsePermissionGroups(groups);
  }, [groups]);

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
    setOpenGroups(allGroupLabels);
    setOpenResources(allResourceKeys);
  }, [readOnly, parsedGroups]);

  const allSelected = useMemo(() => {
    if (allAvailablePermissions.length === 0) return false;
    return allAvailablePermissions.every((perm) =>
      selectedValues.includes(perm)
    );
  }, [allAvailablePermissions, selectedValues]);

  const someSelected = useMemo(() => {
    if (allAvailablePermissions.length === 0) return false;
    const selectedCount = allAvailablePermissions.filter((perm) =>
      selectedValues.includes(perm)
    ).length;
    return selectedCount > 0 && selectedCount < allAvailablePermissions.length;
  }, [allAvailablePermissions, selectedValues]);

  const toggleGroup = useCallback((groupLabel: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupLabel)) next.delete(groupLabel);
      else next.add(groupLabel);
      return next;
    });
  }, []);

  const toggleResource = useCallback((resourceKey: string) => {
    setOpenResources((prev) => {
      const next = new Set(prev);
      if (next.has(resourceKey)) next.delete(resourceKey);
      else next.add(resourceKey);
      return next;
    });
  }, []);

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

  const handleExpandAll = useCallback(() => {
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
  }, [allExpanded, parsedGroups]);

  const handleSelectAll = useCallback(() => {
    if (allSelected) onChange([]);
    else onChange([...allAvailablePermissions]);
  }, [allSelected, allAvailablePermissions, onChange]);

  const handlePermissionToggle = useCallback((permissionValue: string) => {
    if (!isPermissionAvailable(permissionValue)) return;
    const valueStr = String(permissionValue);
    const newValues = selectedValues.includes(valueStr)
      ? selectedValues.filter((v) => v !== valueStr)
      : [...selectedValues, valueStr];
    onChange(newValues.length > 0 ? newValues : []);
  }, [selectedValues, isPermissionAvailable, onChange]);

  const isPermissionSelected = useCallback((permissionValue: string) => {
    return selectedValues.includes(String(permissionValue));
  }, [selectedValues]);

  const getAvailablePermissions = useCallback((permissions: ParsedPermission[]) =>
    permissions
      .filter((p) => isPermissionAvailable(p.fullValue))
      .map((p) => p.fullValue), [isPermissionAvailable]);

  const areAllPermissionsSelected = useCallback((permissions: ParsedPermission[]) => {
    const availablePerms = getAvailablePermissions(permissions);
    return availablePerms.length > 0 && availablePerms.every((p) => selectedValues.includes(p));
  }, [getAvailablePermissions, selectedValues]);

  const areSomePermissionsSelected = useCallback((permissions: ParsedPermission[]) => {
    const availablePerms = getAvailablePermissions(permissions);
    if (availablePerms.length === 0) return false;
    const selectedCount = availablePerms.filter((p) => selectedValues.includes(p)).length;
    return selectedCount > 0 && selectedCount < availablePerms.length;
  }, [getAvailablePermissions, selectedValues]);

  const handleToggleAllPermissions = useCallback((permissions: ParsedPermission[]) => {
    const availablePerms = getAvailablePermissions(permissions);
    if (availablePerms.length === 0) return;
    const allSelected = availablePerms.every((p) => selectedValues.includes(p));
    const newValues = allSelected
      ? selectedValues.filter((v) => !availablePerms.includes(v))
      : [...new Set([...selectedValues, ...availablePerms])];
    onChange(newValues);
  }, [getAvailablePermissions, selectedValues, onChange]);

  const columnWidths = useMemo(() => {
    if (tableWidth === 0) return { function: 280, action: 90, options: 200 };
    const availableWidth = tableWidth - 21; // Proportional widths
    return {
      function: Math.max(200, Math.floor(availableWidth * 0.35)),
      action: Math.max(70, Math.floor(availableWidth * 0.11)),
      options: Math.max(150, Math.floor(availableWidth * 0.21)),
    };
  }, [tableWidth]);

  if (groups.length === 0) {
    return (
      <FieldContent>
        <div className="rounded-lg border border-border bg-background p-6 text-center text-sm text-muted-foreground">
          Không có quyền nào để hiển thị
        </div>
        {error && <FieldError>{error}</FieldError>}
      </FieldContent>
    );
  }

  return (
    <FieldContent className="items-start justify-start w-full gap-3 min-w-0 flex-1 min-h-0">
      <PermissionsTableHeader
        readOnly={readOnly}
        handleSelectAll={handleSelectAll}
        handleExpandAll={handleExpandAll}
        allSelected={allSelected}
        allExpanded={allExpanded}
        someSelected={someSelected}
        selectedCount={selectedValues.length}
        totalCount={allAvailablePermissions.length}
        disabled={field.disabled}
        isPending={isPending}
      />

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
              <TableRow className="bg-muted hover:bg-muted border-b border-border">
                <TableHead className="px-4 border-r align-middle" style={{ width: `${columnWidths.function}px` }}>Chức năng</TableHead>
                <TableHead className="text-center px-2 border-r align-middle" style={{ width: `${columnWidths.action}px` }}>Xem</TableHead>
                <TableHead className="text-center px-2 border-r align-middle" style={{ width: `${columnWidths.action}px` }}>Thêm</TableHead>
                <TableHead className="text-center px-2 border-r align-middle" style={{ width: `${columnWidths.action}px` }}>Sửa</TableHead>
                <TableHead className="text-center px-2 border-r align-middle" style={{ width: `${columnWidths.action}px` }}>Xóa</TableHead>
                <TableHead className="px-4 align-middle" style={{ width: `${columnWidths.options}px` }}>Tùy chọn</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsedGroups.map((parsedGroup) => (
                <React.Fragment key={parsedGroup.groupLabel}>
                  <GroupRow
                    groupLabel={parsedGroup.groupLabel}
                    isOpen={openGroups.has(parsedGroup.groupLabel)}
                    onToggle={() => toggleGroup(parsedGroup.groupLabel)}
                  />
                  {openGroups.has(parsedGroup.groupLabel) &&
                    parsedGroup.resources.map((resourceData) => {
                      const resourceKey = `${parsedGroup.groupLabel}-${resourceData.resource}`;
                      return (
                        <React.Fragment key={resourceData.resource}>
                          <ResourceRow
                            resourceName={resourceData.resource}
                            isOpen={openResources.has(resourceKey)}
                            onToggle={() => toggleResource(resourceKey)}
                          />
                          {openResources.has(resourceKey) &&
                            Array.from(groupPermissionsByDisplayName(resourceData.permissions).entries()).map(
                              ([displayName, perms]) => (
                                <PermissionItemRow
                                  key={displayName}
                                  displayName={displayName}
                                  perms={perms}
                                  columnWidths={columnWidths}
                                  isPermissionSelected={isPermissionSelected}
                                  isPermissionAvailable={isPermissionAvailable}
                                  handlePermissionToggle={handlePermissionToggle}
                                  areAllPermissionsSelected={areAllPermissionsSelected}
                                  areSomePermissionsSelected={areSomePermissionsSelected}
                                  handleToggleAllPermissions={handleToggleAllPermissions}
                                  disabled={field.disabled}
                                  isPending={isPending}
                                  readOnly={readOnly}
                                />
                              )
                            )}
                        </React.Fragment>
                      );
                    })}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      {error && <FieldError>{error}</FieldError>}
    </FieldContent>
  );
};
