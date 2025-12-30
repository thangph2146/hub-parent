"use client";

import { IconSize } from "@/components/ui/typography";
import { Flex } from "@/components/ui/flex";

import * as React from "react";
import { Edit } from "lucide-react";
import {
  ResourceForm,
  type ResourceFormField,
} from "@/features/admin/resources/components";
import { Button } from "@/components/ui/button";
import { useResourceRouter } from "@/hooks/use-resource-segment";
import { formatDateVi } from "@/features/admin/resources/utils";
import {
  parseAddressToFormFields,
} from "@/features/admin/accounts/utils";
import { AccountEditClient } from "./account-edit.client";
import type { AccountProfile } from "../types";
import { useResourceDetailLogger } from "@/features/admin/resources/hooks";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions";
import { getBaseAccountFields, getAccountFormSections, type AccountFormData } from "../form-fields";

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

  const fields = getBaseAccountFields() as ResourceFormField<AccountFormData>[];
  const sections = getAccountFormSections();
  const formData: AccountFormData = {
    name: account.name,
    bio: account.bio,
    phone: account.phone,
    address: account.address,
    avatar: account.avatar,
    email: account.email,
    emailVerified: account.emailVerified
      ? `Đã xác thực - ${formatDateVi(account.emailVerified)}`
      : "Chưa xác thực",
    createdAt: account.createdAt ? formatDateVi(account.createdAt) : null,
    updatedAt: account.updatedAt ? formatDateVi(account.updatedAt) : null,
    ...parseAddressToFormFields(account.address),
  };

  return (
    <>
      <ResourceForm<AccountFormData>
        data={formData}
        fields={fields}
        sections={sections}
        title="Thông tin tài khoản"
        description="Quản lý thông tin cá nhân và cài đặt tài khoản của bạn"
        readOnly={true}
        showCard={variant === "page" ? false : true}
        onSubmit={async () => ({ success: false, error: "Read-only mode" })}
        variant={variant}
        className={variant === "page" ? "max-w-[100%]" : undefined}
        resourceName="accounts"
        resourceId={account.id}
        action="update"
        footerButtons={
          canUpdate ? (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
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
    />
    </>
  );
};
