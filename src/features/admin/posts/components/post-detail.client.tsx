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
import {
  ResourceDetailClient,
  FieldItem,
  type ResourceDetailField,
  type ResourceDetailSection,
} from "@/features/admin/resources/components";
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
import { TypographyH2, TypographyP, TypographyPLargeMuted, TypographyPMuted, TypographyPSmallMuted, IconSize } from "@/components/ui/typography";
import { Flex } from "@/components/ui/flex";
import { Grid } from "@/components/ui/grid";

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

  const detailFields: ResourceDetailField<PostDetailData>[] = [];

  const detailSections: ResourceDetailSection<PostDetailData>[] = [
    {
      id: "basic",
      title: "Thông tin cơ bản",
      description: "Thông tin chính về bài viết",
      fieldsContent: (_fields, data) => {
        const postData = data as PostDetailData;

        return (
          <Flex direction="col" gap={8}>
            <Flex direction="col" gap={4}>
              {/* Featured Image */}
              {postData.image && (
                <Flex align="center" justify="center" className="relative aspect-[16/9] max-w-2xl mx-auto w-full overflow-hidden rounded-lg">
                  <Image
                    src={postData.image}
                    alt={postData.title || "Ảnh bài viết"}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1280px) 1000px, 90vw"
                    priority
                  />
                </Flex>
              )}

              <Flex direction="col" gap={2}>
                <TypographyH2>
                  {postData.title || "Chưa có tiêu đề"}
                </TypographyH2>
                {postData.excerpt && (
                  <TypographyPLargeMuted className="whitespace-pre-wrap">
                    {postData.excerpt}
                  </TypographyPLargeMuted>
                )}
              </Flex>
            </Flex>

            <Grid cols={3} gap={6}>
              <FieldItem icon={Hash} label="Slug">
                <TypographyP className="font-mono break-all">
                  {postData.slug || "---"}
                </TypographyP>
              </FieldItem>

              <FieldItem icon={User} label="Tác giả">
                <Flex direction="col" gap={0.5}>
                  <TypographyP>
                    {postData.author.name || "Không rõ tên"}
                  </TypographyP>
                  <TypographyPSmallMuted className="line-clamp-1">
                    {postData.author.email}
                  </TypographyPSmallMuted>
                </Flex>
              </FieldItem>

              {postData.categories && postData.categories.length > 0 && (
                <FieldItem icon={Tag} label="Danh mục">
                  <Flex wrap={true} gap={1.5}>
                    {postData.categories.map((category) => (
                      <Badge key={category.id} variant="default">
                        {category.name}
                      </Badge>
                    ))}
                  </Flex>
                </FieldItem>
              )}

              {postData.tags && postData.tags.length > 0 && (
                <FieldItem icon={Tags} label="Thẻ tag">
                  <Flex wrap={true} gap={1.5}>
                    {postData.tags.map((tag) => (
                      <Badge key={tag.id} variant="secondary">
                        {tag.name}
                      </Badge>
                    ))}
                  </Flex>
                </FieldItem>
              )}

              <FieldItem
                icon={postData.published ? Eye : EyeOff}
                label="Trạng thái"
              >
                <Flex align="center" gap={2}>
                  {postData.published ? (
                    <>
                      <IconSize size="sm">
                        <CheckCircle2 className="text-green-600 dark:text-green-500" />
                      </IconSize>
                      <TypographyP>
                        Đã xuất bản
                      </TypographyP>
                    </>
                  ) : (
                    <>
                      <IconSize size="sm">
                        <EyeOff className="text-gray-600 dark:text-gray-400" />
                      </IconSize>
                      <TypographyP>
                        Bản nháp
                      </TypographyP>
                    </>
                  )}
                </Flex>
              </FieldItem>

              {postData.publishedAt && (
                <FieldItem icon={Calendar} label="Ngày xuất bản">
                  <TypographyP>
                    {formatDateVi(postData.publishedAt)}
                  </TypographyP>
                </FieldItem>
              )}
            </Grid>

            <Grid cols={3} gap={6}>
              <FieldItem icon={Clock} label="Ngày tạo">
                <TypographyP>
                  {formatDateVi(postData.createdAt)}
                </TypographyP>
              </FieldItem>

              <FieldItem icon={Clock} label="Cập nhật lần cuối">
                <TypographyP>
                  {formatDateVi(postData.updatedAt)}
                </TypographyP>
              </FieldItem>

              {postData.deletedAt && (
                <FieldItem icon={Clock} label="Ngày xóa">
                  <TypographyP className="text-destructive">
                    {formatDateVi(postData.deletedAt)}
                  </TypographyP>
                </FieldItem>
              )}
            </Grid>
          </Flex>
        );
      },
    },
    {
      id: "content",
      title: "Nội dung",
      description: "Nội dung bài viết",
      fieldsContent: (_fields, data) => {
        const postData = data as PostDetailData;

        let editorState: SerializedEditorState | null = null;
        try {
          if (postData.content && typeof postData.content === "object") {
            editorState = postData.content as unknown as SerializedEditorState;
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
          <Flex direction="col" gap={4} className="w-full max-w-5xl mx-auto">
            {editorState ? (
              <Editor editorSerializedState={editorState} readOnly={true} />
            ) : (
              <Card className="border border-border/50 bg-card p-5">
                <TypographyPMuted>
                  Không có nội dung hoặc định dạng không hợp lệ
                </TypographyPMuted>
              </Card>
            )}
          </Flex>
        );
      },
    },
  ];

  const isDeleted =
    detailData.deletedAt !== null && detailData.deletedAt !== undefined;

  return (
    <ResourceDetailClient<PostDetailData>
      data={detailData}
      title={"Chi tiết bài viết"}
      description={`Chi tiết bài viết ${detailData.title}`}
      fields={detailFields}
      detailSections={detailSections}
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      onBack={() => navigateBack(backUrl)}
      actions={
        !isDeleted && canUpdate ? (
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/posts/${detailData.id}/edit`)}
            className="gap-2"
          >
            <IconSize size="sm">
              <Edit />
            </IconSize>
            Chỉnh sửa
          </Button>
        ) : null
      }
    />
  );
}

PostDetailClient.displayName = "PostDetailClient";
