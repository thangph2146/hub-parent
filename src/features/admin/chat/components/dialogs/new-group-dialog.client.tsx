"use client"

import { useState, useCallback } from "react"
import { useAuth } from "@/features/auth"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldContent,
  FieldSet,
  FieldLegend,
  FieldGroup,
} from "@/components/ui/field"
import { Loader2, Users } from "lucide-react"
import type { Group, GroupMember } from "@/features/admin/chat/types"
import { useToast } from "@/hooks"
import { requestJson, toJsonBody } from "@/services/api/client"
import { withApiBase } from "@/utils"
import { logger } from "@/utils"
import { TypographyP, TypographyPSmall, TypographyPMuted, IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"

interface UserOption {
  id: string
  name: string | null
  email: string
  avatar: string | null
}

interface NewGroupDialogProps {
  onSelectGroup: (group: Group) => void
}

export const NewGroupDialog = ({ onSelectGroup }: NewGroupDialogProps) => {
  const [open, setOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [searchValue, setSearchValue] = useState("")
  const [users, setUsers] = useState<UserOption[]>([])
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { user: currentUser } = useAuth()
  const { toast } = useToast()

  const searchUsers = useCallback(async (query: string = "") => {
    setIsLoading(true)
    try {
      const { apiRoutes } = await import("@/constants/api-routes")
      const res = await requestJson<UserOption[]>(withApiBase(apiRoutes.adminUsers.search(query)))
      if (!res.ok) throw new Error(res.error || "Failed to search users")
      const data = Array.isArray(res.data) ? res.data : []
      const filtered = data.filter((u: UserOption) => u.id !== currentUser?.id)
      setUsers(filtered)
    } catch (error) {
      logger.error("Error searching users", error as Error)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [currentUser?.id])

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value)
    if (value.length === 0 || value.length >= 2) {
      // Fire and forget
      void searchUsers(value)
    }
  }, [searchUsers])

  const toggleUser = (user: UserOption) => {
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id)
      return exists ? prev.filter((u) => u.id !== user.id) : [...prev, user]
    })
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return

    setIsCreating(true)
    try {
      const { apiRoutes } = await import("@/constants/api-routes")
      const res = await requestJson(withApiBase(apiRoutes.adminGroups.create), {
        method: "POST",
        ...toJsonBody({
          name: groupName.trim(),
          description: groupDescription.trim() || undefined,
          memberIds: selectedUsers.map((u) => u.id),
        }),
      })
      if (!res.ok) {
        throw new Error(res.error || "Failed to create group")
      }
      type CreatedGroupPayload = {
        id: string
        name?: string
        description?: string | null
        avatar?: string | null
        createdById?: string
        createdAt?: string
        updatedAt?: string
        members?: Array<unknown>
        memberCount?: number
      }
      const created = (res.data ?? {}) as Partial<CreatedGroupPayload>

      if (!created.id) {
        throw new Error("Server không trả về ID của nhóm mới tạo")
      }

      const groupId = created.id

      // If server doesn't return full detail, construct minimal members and let UI refresh later
      const fallbackMembers: GroupMember[] = Array.isArray(created.members) && created.members.length
        ? (created.members as unknown as GroupMember[])
        : [
            // Current user as OWNER
            ...(currentUser?.id
              ? [
                  {
                    id: `temp-${groupId}-owner`,
                    groupId: groupId,
                    userId: currentUser.id,
                    role: "OWNER",
                    joinedAt: new Date(),
                    leftAt: null,
                    user: {
                      id: currentUser.id,
                      name: currentUser.name ?? null,
                      email: currentUser.email,
                      avatar: currentUser.image ?? null,
                    },
                  } as GroupMember,
                ]
              : []),
            // Selected users as MEMBER
            ...selectedUsers.map(
              (u): GroupMember => ({
                id: `temp-${groupId}-${u.id}`,
                groupId: groupId,
                userId: u.id,
                role: "MEMBER",
                joinedAt: new Date(),
                leftAt: null,
                user: { id: u.id, name: u.name, email: u.email, avatar: u.avatar },
              })
            ),
          ]

      // Construct minimal group and let UI refresh later
      const group: Group = {
        id: groupId,
        name: created.name ?? groupName.trim(),
        description: created.description ?? (groupDescription.trim() || undefined),
        avatar: created.avatar ?? null,
        createdById: created.createdById ?? currentUser?.id ?? "",
        createdAt: created.createdAt ? new Date(created.createdAt) : new Date(),
        updatedAt: created.updatedAt ? new Date(created.updatedAt) : new Date(),
        members: fallbackMembers,
        memberCount: created.memberCount ?? fallbackMembers.length,
      }

      onSelectGroup(group)

      toast({
        variant: "success",
        title: "Thành công",
        description: res.message || "Đã tạo nhóm mới",
      })

      // Reset state
      setOpen(false)
      setGroupName("")
      setGroupDescription("")
      setSelectedUsers([])
      setUsers([])
      setSearchValue("")
    } catch (error) {
      logger.error("Error creating group", error as Error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể tạo nhóm",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setSearchValue(""); void searchUsers("") } }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-12 w-12">
          <IconSize size="sm">
            <Users />
          </IconSize>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px] md:max-w-[600px] lg:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Tạo nhóm mới</DialogTitle>
          <DialogDescription>Đặt tên, thêm mô tả và chọn thành viên</DialogDescription>
        </DialogHeader>
        <FieldSet className="group/field-set">
          <FieldLegend variant="legend">Thông tin nhóm</FieldLegend>
          <FieldGroup>
            <Field orientation="responsive">
              <FieldLabel htmlFor="group-name">Tên nhóm</FieldLabel>
              <FieldContent>
                <Input 
                  id="group-name" 
                  value={groupName} 
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full"
                  disabled={isCreating}
                />
                <FieldDescription>
                  Tên nhóm sẽ hiển thị trong danh sách và cuộc trò chuyện
                </FieldDescription>
              </FieldContent>
            </Field>
            <Field orientation="responsive">
              <FieldLabel htmlFor="group-description">Mô tả</FieldLabel>
              <FieldContent>
                <Textarea 
                  id="group-description" 
                  value={groupDescription} 
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="w-full min-h-[100px] sm:min-h-[120px]"
                  disabled={isCreating}
                />
                <FieldDescription>
                  Mô tả về nhóm (tùy chọn)
                </FieldDescription>
              </FieldContent>
            </Field>
            <Field orientation="responsive">
              <FieldLabel>Thêm thành viên</FieldLabel>
              <FieldContent>
            <Command shouldFilter={false}>
              <CommandInput placeholder="Tìm kiếm theo tên hoặc email..." value={searchValue} onValueChange={handleSearchChange} />
              <CommandList>
                {isLoading && (
                  <Flex align="center" justify="center" paddingY={6}>
                    <IconSize size="sm" className="animate-spin text-muted-foreground">
                      <Loader2 />
                    </IconSize>
                    <Flex marginLeft={2}>
                      <TypographyPMuted>Đang tải...</TypographyPMuted>
                    </Flex>
                  </Flex>
                )}
                {!isLoading && users.length === 0 && searchValue.length >= 2 && (
                  <CommandEmpty>Không tìm thấy người dùng nào</CommandEmpty>
                )}
                {!isLoading && users.length > 0 && (
                  <CommandGroup heading="Người dùng" className="gap-2">
                    {users.map((user) => {
                      const selected = selectedUsers.some((u) => u.id === user.id)
                      return (
                        <CommandItem
                          key={user.id}
                          value={user.id}
                          onSelect={() => toggleUser(user)}
                          className={`flex items-center gap-3 cursor-pointer ${selected ? "bg-accent/10" : ""} mb-1`}
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatar || undefined} alt={user.name || user.email} />
                            <AvatarFallback>
                              <TypographyPSmall>
                                {(user.name || user.email).substring(0, 2).toUpperCase()}
                              </TypographyPSmall>
                            </AvatarFallback>
                          </Avatar>
                          <Flex direction="col" className="flex-1 min-w-0">
                            <TypographyP className="truncate">{user.name || user.email}</TypographyP>
                            {user.name && <TypographyPSmall className="truncate">{user.email}</TypographyPSmall>}
                          </Flex>
                          {selected && <TypographyPSmall>Đã chọn</TypographyPSmall>}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
                <FieldDescription>
                  Tìm kiếm và chọn thành viên để thêm vào nhóm (tối thiểu 1 thành viên)
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>
        </FieldSet>
        <Flex align="center" justify="end" gap={2} paddingTop={2} className="flex-col sm:flex-row">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)} 
            disabled={isCreating}
            className="w-full sm:w-auto"
          >
            Hủy
          </Button>
          <Button 
            onClick={handleCreateGroup} 
            disabled={isCreating || !groupName.trim() || selectedUsers.length === 0}
            className="w-full sm:w-auto"
          >
            {isCreating && (
              <IconSize size="sm" className="mr-2 animate-spin">
                <Loader2 />
              </IconSize>
            )}
            Tạo nhóm
          </Button>
        </Flex>
      </DialogContent>
    </Dialog>
  )
}
