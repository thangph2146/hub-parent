"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldTitle,
} from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { type ResourceFormSection } from "./resource-form";
import { useResourceSegment } from "@/hooks/use-resource-segment";
import { applyResourceSegmentToPath } from "@/lib/permissions";
import { useResourceNavigation } from "../hooks";
import { logger } from "@/lib/config/logger";
import { TypographySpanSmall, TypographySpanMuted, TypographyH1, TypographyPMuted, IconSize } from "@/components/ui/typography";
import { Flex } from "@/components/ui/flex";
import { Grid } from "@/components/ui/grid";

export interface ResourceDetailField<T = unknown> {
  name: keyof T | string;
  label: string;
  description?: string;
  render?: (value: unknown, data: T) => React.ReactNode;
  format?: (value: unknown) => string;
  type?: "text" | "date" | "boolean" | "number" | "custom";
  section?: string;
}

export interface ResourceDetailSection<T = unknown>
  extends ResourceFormSection {
  fieldHeader?: React.ReactNode;
  fieldFooter?: React.ReactNode;
  fieldsContent?: (
    fields: ResourceDetailField<T>[],
    data: T
  ) => React.ReactNode;
}

export interface ResourceDetailClientProps<T extends Record<string, unknown>> {
  data: T | null;
  isLoading?: boolean;

  fields:
    | ResourceDetailField<T>[]
    | {
        title?: string;
        description?: string;
        fields: ResourceDetailField<T>[];
      };

  // UI
  title?: string;
  description?: string;
  backUrl?: string;
  backLabel?: string;

  actions?: React.ReactNode;

  sections?: Array<{
    title: string;
    description?: string;
    fields: ResourceDetailField<T>[];
  }>;

  detailSections?: ResourceDetailSection<T>[];

  afterSections?: React.ReactNode;

  onBack?: () => void | Promise<void>;
}

