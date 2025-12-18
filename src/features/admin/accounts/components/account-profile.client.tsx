"use client";

import { typography, headerConfig, iconSizes } from "@/lib/typography";

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
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6">
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
                <AvatarFallback className={`${typography.heading.h4} font-bold bg-gradient-to-br from-primary via-primary/90 to-chart-1 text-primary-foreground`}>
                  {getUserInitials(account.name, account.email)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-green-500 border-[3px] border-background flex items-center justify-center shadow-md">
                <CheckCircle2 className={`${iconSizes.sm} text-white`} />
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <h3 className={`${typography.heading.h4} font-bold tracking-tight`}>
                  {account.name || "Chưa có tên"}
                </h3>
                <p className={`${typography.body.muted.medium} flex items-center gap-2 mt-1.5`}>
                  <Mail className={`${iconSizes.sm} shrink-0`} />
                  <span className="truncate">{account.email}</span>
                </p>
              </div>
              {account.roles && account.roles.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {account.roles.map((role) => (
                    <Badge
                      key={role.id}
                      variant="secondary"
                      className={`${typography.body.small} font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors`}
                    >
                      <Shield className={`mr-1.5 ${iconSizes.xs}`} />
                      {role.displayName || role.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      ),
      fieldsContent: (_fields, data) => {
        const accountData = data as AccountProfile;

        return (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="p-4 border-border/50 bg-card/50 hover:bg-card transition-colors">
                <FieldItem icon={User} label="Tên">
                  <div className={`${typography.body.large} font-semibold mt-1`}>
                    {accountData.name || (
                      <span className="text-muted-foreground italic">
                        Chưa cập nhật
                      </span>
                    )}
                  </div>
                </FieldItem>
              </Card>

              <Card className="p-4 border-border/50 bg-card/50 hover:bg-card transition-colors">
                <FieldItem icon={Phone} label="Số điện thoại">
                  <div className={`${typography.body.large} font-semibold mt-1`}>
                    {accountData.phone || (
                      <span className="text-muted-foreground italic">
                        Chưa cập nhật
                      </span>
                    )}
                  </div>
                </FieldItem>
              </Card>
            </div>

            {accountData.bio && (
              <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-muted/20 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/5">
                    <FileText className={`${iconSizes.md} text-primary`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`${typography.body.medium} font-semibold mb-3 uppercase tracking-wide`}>
                      Giới thiệu
                    </h3>
                    <div className={`${typography.body.medium} whitespace-pre-wrap text-foreground/90 break-words`}>
                      {accountData.bio}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {accountData.address &&
              (() => {
                const structuredAddress = parseAddressToStructured(accountData.address)
                const addressDisplay = structuredAddress
                  ? formatAddressForDisplay(accountData.address)
                  : accountData.address

                return (
                  <Card className="p-5 border-2 border-border/50 bg-gradient-to-br from-card to-muted/10 shadow-sm">
                    <FieldItem icon={MapPin} label="Địa chỉ">
                      <div className="space-y-3 mt-2">
                        {structuredAddress ? (
                          <div className="space-y-2">
                            <div className={`${typography.body.large} font-semibold`}>
                              {addressDisplay}
                            </div>
                            <div className={`grid gap-2 sm:grid-cols-2 ${typography.body.muted.medium}`}>
                              {structuredAddress.address && (
                                <div className="flex items-start gap-2">
                                  <span className="font-medium min-w-[80px]">
                                    Số nhà:
                                  </span>
                                  <span>{structuredAddress.address}</span>
                                </div>
                              )}
                              {structuredAddress.ward && (
                                <div className="flex items-start gap-2">
                                  <span className="font-medium min-w-[80px]">
                                    Phường/Xã:
                                  </span>
                                  <span>{structuredAddress.ward}</span>
                                </div>
                              )}
                              {structuredAddress.district && (
                                <div className="flex items-start gap-2">
                                  <span className="font-medium min-w-[80px]">
                                    Quận/Huyện:
                                  </span>
                                  <span>{structuredAddress.district}</span>
                                </div>
                              )}
                              {structuredAddress.city && (
                                <div className="flex items-start gap-2">
                                  <span className="font-medium min-w-[80px]">
                                    Thành phố:
                                  </span>
                                  <span>{structuredAddress.city}</span>
                                </div>
                              )}
                              {structuredAddress.postalCode && (
                                <div className="flex items-start gap-2">
                                  <span className="font-medium min-w-[80px]">
                                    Mã bưu điện:
                                  </span>
                                  <span>{structuredAddress.postalCode}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className={`${typography.body.medium} font-semibold`}>
                            {addressDisplay}
                          </div>
                        )}
                      </div>
                    </FieldItem>
                  </Card>
                );
              })()}
          </div>
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
          <div className="space-y-6">
            <Card className="p-5 border-2 border-border/50 bg-gradient-to-br from-card to-muted/10 shadow-sm">
              <FieldItem icon={Mail} label="Email">
                <div className="space-y-3 mt-2">
                  <div className={`${typography.body.medium} font-semibold text-foreground`}>
                    {accountData.email}
                  </div>
                  {accountData.emailVerified && (
                    <Badge
                      className={`bg-green-500/15 hover:bg-green-500/25 text-green-700 dark:text-green-400 border-green-500/30 ${typography.body.small} font-medium px-3 py-1`}
                      variant="outline"
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      Đã xác thực email
                    </Badge>
                  )}
                  {!accountData.emailVerified && (
                    <Badge
                      className={`bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 ${typography.body.small} font-medium px-3 py-1`}
                      variant="outline"
                    >
                      Chưa xác thực
                    </Badge>
                  )}
                </div>
              </FieldItem>
            </Card>

            {accountData.emailVerified && (
              <Card className="p-4 border-border/50 bg-card/50 hover:bg-card transition-colors">
                <FieldItem icon={Clock} label="Ngày xác thực email">
                  <div className={`${typography.body.large} font-semibold mt-1`}>
                    {formatDateVi(accountData.emailVerified)}
                  </div>
                </FieldItem>
              </Card>
            )}
          </div>
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
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="p-4 border-border/50 bg-card/50 hover:bg-card transition-colors">
                <FieldItem icon={Calendar} label="Ngày tạo tài khoản">
                  <div className={`${typography.body.large} font-semibold mt-1`}>
                    {accountData.createdAt ? (
                      formatDateVi(accountData.createdAt)
                    ) : (
                      <span className="text-muted-foreground italic">—</span>
                    )}
                  </div>
                </FieldItem>
              </Card>

              <Card className="p-4 border-border/50 bg-card/50 hover:bg-card transition-colors">
                <FieldItem icon={Clock} label="Cập nhật lần cuối">
                  <div className={`${typography.body.large} font-semibold mt-1`}>
                    {accountData.updatedAt ? (
                      formatDateVi(accountData.updatedAt)
                    ) : (
                      <span className="text-muted-foreground italic">—</span>
                    )}
                  </div>
                </FieldItem>
              </Card>
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={headerConfig.main.className}>
            Thông tin tài khoản
          </h1>
          <p className={`${typography.description.default} mt-1.5`}>
            Quản lý thông tin cá nhân và cài đặt tài khoản của bạn
          </p>
        </div>
        {canUpdate && (
          <Button
            variant="default"
            onClick={() => setIsEditing(true)}
            className="gap-2 shadow-sm"
            size="lg"
          >
            <Edit className={iconSizes.sm} />
            Chỉnh sửa
          </Button>
        )}
      </div>

      <ResourceDetailClient<AccountProfile>
        data={account}
        fields={detailFields}
        detailSections={detailSections}
        title=""
        description=""
        actions={null}
      />
    </div>
  );
};
