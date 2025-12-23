"use client"

import { PlusIcon } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectTrigger,
} from "@/components/ui/select"
import { IconSize } from "@/components/ui/typography"

export function BlockInsertPlugin({ children }: { children: React.ReactNode }) {
  return (
    <Select value={""}>
      <SelectTrigger className="!h-8 w-min gap-1">
        <IconSize size="sm">
          <PlusIcon />
        </IconSize>
        <span>Insert</span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>{children}</SelectGroup>
      </SelectContent>
    </Select>
  )
}
