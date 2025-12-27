"use client";

import { TypographyH1, TypographyH3, TypographyH4, TypographyDescription, TypographyP, TypographyPLarge, TypographySpanSmall, TypographySpanMuted, IconSize } from "@/components/ui/typography";
import { Flex } from "@/components/ui/flex";
import { Grid } from "@/components/ui/grid";

import * as React from "react";
import {
  Mail,
  Calendar,
  Clock,
  Shield,
  CheckCircle2,
  Edit,
} from "lucide-react";
import { ResourceForm } from "@/features/admin/resources/components";
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
import { getAccountFields, getAccountFormSections, type AccountFormData } from "../form-fields";

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

  const fields = getAccountFields()
  const sections = getAccountFormSections()
  const formData: AccountFormData = {
    ...account,
    addressStreet: null,
    addressWard: null,
    addressDistrict: null,
    addressCity: null,
    addressPostalCode: null,
  }

  // Parse address if exists
  if (account.address) {
    const structuredAddress = parseAddressToStructured(account.address)
    if (structuredAddress) {
      formData.addressStreet = structuredAddress.address || null
      formData.addressWard = structuredAddress.ward || null
      formData.addressDistrict = structuredAddress.district || null
      formData.addressCity = structuredAddress.city || null
      formData.addressPostalCode = structuredAddress.postalCode || null
    }
  }

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

      {/* Custom Avatar Header */}
      <Card className="overflow-hidden border-2 bg-gradient-to-br from-card via-card to-muted/20 shadow-sm mb-4">
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

      <ResourceForm<AccountFormData>
        data={formData}
        fields={fields}
        sections={sections}
        title=""
        description=""
        readOnly={true}
        showCard={false}
        onSubmit={async () => ({ success: false, error: "Read-only mode" })}
      />

      {/* Custom Security & Timestamps Section */}
      <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-muted/10 shadow-sm mt-4" padding="lg">
        <Flex direction="col" gap="responsive">
          <Flex direction="col" gap={3}>
            <TypographyP className="text-sm font-medium text-muted-foreground">Email</TypographyP>
            <TypographyP className="text-foreground">
              {account.email}
            </TypographyP>
            {account.emailVerified && (
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
            {!account.emailVerified && (
              <Badge
                className="w-fit bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 px-3 py-1"
                variant="outline"
              >
                <TypographySpanSmall>Chưa xác thực</TypographySpanSmall>
              </Badge>
            )}
            {account.emailVerified && (
              <Flex direction="col" gap={1} marginTop={2}>
                <TypographyP className="text-sm font-medium text-muted-foreground">Ngày xác thực email</TypographyP>
                <TypographyPLarge>
                  {formatDateVi(account.emailVerified)}
                </TypographyPLarge>
              </Flex>
            )}
          </Flex>

          <Grid cols="responsive-2" gap="responsive" className="mt-4">
            <Flex direction="col" gap={1}>
              <TypographyP className="text-sm font-medium text-muted-foreground">Ngày tạo tài khoản</TypographyP>
              <TypographyPLarge>
                {account.createdAt ? (
                  formatDateVi(account.createdAt)
                ) : (
                  <TypographySpanMuted className="italic">—</TypographySpanMuted>
                )}
              </TypographyPLarge>
            </Flex>

            <Flex direction="col" gap={1}>
              <TypographyP className="text-sm font-medium text-muted-foreground">Cập nhật lần cuối</TypographyP>
              <TypographyPLarge>
                {account.updatedAt ? (
                  formatDateVi(account.updatedAt)
                ) : (
                  <TypographySpanMuted className="italic">—</TypographySpanMuted>
                )}
              </TypographyPLarge>
            </Flex>
          </Grid>
        </Flex>
      </Card>
    </Flex>
  );
};
