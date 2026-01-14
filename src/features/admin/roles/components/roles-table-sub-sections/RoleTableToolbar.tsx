"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconSize } from "@/components/ui/typography";
import { ROLE_LABELS } from "../../constants/messages";
import { useResourceRouter } from "@/hooks";

interface RoleTableToolbarProps {
  canCreate: boolean;
}

export const RoleTableToolbar = ({ canCreate }: RoleTableToolbarProps) => {
  const router = useResourceRouter();

  if (!canCreate) return null;

  return (
    <Button
      type="button"
      size="sm"
      onClick={() => router.push("/admin/roles/new")}
      className="h-8 px-3"
    >
      <IconSize size="md" className="mr-2">
        <Plus />
      </IconSize>
      {ROLE_LABELS.ADD_NEW}
    </Button>
  );
};