export const ResourceDetailClient = <T extends Record<string, unknown>>({
  data,
  isLoading = false,
  fields,
  title,
  description,
  backUrl,
  backLabel = "Quay lại",
  actions,
  sections,
  detailSections,
  afterSections,
  onBack,
}: ResourceDetailClientProps<T>) => {
  const resourceSegment = useResourceSegment();
  const resolvedBackUrl = React.useMemo(
    () =>
      backUrl
        ? applyResourceSegmentToPath(backUrl, resourceSegment)
        : undefined,
    [backUrl, resourceSegment]
  );

  const { navigateBack } = useResourceNavigation();

  const handleBack = async () => {
    if (resolvedBackUrl) {
      logger.info("🔙 Back button clicked", {
        source: "detail-back-button",
        backUrl: resolvedBackUrl,
        currentPath:
          typeof window !== "undefined" ? window.location.pathname : undefined,
        hasOnBack: !!onBack,
      });
      await navigateBack(resolvedBackUrl, onBack);
    }
  };

  const allFields = React.useMemo(
    () => (Array.isArray(fields) ? fields : fields.fields),
    [fields]
  );

  const groupFieldsBySection = React.useMemo(() => {
    const grouped: Record<string, ResourceDetailField<T>[]> = {};
    const ungrouped: ResourceDetailField<T>[] = [];

    allFields.forEach((field) => {
      if (field.section) {
        grouped[field.section] ??= [];
        grouped[field.section].push(field);
      } else {
        ungrouped.push(field);
      }
    });

    return { grouped, ungrouped };
  }, [allFields]);

  const formatValue = React.useCallback(
    (field: ResourceDetailField<T>, value: unknown): React.ReactNode => {
      if (field.render) return field.render(value, data!);
      if (value == null)
        return <TypographySpanMuted>—</TypographySpanMuted>;
      if (field.format) return field.format(value);

      switch (field.type) {
        case "boolean": {
          const boolValue = Boolean(value);
          return (
            <Flex
              align="center"
              className={cn(
                "rounded-full px-2 py-1",
                boolValue
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
              )}
            >
              <TypographySpanSmall>
                {boolValue ? "Có" : "Không"}
              </TypographySpanSmall>
            </Flex>
          );
        }
        case "date":
          try {
            return new Date(value as string | number).toLocaleDateString(
              "vi-VN",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }
            );
          } catch {
            return String(value);
          }
        case "number":
          return typeof value === "number"
            ? value.toLocaleString("vi-VN")
            : String(value);
        default:
          return (
            <TypographySpanMuted>
              {String(value)}
            </TypographySpanMuted>
          );
      }
    },
    [data]
  );

  const isComplexReactNode = (node: React.ReactNode): boolean => {
    if (!node) return false;
    if (typeof node === "string" || typeof node === "number") return false;
    if (React.isValidElement(node)) {
      const element = node as React.ReactElement<{ className?: string }>;
      if (
        element.type === Card ||
        (typeof element.type === "string" &&
          ["div", "section", "article"].includes(element.type))
      ) {
        return true;
      }
      const className = element.props?.className;
      if (className && typeof className === "string") {
        const layoutClasses = [
          "flex",
          "grid",
          "card",
          "border",
          "p-",
          "gap-",
          "shadow",
        ];
        return layoutClasses.some((lc) => className.includes(lc));
      }
    }
    return false;
  };

  const renderField = React.useCallback(
    (field: ResourceDetailField<T>, inSection = false) => {
      const value = data?.[field.name as keyof T];
      const formattedValue = isLoading ? (
        <Skeleton className="h-4 w-32" />
      ) : (
        formatValue(field, value)
      );
      const isCustomRender = !!field.render;
      const isComplexNode = isComplexReactNode(formattedValue);

      return (
        <Field
          orientation="vertical"
          className={cn(
            "py-2.5",
            !inSection && "border-b border-border/50 last:border-0"
          )}
        >
          <FieldTitle>
            {field.label}
          </FieldTitle>
          <FieldContent>
            {isCustomRender || isComplexNode ? (
              formattedValue
            ) : (
              <TypographySpanMuted>
                {formattedValue}
              </TypographySpanMuted>
            )}
            {field.description && (
              <FieldDescription>
                {field.description}
              </FieldDescription>
            )}
          </FieldContent>
        </Field>
      );
    },
    [data, isLoading, formatValue]
  );

  const renderFields = React.useCallback(
    (fieldsToRender: ResourceDetailField<T>[]) => {
      if (fieldsToRender.length === 0) return null;

      return (
        <FieldGroup>
          {fieldsToRender.map((field) => (
            <React.Fragment key={String(field.name)}>
              {renderField(field, false)}
            </React.Fragment>
          ))}
        </FieldGroup>
      );
    },
    [renderField]
  );

  const getGridProps = React.useCallback((fieldCount: number) => {
    if (fieldCount === 1) {
      return { cols: 1 as const, gap: 6 as const };
    }
    if (fieldCount === 2) {
      return {
        cols: 2 as const,
        gap: 6 as const,
      };
    }
    return {
      cols: 2 as const,
      gap: 6 as const,
    };
  }, []);

  const renderSection = React.useCallback(
    (sectionId: string, sectionFields: ResourceDetailField<T>[]) => {
      const sectionInfo = detailSections?.find((s) => s.id === sectionId);
      const gridProps = getGridProps(sectionFields.length);

      const fieldsContent =
        sectionInfo?.fieldsContent && data ? (
          sectionInfo.fieldsContent(sectionFields, data)
        ) : (
          <Grid {...gridProps}>
            {sectionFields.map((field) => (
              <Flex key={String(field.name)} className="min-w-0">
                {renderField(field, true)}
              </Flex>
            ))}
          </Grid>
        );

      return (
        <Card key={sectionId}>
          <CardHeader className="pb-3">
            <CardTitle>
              {sectionInfo?.title || "Thông tin chi tiết"}
            </CardTitle>
            {sectionInfo?.description && (
              <CardDescription className="mt-0.5">
                {sectionInfo.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <Flex direction="col" gap={6}>
              {sectionInfo?.fieldHeader && (
                <Flex>{sectionInfo.fieldHeader}</Flex>
              )}
              {fieldsContent}
              {sectionInfo?.fieldFooter && (
                <Flex>{sectionInfo.fieldFooter}</Flex>
              )}
            </Flex>
          </CardContent>
        </Card>
      );
    },
    [detailSections, data, getGridProps, renderField]
  );

  if (isLoading) {
    return (
      <Flex direction="col" gap={6}>
        <Flex align="center" justify="between">
          <Flex direction="col" gap={2}>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </Flex>
          <Skeleton className="h-10 w-32" />
        </Flex>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Flex direction="col" gap={4}>
              {[1, 2, 3, 4].map((i) => (
                <Flex key={i} align="center" justify="between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-58" />
                </Flex>
              ))}
            </Flex>
          </CardContent>
        </Card>
      </Flex>
    );
  }

  if (!data) {
    return (
      <Flex direction="col" align="center" justify="center" gap={4}>
        <Card>
          <CardContent className="pt-6">
            <Flex direction="col" align="center" gap={4}>
              <TypographyPMuted>Không tìm thấy dữ liệu</TypographyPMuted>
              {resolvedBackUrl && (
                <Button
                  variant="outline"
                  onClick={() => navigateBack(resolvedBackUrl, onBack)}
                >
                  <Flex align="center" gap={2}>
                    <IconSize size="md">
                      <ArrowLeft />
                    </IconSize>
                    {backLabel}
                  </Flex>
                </Button>
              )}
            </Flex>
          </CardContent>
        </Card>
      </Flex>
    );
  }

  return (
    <Flex direction="col" gap={6}>
      {/* Header */}
      {(title || resolvedBackUrl || actions) && (
        <Flex 
          direction="col" 
          align="start" 
          justify="between" 
          gap={4} 
          className="w-full pb-6 border-b border-border lg:flex-row lg:items-center"
        >
          <Flex direction="col" gap={3} className="w-full lg:w-auto flex-1 min-w-0">
            {resolvedBackUrl && (
              <Flex>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  className="h-8"
                >
                  <Flex align="center" gap={2}>
                    <IconSize size="sm">
                      <ArrowLeft />
                    </IconSize>
                    {backLabel}
                  </Flex>
                </Button>
              </Flex>
            )}
            <Flex direction="col" gap={2} className="min-w-0">
              {title && (
                <TypographyH1 className="truncate">
                  {title}
                </TypographyH1>
              )}
              {description && (
                <TypographyPMuted className="line-clamp-2">
                  {description}
                </TypographyPMuted>
              )}
            </Flex>
          </Flex>
          {actions && (
            <Flex align="center" gap={2} wrap={true} className="w-full lg:w-auto flex-shrink-0 justify-start lg:justify-end">
              {actions}
            </Flex>
          )}
        </Flex>
      )}

      <Flex direction="col" gap={6}>
        {(() => {
          const { grouped, ungrouped } = groupFieldsBySection;
          const fieldsTitle = Array.isArray(fields)
            ? "Thông tin chi tiết"
            : fields.title || "Thông tin chi tiết";
          const fieldsDesc = Array.isArray(fields)
            ? description
            : fields.description;
          const detailSectionIds = new Set(
            detailSections?.map((s) => s.id) || []
          );

          return (
            <>
              {/* Render sections từ detailSections - bao gồm cả sections có fieldsContent nhưng không có fields */}
              {detailSections?.map((section) => {
                const sectionFields = grouped[section.id] || [];
                if (sectionFields.length > 0 || section.fieldsContent) {
                  return (
                    <React.Fragment key={section.id}>
                      {renderSection(section.id, sectionFields)}
                    </React.Fragment>
                  );
                }
                return null;
              })}

              {/* Render sections từ grouped (legacy - cho backward compatibility) */}
              {Object.entries(grouped)
                .filter(([sectionId]) => !detailSectionIds.has(sectionId))
                .map(([sectionId, sectionFields]) => (
                  <React.Fragment key={sectionId}>
                    {renderSection(sectionId, sectionFields)}
                  </React.Fragment>
                ))}

              {ungrouped.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>
                      {fieldsTitle}
                    </CardTitle>
                    {fieldsDesc && (
                      <CardDescription className="mt-0.5">
                        {fieldsDesc}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0 pb-4">
                    {ungrouped.length > 4
                      ? (() => {
                          const mid = Math.ceil(ungrouped.length / 2);
                          return (
                            <Grid cols="2-lg" gap={6}>
                              <Flex>{renderFields(ungrouped.slice(0, mid))}</Flex>
                              {ungrouped.slice(mid).length > 0 && (
                                <Flex>{renderFields(ungrouped.slice(mid))}</Flex>
                              )}
                            </Grid>
                          );
                        })()
                      : renderFields(ungrouped)}
                  </CardContent>
                </Card>
              )}

              {sections && sections.length > 0 && (
                <Grid cols="2-lg" gap={6}>
                  {sections.map((section, i) => (
                    <Card key={i}>
                      <CardHeader className="pb-3">
                        <CardTitle>
                          {section.title}
                        </CardTitle>
                        {section.description && (
                          <CardDescription className="mt-0.5">
                            {section.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0 pb-4">
                        {renderFields(section.fields)}
                      </CardContent>
                    </Card>
                  ))}
                  {sections.length % 2 === 1 && <Flex />}
                </Grid>
              )}

              {afterSections && <Flex>{afterSections}</Flex>}
            </>
          );
        })()}
      </Flex>
    </Flex>
  );
}
