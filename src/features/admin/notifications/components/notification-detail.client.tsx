"use client";

import { ResourceForm } from "@/features/admin/resources/components";
import {
  useResourceDetailData,
  useResourceDetailLogger,
} from "@/features/admin/resources/hooks";
import { 
  getBaseNotificationFields, 
  getNotificationFormSections, 
  type NotificationFormData 
} from "../form-fields";

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

  const fields = getBaseNotificationFields();
  const sections = getNotificationFormSections();
  const formData: NotificationFormData = {
    ...detailData,
    userEmail: detailData.user?.email || "",
    userName: detailData.user?.name || null,
  }

  return (
    <ResourceForm<NotificationFormData>
      data={formData}
      fields={fields}
      sections={sections}
      title={detailData.title}
      description={`Thông báo cho ${detailData.user?.email || "người dùng"}`}
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      readOnly={true}
      showCard={false}
      onSubmit={async () => ({ success: false, error: "Read-only mode" })}
      variant="page"
      className="max-w-[100%]"
      resourceName="notifications"
      resourceId={notificationId}
      action="update"
    />
  );
}
