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
import { TypographyH2, TypographyP, TypographyPLarge, TypographyPMuted, TypographyPSmallMuted, TypographySpanSmall, IconSize } from "@/components/ui/typography";

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
          <div className="space-y-8">
            <div className="space-y-4">
              {postData.image && (
                <div className="relative aspect-[16/9]  max-w-5xl mx-auto">
                  <Image
                    src={postData.image}
                    alt={postData.title || "Ảnh bài viết"}
                    width={1920}
                    height={1080}
                    className="object-cover"
                    sizes="(min-width: 1280px) 1000px, 90vw"
                    priority
                  />
                </div>
              )}

              <div className="space-y-2">
                <TypographyH2 className="leading-tight">
                  {postData.title || "Chưa có tiêu đề"}
                </TypographyH2>
                {postData.excerpt && (
                  <TypographyPLarge className="leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {postData.excerpt}
                  </TypographyPLarge>
                )}
              </div>
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <FieldItem icon={Hash} label="Slug">
                <TypographyP className="font-medium text-foreground font-mono break-all">
                  {postData.slug || "---"}
                </TypographyP>
              </FieldItem>

              <FieldItem icon={User} label="Tác giả">
                <div className="space-y-0.5">
                  <TypographyP className="font-medium text-foreground">
                    {postData.author.name || "Không rõ tên"}
                  </TypographyP>
                  <TypographyPSmallMuted className="line-clamp-1">
                    {postData.author.email}
                  </TypographyPSmallMuted>
                </div>
              </FieldItem>

              {postData.categories && postData.categories.length > 0 && (
                <FieldItem icon={Tag} label="Danh mục">
                  <div className="flex flex-wrap gap-1.5">
                    {postData.categories.map((category) => (
                      <TypographySpanSmall
                        key={category.id}
                        className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 font-medium text-primary"
                      >
                        {category.name}
                      </TypographySpanSmall>
                    ))}
                  </div>
                </FieldItem>
              )}

              {postData.tags && postData.tags.length > 0 && (
                <FieldItem icon={Tags} label="Thẻ tag">
                  <div className="flex flex-wrap gap-1.5">
                    {postData.tags.map((tag) => (
                      <TypographySpanSmall
                        key={tag.id}
                        className="inline-flex items-center rounded-md bg-secondary/60 px-2 py-1 font-medium text-secondary-foreground"
                      >
                        {tag.name}
                      </TypographySpanSmall>
                    ))}
                  </div>
                </FieldItem>
              )}

              <FieldItem
                icon={postData.published ? Eye : EyeOff}
                label="Trạng thái"
              >
                <div className="flex items-center gap-2">
                  {postData.published ? (
                    <>
                      <IconSize size="sm">
                        <CheckCircle2 className="text-green-600 dark:text-green-500" />
                      </IconSize>
                      <TypographyP className="font-medium text-foreground">
                        Đã xuất bản
                      </TypographyP>
                    </>
                  ) : (
                    <>
                      <IconSize size="sm">
                        <EyeOff className="text-gray-600 dark:text-gray-400" />
                      </IconSize>
                      <TypographyP className="font-medium text-foreground">
                        Bản nháp
                      </TypographyP>
                    </>
                  )}
                </div>
              </FieldItem>

              {postData.publishedAt && (
                <FieldItem icon={Calendar} label="Ngày xuất bản">
                  <TypographyP className="font-medium text-foreground">
                    {formatDateVi(postData.publishedAt)}
                  </TypographyP>
                </FieldItem>
              )}
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
              <FieldItem icon={Clock} label="Ngày tạo">
                <TypographyP className="font-medium text-foreground">
                  {formatDateVi(postData.createdAt)}
                </TypographyP>
              </FieldItem>

              <FieldItem icon={Clock} label="Cập nhật lần cuối">
                <TypographyP className="font-medium text-foreground">
                  {formatDateVi(postData.updatedAt)}
                </TypographyP>
              </FieldItem>

              {postData.deletedAt && (
                <FieldItem icon={Clock} label="Ngày xóa">
                  <TypographyP className="font-medium text-rose-600 dark:text-rose-400">
                    {formatDateVi(postData.deletedAt)}
                  </TypographyP>
                </FieldItem>
              )}
            </div>
          </div>
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
          <div className="w-full max-w-5xl mx-auto space-y-4 ">
            {editorState ? (
              <Editor editorSerializedState={editorState} readOnly={true} />
            ) : (
              <Card className="border border-border/50 bg-card p-5">
                <TypographyPMuted>
                  Không có nội dung hoặc định dạng không hợp lệ
                </TypographyPMuted>
              </Card>
            )}
          </div>
        );
      },
    },
  ];

  const isDeleted =
    detailData.deletedAt !== null && detailData.deletedAt !== undefined;

  return (
    <ResourceDetailClient<PostDetailData>
      data={detailData}
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
