"use client";

import { TypographyH1, TypographyH3, TypographyH4, TypographyDescription, TypographyP, TypographyPLarge, TypographySpanSmall, TypographySpanMuted, IconSize } from "@/components/ui/typography";
import { Flex } from "@/components/ui/flex";
import { Grid } from "@/components/ui/grid";

import * as React from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Shield,
  FileText,
  Edit,
  CheckCircle2,
} from "lucide-react";
import {
  ResourceDetailClient,
  FieldItem,
  type ResourceDetailField,
  type ResourceDetailSection,
} from "@/features/admin/resources/components";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useResourceRouter } from "@/hooks/use-resource-segment";
import { formatDateVi } from "@/features/admin/resources/utils";
import {
  getUserInitials,
  parseAddressToStructured,
  formatAddressForDisplay,
} from "@/features/admin/accounts/utils";
import { AccountEditClient } from "./account-edit.client";
import type { AccountProfile } from "../types";
import { useResourceDetailLogger } from "@/features/admin/resources/hooks";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions";

export interface AccountProfileClientProps {
  account: AccountProfile;
  variant?: "page" | "dialog" | "sheet";
}

export const AccountProfileClient = ({
  account,
  variant = "page",
}: AccountProfileClientProps) => {
  const router = useResourceRouter();
  const [isEditing, setIsEditing] = React.useState(false);
  const { hasPermission } = usePermissions();

  // Check permission for edit (user can always edit their own profile)
  const canUpdate = hasPermission(PERMISSIONS.ACCOUNTS_UPDATE);

  useResourceDetailLogger({
    resourceName: "accounts",
    resourceId: account.id,
    data: account,
    isFetched: true,
    isFromApi: false,
    fetchedData: account,
  });

  if (isEditing) {
    return (
      <AccountEditClient
        account={account}
        variant={variant}
        open={true}
        onOpenChange={(open) => {
          if (!open) {
            setIsEditing(false);
          }
        }}
        onSuccess={() => {
          setIsEditing(false);
          router.refresh();
        }}
        onCancel={() => {
          setIsEditing(false);
        }}
      />
    );
  }

  const detailFields: ResourceDetailField<AccountProfile>[] = [];

  const detailSections: ResourceDetailSection<AccountProfile>[] = [
    {
      id: "basic",
      title: "Thông tin cơ bản",
      description: "Thông tin đăng nhập và cá nhân",
      fieldHeader: (
        <Card className="overflow-hidden border-2 bg-gradient-to-br from-card via-card to-muted/20 shadow-sm">
          <Flex direction="col" align="start" gap="responsive" padding="lg" fullWidth className="sm:flex-row sm:items-center">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Avatar className="relative h-28 w-28 border-4 border-background shadow-lg ring-2 ring-primary/10">
                <AvatarImage
                  src={account.avatar || undefined}
                  alt={account.name || account.email}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-primary via-primary/90 to-chart-1 text-primary-foreground">
                  <TypographyH4>
                    {getUserInitials(account.name, account.email)}
                  </TypographyH4>
                </AvatarFallback>
              </Avatar>
              <Flex align="center" justify="center" position="absolute" className="-bottom-1 -right-1 h-7 w-7 rounded-full bg-green-500 border-[3px] border-background shadow-md">
                <IconSize size="sm">
                  <CheckCircle2 className="text-white" />
                </IconSize>
              </Flex>
            </div>
            <Flex direction="col" gap={3} flex="1" minWidth="0">
              <Flex direction="col" gap={1.5}>
                <TypographyH3 className="tracking-tight">
                  {account.name || "Chưa có tên"}
                </TypographyH3>
                <Flex align="center" gap={2}>
                  <IconSize size="sm" className="shrink-0">
                    <Mail />
                  </IconSize>
                  <TypographySpanSmall className="truncate">{account.email}</TypographySpanSmall>
                </Flex>
              </Flex>
              {account.roles && account.roles.length > 0 && (
                <Flex wrap align="center" gap={2}>
                  {account.roles.map((role) => (
                    <Badge
                      key={role.id}
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                    >
                      <IconSize size="xs" className="mr-1.5">
                        <Shield />
                      </IconSize>
                      <TypographySpanSmall>{role.displayName || role.name}</TypographySpanSmall>
                    </Badge>
                  ))}
                </Flex>
              )}
            </Flex>
          </Flex>
        </Card>
      ),
      fieldsContent: (_fields, data) => {
        const accountData = data as AccountProfile;

        return (
          <Flex direction="col" gap="responsive">
            <Grid cols="responsive-2" gap="responsive">
              <Card padding="md" className="border-border/50 bg-card/50 hover:bg-card transition-colors">
                <FieldItem icon={User} label="Tên">
                  <TypographyPLarge className="mt-1">
                    {accountData.name || (
                      <TypographySpanMuted className="italic">
                        Chưa cập nhật
                      </TypographySpanMuted>
                    )}
                  </TypographyPLarge>
                </FieldItem>
              </Card>

              <Card padding="md" className="border-border/50 bg-card/50 hover:bg-card transition-colors">
                <FieldItem icon={Phone} label="Số điện thoại">
                  <TypographyPLarge className="mt-1">
                    {accountData.phone || (
                      <TypographySpanMuted className="italic">
                        Chưa cập nhật
                      </TypographySpanMuted>
                    )}
                  </TypographyPLarge>
                </FieldItem>
              </Card>
            </Grid>

            {accountData.bio && (
              <Card padding="lg" className="border-2 border-border/50 bg-gradient-to-br from-card to-muted/20 shadow-sm">
                <Flex align="start" gap={4}>
                  <Flex align="center" className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 ring-2 ring-primary/5">
                    <IconSize size="md">
                      <FileText className="text-primary" />
                    </IconSize>
                  </Flex>
                  <Flex direction="col" gap={3} flex="1" minWidth="0">
                    <TypographyP className="uppercase tracking-wide">
                      Giới thiệu
                    </TypographyP>
                    <TypographyP className="whitespace-pre-wrap text-foreground/90 break-words">
                      {accountData.bio}
                    </TypographyP>
                  </Flex>
                </Flex>
              </Card>
            )}

            {accountData.address &&
              (() => {
                const structuredAddress = parseAddressToStructured(accountData.address)
                const addressDisplay = structuredAddress
                  ? formatAddressForDisplay(accountData.address)
                  : accountData.address

                return (
                  <Card padding="lg" className="border-2 border-border/50 bg-gradient-to-br from-card to-muted/10 shadow-sm">
                    <FieldItem icon={MapPin} label="Địa chỉ">
                      <Flex direction="col" gap={3} marginTop={2}>
                        {structuredAddress ? (
                          <Flex direction="col" gap={2}>
                            <TypographyPLarge>
                              {addressDisplay}
                            </TypographyPLarge>
                            <Grid cols="responsive-2" gap={2}>
                              {structuredAddress.address && (
                                <Flex align="start" gap={2}>
                                  <TypographySpanSmall className="min-w-[80px]">
                                    Số nhà:
                                  </TypographySpanSmall>
                                  <TypographySpanSmall>{structuredAddress.address}</TypographySpanSmall>
                                </Flex>
                              )}
                              {structuredAddress.ward && (
                                <Flex align="start" gap={2}>
                                  <TypographySpanSmall className="min-w-[80px]">
                                    Phường/Xã:
                                  </TypographySpanSmall>
                                  <TypographySpanSmall>{structuredAddress.ward}</TypographySpanSmall>
                                </Flex>
                              )}
                              {structuredAddress.district && (
                                <Flex align="start" gap={2}>
                                  <TypographySpanSmall className="min-w-[80px]">
                                    Quận/Huyện:
                                  </TypographySpanSmall>
                                  <TypographySpanSmall>{structuredAddress.district}</TypographySpanSmall>
                                </Flex>
                              )}
                              {structuredAddress.city && (
                                <Flex align="start" gap={2}>
                                  <TypographySpanSmall className="min-w-[80px]">
                                    Thành phố:
                                  </TypographySpanSmall>
                                  <TypographySpanSmall>{structuredAddress.city}</TypographySpanSmall>
                                </Flex>
                              )}
                              {structuredAddress.postalCode && (
                                <Flex align="start" gap={2}>
                                  <TypographySpanSmall className="min-w-[80px]">
                                    Mã bưu điện:
                                  </TypographySpanSmall>
                                  <TypographySpanSmall>{structuredAddress.postalCode}</TypographySpanSmall>
                                </Flex>
                              )}
                            </Grid>
                          </Flex>
                        ) : (
                          <TypographyP>
                            {addressDisplay}
                          </TypographyP>
                        )}
                      </Flex>
                    </FieldItem>
                  </Card>
                );
              })()}
          </Flex>
        );
      },
    },
    {
      id: "security",
      title: "Bảo mật",
      description: "Thông tin bảo mật và xác thực",
      fieldsContent: (_fields, data) => {
        const accountData = data as AccountProfile;

        return (
          <Flex direction="col" gap="responsive">
            <Card padding="lg" className="border-2 border-border/50 bg-gradient-to-br from-card to-muted/10 shadow-sm">
              <FieldItem icon={Mail} label="Email">
                <Flex direction="col" gap={3} marginTop={2}>
                  <TypographyP className="text-foreground">
                    {accountData.email}
                  </TypographyP>
                  {accountData.emailVerified && (
                    <Badge
                      className="w-fit bg-green-500/15 hover:bg-green-500/25 text-green-700 dark:text-green-400 border-green-500/30 px-3 py-1"
                      variant="outline"
                    >
                      <IconSize size="xs" className="mr-1.5">
                        <CheckCircle2 />
                      </IconSize>
                      <TypographySpanSmall>Đã xác thực email</TypographySpanSmall>
                    </Badge>
                  )}
                  {!accountData.emailVerified && (
                    <Badge
                      className="w-fit bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 px-3 py-1"
                      variant="outline"
                    >
                      <TypographySpanSmall>Chưa xác thực</TypographySpanSmall>
                    </Badge>
                  )}
                </Flex>
              </FieldItem>
            </Card>

            {accountData.emailVerified && (
              <Card padding="md" className="border-border/50 bg-card/50 hover:bg-card transition-colors">
                <FieldItem icon={Clock} label="Ngày xác thực email">
                  <TypographyPLarge className="mt-1">
                    {formatDateVi(accountData.emailVerified)}
                  </TypographyPLarge>
                </FieldItem>
              </Card>
            )}
          </Flex>
        );
      },
    },
    {
      id: "timestamps",
      title: "Thông tin thời gian",
      description: "Ngày tạo và cập nhật tài khoản",
      fieldsContent: (_fields, data) => {
        const accountData = data as AccountProfile;

        return (
          <Flex direction="col" gap="responsive">
            <Grid cols="responsive-2" gap="responsive">
              <Card padding="md" className="border-border/50 bg-card/50 hover:bg-card transition-colors">
                <FieldItem icon={Calendar} label="Ngày tạo tài khoản">
                  <TypographyPLarge className="mt-1">
                    {accountData.createdAt ? (
                      formatDateVi(accountData.createdAt)
                    ) : (
                      <TypographySpanMuted className="italic">—</TypographySpanMuted>
                    )}
                  </TypographyPLarge>
                </FieldItem>
              </Card>

              <Card padding="md" className="border-border/50 bg-card/50 hover:bg-card transition-colors">
                <FieldItem icon={Clock} label="Cập nhật lần cuối">
                  <TypographyPLarge className="mt-1">
                    {accountData.updatedAt ? (
                      formatDateVi(accountData.updatedAt)
                    ) : (
                      <TypographySpanMuted className="italic">—</TypographySpanMuted>
                    )}
                  </TypographyPLarge>
                </FieldItem>
              </Card>
            </Grid>
          </Flex>
        );
      },
    },
  ];

  return (
    <Flex direction="col" gap="responsive">
      <Flex align="center" justify="between">
        <div>
          <TypographyH1>
            Thông tin tài khoản
          </TypographyH1>
          <TypographyDescription className="mt-1.5">
            Quản lý thông tin cá nhân và cài đặt tài khoản của bạn
          </TypographyDescription>
        </div>
        {canUpdate && (
          <Button
            variant="default"
            onClick={() => setIsEditing(true)}
            className="gap-2 shadow-sm"
            size="lg"
          >
            <IconSize size="sm">
              <Edit />
            </IconSize>
            Chỉnh sửa
          </Button>
        )}
      </Flex>

      <ResourceDetailClient<AccountProfile>
        data={account}
        fields={detailFields}
        detailSections={detailSections}
        title=""
        description=""
        actions={null}
      />
    </Flex>
  );
};
