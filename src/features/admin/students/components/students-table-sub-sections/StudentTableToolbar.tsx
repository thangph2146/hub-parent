"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconSize } from "@/components/ui/typography";
import { STUDENT_LABELS } from "../../constants/messages";
import { useResourceRouter } from "@/hooks";

interface StudentTableToolbarProps {
  canCreate: boolean;
}

export const StudentTableToolbar = ({ canCreate }: StudentTableToolbarProps) => {
  const router = useResourceRouter();

  if (!canCreate) return null;

  return (
    <Button
      type="button"
      size="sm"
      onClick={() => router.push("/admin/students/new")}
      className="h-8 px-3"
    >
      <IconSize size="md" className="mr-2">
        <Plus />
      </IconSize>
      {STUDENT_LABELS.ADD_NEW}
    </Button>
  );
};
