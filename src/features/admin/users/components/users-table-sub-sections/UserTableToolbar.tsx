"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Flex } from "@/components/ui/flex";
import { IconSize } from "@/components/ui/typography";
import { logger } from "@/utils";
import { USER_LABELS } from "../../constants";
import { useResourceRouter } from "@/hooks";

interface UserTableToolbarProps {
  canCreate: boolean;
}

export const UserTableToolbar = ({ canCreate }: UserTableToolbarProps) => {
  const router = useResourceRouter();

  if (!canCreate) return null;

  return (
    <Button
      type="button"
      size="sm"
      onClick={() => {
        logger.info("➕ Create new from table header", {
          source: "table-header-create-new",
          resourceName: "users",
          targetUrl: "/admin/users/new",
        });
        router.push("/admin/users/new");
      }}
      className="h-8 px-3"
    >
      <Flex align="center" gap={2}>
        <IconSize size="md">
          <Plus />
        </IconSize>
        {USER_LABELS.ADD_NEW}
      </Flex>
    </Button>
  );
};
