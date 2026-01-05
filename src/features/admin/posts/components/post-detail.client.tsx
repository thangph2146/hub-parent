"use client";

import * as React from "react";
import { Edit } from "lucide-react";
import {
  ResourceForm,
  type ResourceFormField,
} from "@/features/admin/resources/components";
import { Button } from "@/components/ui/button";
import type { Prisma } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  useResourceNavigation,
  useResourceDetailData,
  useResourceDetailLogger,
} from "@/features/admin/resources/hooks";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions";
import {
  IconSize,
} from "@/components/ui/typography";
import { Flex } from "@/components/ui/flex";
import {
  getBasePostFields,
  getPostFormSections,
  getPostContentField,
  getPostAuthorField,
  getPostCategoriesField,
  getPostTagsField,
  type PostFormData,
} from "../form-fields";
import { useSession } from "next-auth/react";
import { isSuperAdmin } from "@/lib/permissions";

export interface PostDetailData {
  id: string;
  title: string;
  slug: string;
  content: Prisma.JsonValue;
  excerpt: string | null;
  image: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  categories?: Array<{
    id: string;
    name: string;
  }>;
  tags?: Array<{
    id: string;
    name: string;
  }>;
  [key: string]: unknown;
}

export interface PostDetailClientProps {
  postId: string;
  post: PostDetailData;
  backUrl?: string;
}

export const PostDetailClient = ({
  postId,
  post,
  backUrl = "/admin/posts",
}: PostDetailClientProps) => {
  const queryClient = useQueryClient();
  const { router } = useResourceNavigation({
    queryClient,
    invalidateQueryKey: queryKeys.adminPosts.all(),
  });
  const { hasAnyPermission } = usePermissions();

  const canUpdate = hasAnyPermission([
    PERMISSIONS.POSTS_UPDATE,
    PERMISSIONS.POSTS_MANAGE,
  ]);

  const {
    data: detailData,
    isFetched,
    isFromApi,
    fetchedData,
  } = useResourceDetailData({
    initialData: post,
    resourceId: postId,
    detailQueryKey: queryKeys.adminPosts.detail,
    resourceName: "posts",
    fetchOnMount: true,
  });

  useResourceDetailLogger({
    resourceName: "posts",
    resourceId: postId,
    data: detailData,
    isFetched,
    isFromApi,
    fetchedData,
  });

  const { data: session } = useSession();
  const userRoles = session?.roles || [];
  const isSuperAdminUser = isSuperAdmin(userRoles);

  // Transform data để hiển thị đúng format
  const formData = React.useMemo(() => {
    return {
      ...detailData,
      authorId: detailData.author?.id || "",
      categoryIds: detailData.categories?.map((cat) => cat.id) || [],
      tagIds: detailData.tags?.map((tag) => tag.id) || [],
      content: detailData.content,
    } as PostFormData & {
      authorId: string;
      categoryIds: string[];
      tagIds: string[];
      content: Prisma.JsonValue;
    };
  }, [detailData]);

  // Tạo options từ data hiện có
  const authorOptions = React.useMemo(
    () =>
      detailData.author
        ? [
            {
              label: detailData.author.name || detailData.author.email,
              value: detailData.author.id,
            },
          ]
        : [],
    [detailData.author]
  );

  const categoryOptions = React.useMemo(
    () =>
      detailData.categories?.map((cat) => ({
        label: cat.name,
        value: cat.id,
      })) || [],
    [detailData.categories]
  );

  const tagOptions = React.useMemo(
    () =>
      detailData.tags?.map((tag) => ({
        label: tag.name,
        value: tag.id,
      })) || [],
    [detailData.tags]
  );

  // Tạo fields đầy đủ
  const fields = React.useMemo(
    () => [
      ...(getBasePostFields() as unknown as ResourceFormField<PostFormData>[]),
      ...(isSuperAdminUser && authorOptions.length > 0
        ? [getPostAuthorField<PostFormData>(authorOptions)]
        : []),
      getPostCategoriesField<PostFormData>(categoryOptions),
      getPostTagsField<PostFormData>(tagOptions),
      getPostContentField<PostFormData>(),
    ],
    [isSuperAdminUser, authorOptions, categoryOptions, tagOptions]
  );

  const sections = getPostFormSections();
  const isDeleted =
    detailData.deletedAt !== null && detailData.deletedAt !== undefined;

  return (
    <ResourceForm<PostFormData>
      data={formData as PostFormData}
      fields={fields}
      sections={sections}
      title={detailData.title || "Chi tiết bài viết"}
      description={`Chi tiết bài viết ${detailData.title || ""}`}
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      readOnly={true}
      showCard={false}
      onSubmit={async () => ({ success: false, error: "Read-only mode" })}
      footerButtons={
        !isDeleted && canUpdate ? (
          <Button
            variant="default"
            onClick={() => router.push(`/admin/posts/${detailData.id}/edit`)}
          >
            <Flex align="center" gap={2}>
              <IconSize size="sm">
                <Edit />
              </IconSize>
              Chỉnh sửa
            </Flex>
          </Button>
        ) : null
      }
      resourceName="posts"
      resourceId={postId}
      action="update"
    />
  );
};

PostDetailClient.displayName = "PostDetailClient";
