"use client";

import { TypographyP, TypographyPSmallMuted, TypographyPMuted, IconSize } from "@/components/ui/typography";
import { Flex } from "@/components/ui/flex";
import { Grid } from "@/components/ui/grid";

import {
  Calendar,
  Clock,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { ResourceForm } from "@/features/admin/resources/components";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { formatDateVi } from "@/features/admin/resources/utils";
import { cn } from "@/lib/utils";
import {
  useResourceDetailData,
  useResourceDetailLogger,
} from "@/features/admin/resources/hooks";
import { useMarkNotificationRead } from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";
import { NOTIFICATION_KINDS } from "../constants";
import { getBaseNotificationFields, getNotificationFormSections, type NotificationFormData } from "../form-fields";

export interface NotificationDetailData extends Record<string, unknown> {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  kind: string;
  title: string;
  description: string | null;
  isRead: boolean;
  actionUrl: string | null;
  metadata: unknown;
  expiresAt: string | null;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationDetailClientProps {
  notificationId: string;
  notification: NotificationDetailData;
  backUrl?: string;
}

export const NotificationDetailClient = ({
  notificationId,
  notification,
  backUrl = "/admin/notifications",
}: NotificationDetailClientProps) => {
  const { data: session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const detailQueryKey = useMemo(
    () => ["notifications", "admin", "detail", notificationId] as const,
    [notificationId]
  );
  
  const {
    data: detailData,
    isFetched,
    isFromApi,
    fetchedData,
  } = useResourceDetailData({
    initialData: notification,
    resourceId: notificationId,
    detailQueryKey: (id: string) =>
      ["notifications", "admin", "detail", id] as const,
    resourceName: "notifications",
    fetchOnMount: false, // Tắt fetch vì route không có GET method
  });

  useResourceDetailLogger({
    resourceName: "notifications",
    resourceId: notificationId,
    data: detailData,
    isFetched,
    isFromApi,
    fetchedData,
  });

  const markNotificationRead = useMarkNotificationRead();
  const isOwner = session?.user?.id === detailData.userId;
  const isToggling = markNotificationRead.isPending;

  const handleToggleRead = useCallback(async (checked: boolean) => {
    if (!isOwner) {
      toast({
        variant: "destructive",
        title: "Không có quyền",
        description: "Bạn chỉ có thể thay đổi trạng thái thông báo của chính mình.",
      });
      return;
    }

    try {
      const updatedNotification = await markNotificationRead.mutateAsync({
        id: notificationId,
        isRead: checked,
      });
      
      // Cập nhật cache cho detail query
      // updatedNotification từ mutation đã được parse dates, cần convert về string format
      queryClient.setQueryData<{ data: NotificationDetailData }>(
        detailQueryKey,
        (oldData) => {
          if (!oldData) {
            return { data: detailData };
          }
          
          const readAtValue = updatedNotification.readAt
            ? updatedNotification.readAt instanceof Date
              ? updatedNotification.readAt.toISOString()
              : typeof updatedNotification.readAt === "string"
              ? updatedNotification.readAt
              : null
            : null;
          
          return {
            data: {
              ...oldData.data,
              isRead: updatedNotification.isRead,
              readAt: readAtValue,
            },
          };
        }
      );
      
      toast({
        variant: "success",
        title: "Thành công",
        description: checked
          ? "Thông báo đã được đánh dấu là đã đọc."
          : "Thông báo đã được đánh dấu là chưa đọc.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description:
          error instanceof Error
            ? error.message
            : "Không thể cập nhật trạng thái thông báo.",
      });
    }
  }, [notificationId, detailData, detailQueryKey, queryClient, markNotificationRead, isOwner, toast]);

  const kindConfigData = NOTIFICATION_KINDS[detailData.kind] || {
    label: detailData.kind,
    variant: "secondary" as const,
  };
  const isNotificationOwner = session?.user?.id === detailData.userId;
  const fields = getBaseNotificationFields()
  const sections = getNotificationFormSections()
  const formData: NotificationFormData = {
    ...detailData,
    kind: kindConfigData.label,
    userEmail: detailData.user?.email || "",
    userName: detailData.user?.name || null,
  }

  return (
    <>
      <ResourceForm<NotificationFormData>
        data={formData}
        fields={fields}
        sections={sections}
        title={detailData.title}
        description={`Thông báo ${kindConfigData.label.toLowerCase()} cho ${detailData.user?.email || "người dùng"}`}
        backUrl={backUrl}
        backLabel="Quay lại danh sách"
        readOnly={true}
        showCard={false}
        onSubmit={async () => ({ success: false, error: "Read-only mode" })}
        resourceName="notifications"
        resourceId={notificationId}
        action="update"
      />

      {/* Custom Kind Badge */}
      <Card className="border border-border/50 mt-4" padding="lg">
        <Flex direction="col" gap={1}>
          <TypographyP className="text-sm font-medium text-muted-foreground mb-2">Loại thông báo</TypographyP>
          <Badge variant={kindConfigData.variant} className="w-fit">
            {kindConfigData.label}
          </Badge>
        </Flex>
      </Card>

      {/* Custom Toggle Read Status */}
      <Card className="border border-border/50 mt-4" padding="lg">
        <Flex direction="col" gap="responsive">
          <Grid cols="responsive-2" fullWidth gap="responsive">
            <Flex direction="col" gap={1}>
              <TypographyP className="text-sm font-medium text-muted-foreground mb-2">Trạng thái đọc</TypographyP>
              <Flex align="center" gap={3}>
                <Switch
                  checked={detailData.isRead}
                  disabled={isToggling || !isNotificationOwner}
                  onCheckedChange={handleToggleRead}
                  aria-label={
                    detailData.isRead
                      ? "Đánh dấu chưa đọc"
                      : "Đánh dấu đã đọc"
                  }
                />
                <TypographyP>
                  {detailData.isRead ? "Đã đọc" : "Chưa đọc"}
                </TypographyP>
              </Flex>
              {!isNotificationOwner && (
                <Flex className="mt-1.5">
                  <TypographyPSmallMuted>
                    Chỉ có thể thay đổi trạng thái thông báo của chính mình
                  </TypographyPSmallMuted>
                </Flex>
              )}
            </Flex>

            {detailData.readAt && (
              <Flex direction="col" gap={1}>
                <TypographyP className="text-sm font-medium text-muted-foreground mb-2">Ngày đọc</TypographyP>
                <Flex align="center" gap={2}>
                  <IconSize size="xs" className="text-muted-foreground shrink-0">
                    <Clock />
                  </IconSize>
                  <time
                    dateTime={detailData.readAt}
                    title={new Date(detailData.readAt).toLocaleString(
                      "vi-VN",
                      {
                        dateStyle: "full",
                        timeStyle: "long",
                      }
                    )}
                  >
                    <TypographyPSmallMuted>
                      {formatDateVi(detailData.readAt)}
                    </TypographyPSmallMuted>
                  </time>
                </Flex>
              </Flex>
            )}
          </Grid>
        </Flex>
      </Card>

      {/* Additional Info: Action URL, Timestamps, Expires At */}
      <Card className="border border-border/50 mt-4" padding="lg">
        <Grid cols="responsive-2" gap="responsive" fullWidth>
          {detailData.actionUrl && (
            <Flex direction="col" gap={1}>
              <TypographyP className="text-sm font-medium text-muted-foreground mb-2">URL hành động</TypographyP>
              <a
                href={detailData.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-primary hover:text-primary/80 hover:underline transition-colors w-full min-w-0"
                title={detailData.actionUrl}
              >
                <TypographyP className="truncate flex-1 min-w-0">
                  {detailData.actionUrl}
                </TypographyP>
                <IconSize size="xs" className="shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                  <ExternalLink />
                </IconSize>
              </a>
            </Flex>
          )}

          <Flex direction="col" gap={1}>
            <TypographyP className="text-sm font-medium text-muted-foreground mb-2">Ngày tạo</TypographyP>
            {detailData.createdAt ? (
              <Flex align="center" gap={2}>
                <IconSize size="xs" className="text-muted-foreground shrink-0">
                  <Calendar />
                </IconSize>
                <time
                  dateTime={detailData.createdAt}
                  title={new Date(
                    detailData.createdAt
                  ).toLocaleString("vi-VN", {
                    dateStyle: "full",
                    timeStyle: "long",
                  })}
                >
                  <TypographyPSmallMuted>
                    {formatDateVi(detailData.createdAt)}
                  </TypographyPSmallMuted>
                </time>
              </Flex>
            ) : (
              <TypographyPMuted>—</TypographyPMuted>
            )}
          </Flex>

          {detailData.expiresAt && (
            <Flex direction="col" gap={1}>
              <TypographyP className="text-sm font-medium text-muted-foreground mb-2">Ngày hết hạn</TypographyP>
              <Flex direction="col" gap={2}>
                <Flex align="center" gap={2}>
                  <IconSize size="xs" className="text-muted-foreground shrink-0">
                    <Calendar />
                  </IconSize>
                  <time
                    dateTime={detailData.expiresAt}
                    className={cn(
                      "",
                      new Date(detailData.expiresAt) < new Date()
                        ? "text-destructive"
                        : "text-foreground"
                    )}
                    title={new Date(
                      detailData.expiresAt
                    ).toLocaleString("vi-VN", {
                      dateStyle: "full",
                      timeStyle: "long",
                    })}
                  >
                    {formatDateVi(detailData.expiresAt)}
                  </time>
                </Flex>
                {new Date(detailData.expiresAt) < new Date() && (
                  <Badge variant="destructive" className="w-fit">
                    <Flex align="center" gap={1}>
                      <IconSize size="xs">
                        <AlertCircle />
                      </IconSize>
                      <span>Đã hết hạn</span>
                    </Flex>
                  </Badge>
                )}
              </Flex>
            </Flex>
          )}
        </Grid>
      </Card>
    </>
  );
}
