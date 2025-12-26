"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown, CheckSquare2, Square } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { Flex } from "@/components/ui/flex";
import { cn } from "@/lib/utils";
import type { ResourceFormField } from "../resource-form";

interface PermissionsTableFieldProps<T> {
  field: ResourceFormField<T>;
  fieldValue: unknown;
  error?: string;
  onChange: (value: unknown) => void;
  isPending?: boolean;
  availablePermissions?: string[]; // Optional: permissions that user can assign
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
}: PermissionsTableFieldProps<T>) => {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

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
      {/* Select All Button */}
      <Flex align="center" justify="between" fullWidth paddingX={1}>
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
        {someSelected && (
          <span className="text-sm text-muted-foreground">
            Đã chọn {selectedValues.length} / {allAvailablePermissions.length}{" "}
            quyền
          </span>
        )}
      </Flex>
      <Flex direction="col" gap={0} padding="sm">
        <Table className="table-fixed w-full border border-border">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
              <TableHead className="font-semibold text-foreground w-[280px] h-12 px-4 border-r border-border/50 align-middle">
                Chức năng
              </TableHead>
              <TableHead className="text-center font-semibold text-foreground w-[90px] h-12 px-2 border-r border-border/50 align-middle">
                Xem
              </TableHead>
              <TableHead className="text-center font-semibold text-foreground w-[90px] h-12 px-2 border-r border-border/50 align-middle">
                Thêm
              </TableHead>
              <TableHead className="text-center font-semibold text-foreground w-[90px] h-12 px-2 border-r border-border/50 align-middle">
                Sửa
              </TableHead>
              <TableHead className="text-center font-semibold text-foreground w-[90px] h-12 px-2 border-r border-border/50 align-middle">
                Xóa
              </TableHead>
              <TableHead className="text-left font-semibold text-foreground w-auto h-12 px-4 align-middle">
                Tùy chọn
              </TableHead>
            </TableRow>
          </TableHeader>
        </Table>
        {parsedGroups.map((parsedGroup) => {
          const isGroupOpen = openGroups.has(parsedGroup.groupLabel);

          return (
            <Collapsible
              key={parsedGroup.groupLabel}
              open={isGroupOpen}
              onOpenChange={() => toggleGroup(parsedGroup.groupLabel)}
              className="border border-border"
            >
              {/* Collapsible Header */}
              <CollapsibleTrigger className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/80 transition-colors cursor-pointer bg-muted/40 border-b border-border/50">
                <ChevronDown
                  className={cn(
                    "h-5 w-5 transition-transform shrink-0 text-muted-foreground",
                    isGroupOpen && "transform rotate-180 text-foreground"
                  )}
                />
                <span className="font-semibold text-base text-foreground flex-1 text-left">
                  {parsedGroup.groupLabel}
                </span>
              </CollapsibleTrigger>

              {/* Collapsible Content - Table */}
              <CollapsibleContent>
                <div className="bg-background overflow-x-auto">
                  <Table className="table-fixed w-full">
                    <TableBody>
                      {parsedGroup.resources.map((resourceData) => {
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
                            {/* Permission Rows - Group by display name */}
                            {Array.from(permissionsByDisplay.entries()).map(
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
                                    {/* Resource Header Row */}
                                    <ResourceCheckboxRow
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
                                      display={displayName}
                                    />
                                    <TableCell className="w-[90px] text-center align-middle h-12 px-2 py-0 border-r border-border/30">
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
                                    <TableCell className="w-[90px] text-center align-middle h-12 px-2 py-0 border-r border-border/30">
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
                                    <TableCell className="w-[90px] text-center align-middle h-12 px-2 py-0 border-r border-border/30">
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
                                    <TableCell className="w-[90px] text-center align-middle h-12 px-2 py-0 border-r border-border/30">
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
                                    <TableCell className="w-auto align-center justify-center h-12 px-4 py-0">
                                      {otherPerms.length > 0 && (
                                        <Flex
                                          direction="col"
                                          align="start"
                                          gap={0}
                                          paddingY={2}
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
                                                  "flex items-center justify-center gap-2.5 cursor-pointer hover:bg-muted/60 rounded-md px-2 py-1.5 transition-colors group",
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
                              }
                            )}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </Flex>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </FieldContent>
  );
};

// Helper component for checkbox with indeterminate support
function ResourceCheckboxRow({
  checked,
  indeterminate,
  onCheckedChange,
  disabled,
  label,
  display,
}: {
  checked: boolean;
  indeterminate: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  display: string;
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
    <TableCell className="w-[280px] pl-12 h-12 px-4 py-0 border-r border-border/30 align-middle">
      <Flex align="center" gap={3} height="12" className="h-12">
        <FieldLabel className="flex items-center gap-2 p-2 hover:bg-muted/60 rounded-md transition-colors cursor-pointer">
          <Checkbox
            ref={checkboxRef}
            checked={checked}
            onCheckedChange={onCheckedChange}
            disabled={disabled}
          />
          <span className="font-semibold text-sm text-foreground leading-relaxed">
            {label} - ({display})
          </span>
        </FieldLabel>
      </Flex>
    </TableCell>
  );
}
