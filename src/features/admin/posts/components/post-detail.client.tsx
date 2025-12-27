"use client";

import * as React from "react";
import {
  Hash,
  User,
  Calendar,
  Clock,
  Edit,
  Eye,
  EyeOff,
  CheckCircle2,
  Tag,
  Tags,
} from "lucide-react";
import { ResourceForm } from "@/features/admin/resources/components";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { formatDateVi } from "../utils";
import { Editor } from "@/components/editor/editor-x/editor";
import type { SerializedEditorState } from "lexical";
import type { Prisma } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  useResourceNavigation,
  useResourceDetailData,
  useResourceDetailLogger,
} from "@/features/admin/resources/hooks";
import { resourceLogger } from "@/lib/config/resource-logger";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions";
import {
  TypographyH2,
  TypographyP,
  TypographyPLargeMuted,
  TypographyPMuted,
  IconSize,
} from "@/components/ui/typography";
import { Flex } from "@/components/ui/flex";
import { Grid } from "@/components/ui/grid";
import { getBasePostFields, getPostFormSections, type PostFormData } from "../form-fields";

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
  const { navigateBack, router } = useResourceNavigation({
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

  const fields = getBasePostFields()
  const sections = getPostFormSections()
  const isDeleted =
    detailData.deletedAt !== null && detailData.deletedAt !== undefined;

  // Parse editor content
  let editorState: SerializedEditorState | null = null;
  try {
    if (detailData.content && typeof detailData.content === "object") {
      editorState = detailData.content as unknown as SerializedEditorState;
    }
  } catch (error) {
    resourceLogger.actionFlow({
      resource: "posts",
      action: "load-detail",
      step: "error",
      metadata: {
        postId,
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }

  return (
    <>
      {/* Featured Image & Title Header */}
      <Flex direction="col" gap="responsive" fullWidth className="lg:flex-row mb-4">
        {detailData.image && (
          <Flex
            align="center"
            justify="center"
            position="relative"
            className="aspect-[16/9] max-w-2xl mx-auto w-full overflow-hidden rounded-lg"
          >
            <Image
              src={detailData.image}
              alt={detailData.title || "Ảnh bài viết"}
              fill
              className="object-cover"
              sizes="(min-width: 1280px) 1000px, 90vw"
              priority
            />
          </Flex>
        )}

        <Flex direction="col" gap={2} fullWidth>
          <TypographyH2>
            {detailData.title || "Chưa có tiêu đề"}
          </TypographyH2>
          {detailData.excerpt && (
            <TypographyPLargeMuted className="whitespace-pre-wrap">
              {detailData.excerpt}
            </TypographyPLargeMuted>
          )}
        </Flex>
      </Flex>

      <ResourceForm<PostFormData>
        data={detailData as PostFormData}
        fields={fields}
        sections={sections}
        title="Chi tiết bài viết"
        description={`Chi tiết bài viết ${detailData.title}`}
        backUrl={backUrl}
        backLabel="Quay lại danh sách"
        readOnly={true}
        showCard={false}
        onSubmit={async () => ({ success: false, error: "Read-only mode" })}
        resourceName="posts"
        resourceId={postId}
        action="update"
      />

      {/* Custom Fields: Author, Categories, Tags, Status, Timestamps */}
      <Card className="border border-border/50" padding="lg" marginTop={4}>
        <Grid cols="responsive-2" gap="responsive" fullWidth>
          <Flex direction="col" gap={1}>
            <TypographyP className="text-sm font-medium text-muted-foreground mb-2">Tác giả</TypographyP>
            <Flex direction="col" gap={0.5}>
              <TypographyP>
                {detailData.author.name || "Không rõ tên"}
              </TypographyP>
              <TypographyPMuted className="line-clamp-1">
                {detailData.author.email}
              </TypographyPMuted>
            </Flex>
          </Flex>

          {detailData.categories && detailData.categories.length > 0 && (
            <Flex direction="col" gap={1}>
              <TypographyP className="text-sm font-medium text-muted-foreground mb-2">Danh mục</TypographyP>
              <Flex wrap gap={1.5}>
                {detailData.categories.map((category) => (
                  <Badge key={category.id} variant="default">
                    {category.name}
                  </Badge>
                ))}
              </Flex>
            </Flex>
          )}

          {detailData.tags && detailData.tags.length > 0 && (
            <Flex direction="col" gap={1}>
              <TypographyP className="text-sm font-medium text-muted-foreground mb-2">Thẻ tag</TypographyP>
              <Flex wrap gap={1.5}>
                {detailData.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.name}
                  </Badge>
                ))}
              </Flex>
            </Flex>
          )}

          <Flex direction="col" gap={1}>
            <TypographyP className="text-sm font-medium text-muted-foreground mb-2">Trạng thái</TypographyP>
            <Flex align="center" gap={2}>
              {detailData.published ? (
                <>
                  <IconSize size="sm">
                    <CheckCircle2 className="text-green-600 dark:text-green-500" />
                  </IconSize>
                  <TypographyP>Đã xuất bản</TypographyP>
                </>
              ) : (
                <>
                  <IconSize size="sm">
                    <EyeOff className="text-gray-600 dark:text-gray-400" />
                  </IconSize>
                  <TypographyP>Bản nháp</TypographyP>
                </>
              )}
            </Flex>
          </Flex>

          {detailData.publishedAt && (
            <Flex direction="col" gap={1}>
              <TypographyP className="text-sm font-medium text-muted-foreground mb-2">Ngày xuất bản</TypographyP>
              <TypographyP>
                {formatDateVi(detailData.publishedAt)}
              </TypographyP>
            </Flex>
          )}

          <Flex direction="col" gap={1}>
            <TypographyP className="text-sm font-medium text-muted-foreground mb-2">Ngày tạo</TypographyP>
            <TypographyP>{formatDateVi(detailData.createdAt)}</TypographyP>
          </Flex>

          <Flex direction="col" gap={1}>
            <TypographyP className="text-sm font-medium text-muted-foreground mb-2">Cập nhật lần cuối</TypographyP>
            <TypographyP>{formatDateVi(detailData.updatedAt)}</TypographyP>
          </Flex>

          {detailData.deletedAt && (
            <Flex direction="col" gap={1}>
              <TypographyP className="text-sm font-medium text-muted-foreground mb-2">Ngày xóa</TypographyP>
              <TypographyP className="text-destructive">
                {formatDateVi(detailData.deletedAt)}
              </TypographyP>
            </Flex>
          )}
        </Grid>
      </Card>

      {/* Editor Content */}
      <Card className="border border-border/50" padding="lg" marginTop={4}>
        <TypographyP className="text-sm font-medium text-muted-foreground mb-4">Nội dung</TypographyP>
        {editorState ? (
          <Editor editorSerializedState={editorState} readOnly={true} />
        ) : (
          <Card className="border border-border/50" padding="lg">
            <TypographyPMuted>
              Không có nội dung hoặc định dạng không hợp lệ
            </TypographyPMuted>
          </Card>
        )}
      </Card>

      {!isDeleted && canUpdate && (
        <Flex
          align="center"
          justify="end"
          gap={2}
          fullWidth
          paddingY={2}
          border="top"
          className="sticky bottom-0 bg-background/95 backdrop-blur-sm z-10 mt-4"
        >
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/posts/${detailData.id}/edit`)}
          >
            <Flex align="center" gap={2}>
              <IconSize size="sm">
                <Edit />
              </IconSize>
              Chỉnh sửa
            </Flex>
          </Button>
        </Flex>
      )}
    </>
  );
};

PostDetailClient.displayName = "PostDetailClient";
