/**
 * Create Folder Form Component
 * Component form để tạo folder mới
 */

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandInput,
  CommandList,
} from "@/components/ui/command"
import { Check, Folder, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useUploadsStore } from "../store/uploads-store"
import { useCreateFolder } from "../hooks/use-uploads-queries"
import { FolderTreeSelectItem } from "./folder-tree-select-item"
import { useFolderTree } from "../hooks/use-folder-tree"
import { expandFolderTreeLevels } from "../utils/folder-utils"
import { getTodayDatePath } from "../utils/date-utils"
import { TypographyPSmallMuted, IconSize } from "@/components/ui/typography"
import type { FolderItem } from "../types"

interface CreateFolderFormProps {
  availableFolders: FolderItem[]
  isLoadingFolders: boolean
}

export const CreateFolderForm = ({ availableFolders, isLoadingFolders }: CreateFolderFormProps) => {
  const { toast } = useToast()
  const createFolderMutation = useCreateFolder()

  const {
    showCreateFolderForm,
    folderInputMode,
    newFolderName,
    parentFolderForCreate,
    folderPathString,
    rootFolderForString,
    folderTreeSelectOpen,
    folderTreeSelectOpenString,
    openFolderPaths,
    openFolderPathsString,
    setShowCreateFolderForm,
    setFolderInputMode,
    setNewFolderName,
    setParentFolderForCreate,
    setFolderPathString,
    setRootFolderForString,
    setFolderTreeSelectOpen,
    setFolderTreeSelectOpenString,
    setOpenFolderPaths,
    setOpenFolderPathsString,
    resetCreateFolderForm,
  } = useUploadsStore()

  const folderTreeForSelect = useFolderTree(availableFolders)

  const handleCreateFolder = React.useCallback(async () => {
    let folderName = ""
    let parentPath: string | null = null

    if (folderInputMode === "tree") {
      if (!newFolderName.trim()) {
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập tên thư mục",
          variant: "destructive",
        })
        return
      }
      folderName = newFolderName.trim()
      parentPath = parentFolderForCreate
    } else {
      if (!folderPathString.trim() && !rootFolderForString) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn thư mục gốc hoặc nhập đường dẫn",
          variant: "destructive",
        })
        return
      }

      let fullPath = ""
      if (rootFolderForString && folderPathString.trim()) {
        fullPath = `${rootFolderForString}/${folderPathString.trim()}`
      } else if (rootFolderForString) {
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập tên thư mục hoặc đường dẫn con",
          variant: "destructive",
        })
        return
      } else {
        fullPath = folderPathString.trim()
      }

      if (fullPath) {
        const pathParts = fullPath.split("/").filter(Boolean)
        if (pathParts.length === 0) {
          toast({
            title: "Lỗi",
            description: "Đường dẫn thư mục không hợp lệ",
            variant: "destructive",
          })
          return
        }
        folderName = pathParts[pathParts.length - 1]
        if (pathParts.length > 1) {
          parentPath = pathParts.slice(0, -1).join("/")
        }
      }
    }

    createFolderMutation.mutate(
      { folderName, parentPath },
      {
        onSuccess: () => {
          resetCreateFolderForm()
        },
      }
    )
  }, [
    folderInputMode,
    newFolderName,
    parentFolderForCreate,
    folderPathString,
    rootFolderForString,
    toast,
    createFolderMutation,
    resetCreateFolderForm,
  ])

  const handleToggleForm = React.useCallback(() => {
    setShowCreateFolderForm(!showCreateFolderForm)
    if (!showCreateFolderForm) {
      resetCreateFolderForm()
    }
  }, [showCreateFolderForm, setShowCreateFolderForm, resetCreateFolderForm])

  const handlePopoverOpenChange = React.useCallback(
    (open: boolean) => {
      setFolderTreeSelectOpen(open)
      if (open && openFolderPaths.size === 0) {
        const initialOpenPaths = expandFolderTreeLevels(folderTreeForSelect, 2)
        setOpenFolderPaths(initialOpenPaths)
      }
    },
    [folderTreeForSelect, openFolderPaths.size, setFolderTreeSelectOpen, setOpenFolderPaths]
  )

  const handleStringPopoverOpenChange = React.useCallback(
    (open: boolean) => {
      setFolderTreeSelectOpenString(open)
      if (open && openFolderPathsString.size === 0) {
        const initialOpenPaths = expandFolderTreeLevels(folderTreeForSelect, 2)
        setOpenFolderPathsString(initialOpenPaths)
      }
    },
    [
      folderTreeForSelect,
      openFolderPathsString.size,
      setFolderTreeSelectOpenString,
      setOpenFolderPathsString,
    ]
  )

  if (!showCreateFolderForm) {
    return (
      <div className="space-y-2 border-b pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Label>Tạo thư mục mới</Label>
          <Button type="button" variant="default" size="sm" onClick={handleToggleForm} className="w-full sm:w-auto">
            Tạo thư mục
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 border-b pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <Label>Tạo thư mục mới</Label>
        <Button type="button" variant="outline" size="sm" onClick={handleToggleForm} className="w-full sm:w-auto">
          Hủy
        </Button>
      </div>
      <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
        {/* Mode Selection */}
        <div className="space-y-2">
          <Label>Chế độ nhập</Label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Button
              type="button"
              variant={folderInputMode === "tree" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFolderInputMode("tree")
                setFolderPathString("")
              }}
            >
              Tree (chọn từ danh sách)
            </Button>
            <Button
              type="button"
              variant={folderInputMode === "string" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFolderInputMode("string")
                setParentFolderForCreate(null)
                setNewFolderName("")
              }}
            >
              String (nhập đường dẫn)
            </Button>
          </div>
        </div>

        {folderInputMode === "tree" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="parent-folder-select">Thư mục cha (tùy chọn)</Label>
              <Popover open={folderTreeSelectOpen} onOpenChange={handlePopoverOpenChange}>
                <PopoverTrigger asChild>
                  <Button
                    id="parent-folder-select"
                    variant="outline"
                    role="combobox"
                    aria-expanded={folderTreeSelectOpen}
                    className="w-full justify-between"
                    disabled={isLoadingFolders || createFolderMutation.isPending}
                  >
                    {parentFolderForCreate
                      ? availableFolders.find((f) => f.path === parentFolderForCreate)?.path ||
                        parentFolderForCreate
                      : "Root (tạo ở thư mục gốc)"}
                    <IconSize size="sm" className="ml-2 shrink-0 opacity-50">
                      <ChevronsUpDown />
                    </IconSize>
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="p-0 w-[var(--radix-popover-trigger-width)]" 
                  align="start"
                >
                  <Command>
                    <CommandList>
                      <CommandEmpty>Không tìm thấy thư mục.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="__root__"
                          onSelect={() => {
                            setParentFolderForCreate(null)
                            setFolderTreeSelectOpen(false)
                          }}
                        >
                          <IconSize size="sm" className={cn("mr-2", !parentFolderForCreate ? "opacity-100" : "opacity-0")}>
                            <Check />
                          </IconSize>
                          <IconSize size="sm" className="mr-2 hover:text-foreground">
                            <Folder />
                          </IconSize>
                          Root (tạo ở thư mục gốc)
                        </CommandItem>
                        {folderTreeForSelect.map((node) => (
                          <FolderTreeSelectItem
                            key={node.path}
                            node={node}
                            selectedValue={parentFolderForCreate}
                            onSelect={(path) => setParentFolderForCreate(path)}
                            openPaths={openFolderPaths}
                            setOpenPaths={setOpenFolderPaths}
                            onClose={() => setFolderTreeSelectOpen(false)}
                          />
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <TypographyPSmallMuted>
                {parentFolderForCreate
                  ? `Thư mục mới sẽ được tạo trong: ${parentFolderForCreate}/`
                  : "Thư mục mới sẽ được tạo ở thư mục gốc"}
              </TypographyPSmallMuted>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-folder-name">Tên thư mục</Label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Input
                  id="new-folder-name"
                  placeholder="Nhập tên thư mục (ví dụ: products, events)"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  disabled={createFolderMutation.isPending}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !createFolderMutation.isPending &&
                      newFolderName.trim()
                    ) {
                      handleCreateFolder()
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim() || createFolderMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {createFolderMutation.isPending ? (
                    <>
                      <IconSize size="sm" className="mr-2">
                        <Loader2 className="animate-spin" />
                      </IconSize>
                      <span className="hidden sm:inline">Đang tạo...</span>
                      <span className="sm:hidden">Đang tạo</span>
                    </>
                  ) : (
                    "Tạo"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {folderInputMode === "string" && (
          <div className="space-y-2">
            <div className="space-y-2">
              <Label htmlFor="root-folder-string">Chọn thư mục (tùy chọn)</Label>
              <Popover
                open={folderTreeSelectOpenString}
                onOpenChange={handleStringPopoverOpenChange}
              >
                <PopoverTrigger asChild>
                  <Button
                    id="root-folder-string"
                    variant="outline"
                    role="combobox"
                    aria-expanded={folderTreeSelectOpenString}
                    className="w-full justify-between"
                    disabled={isLoadingFolders || createFolderMutation.isPending}
                  >
                    {rootFolderForString
                      ? availableFolders.find((f) => f.path === rootFolderForString)?.path ||
                        rootFolderForString
                      : "Chọn thư mục (để trống để tạo ở root)"}
                    <IconSize size="sm" className="ml-2 shrink-0 opacity-50">
                      <ChevronsUpDown />
                    </IconSize>
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="p-0 w-[var(--radix-popover-trigger-width)]" 
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Tìm kiếm thư mục..." />
                    <CommandList>
                      <CommandEmpty>Không tìm thấy thư mục.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="__root__"
                          onSelect={() => {
                            setRootFolderForString(null)
                            setFolderTreeSelectOpenString(false)
                          }}
                        >
                          <IconSize size="sm" className={cn("mr-2", !rootFolderForString ? "opacity-100" : "opacity-0")}>
                            <Check />
                          </IconSize>
                          <IconSize size="sm" className="mr-2 hover:text-foreground">
                            <Folder />
                          </IconSize>
                          Root (tạo ở thư mục gốc)
                        </CommandItem>
                        {folderTreeForSelect.map((node) => (
                          <FolderTreeSelectItem
                            key={node.path}
                            node={node}
                            selectedValue={rootFolderForString}
                            onSelect={(path) => setRootFolderForString(path)}
                            openPaths={openFolderPathsString}
                            setOpenPaths={setOpenFolderPathsString}
                            onClose={() => setFolderTreeSelectOpenString(false)}
                          />
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <TypographyPSmallMuted>
                {rootFolderForString
                  ? `Thư mục sẽ được tạo trong: ${rootFolderForString}/`
                  : "Thư mục sẽ được tạo ở thư mục gốc. Chọn bất kỳ folder nào để tạo folder con bên trong."}
              </TypographyPSmallMuted>
            </div>
            <div className="space-y-2">
              <Label htmlFor="folder-path-string">Đường dẫn thư mục</Label>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Input
                    id="folder-path-string"
                    placeholder={
                      rootFolderForString
                        ? "Nhập đường dẫn con (ví dụ: 2025/12/04)"
                        : "Nhập đường dẫn đầy đủ (ví dụ: products/2025/12/04)"
                    }
                    value={folderPathString}
                    onChange={(e) => setFolderPathString(e.target.value)}
                    disabled={createFolderMutation.isPending}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !createFolderMutation.isPending &&
                        (folderPathString.trim() || rootFolderForString)
                      ) {
                        handleCreateFolder()
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const todayPath = getTodayDatePath()
                      if (folderPathString.trim()) {
                        setFolderPathString(`${folderPathString.trim()}/${todayPath}`)
                      } else {
                        setFolderPathString(todayPath)
                      }
                    }}
                    disabled={createFolderMutation.isPending}
                    title="Thêm ngày hôm nay (YYYY/MM/DD)"
                    className="w-full sm:w-auto shrink-0"
                  >
                    Hôm nay
                  </Button>
                </div>
                <TypographyPSmallMuted>
                  {rootFolderForString
                    ? `Nhập đường dẫn con. Ví dụ: 2025/12/04 sẽ tạo ${rootFolderForString}/2025/12/04`
                    : "Nhập đường dẫn đầy đủ. Ví dụ: products/2025/12/04 sẽ tạo folder 04 trong products/2025/12/"}
                </TypographyPSmallMuted>
                <Button
                  type="button"
                  onClick={handleCreateFolder}
                  disabled={
                    (!folderPathString.trim() && !rootFolderForString) ||
                    createFolderMutation.isPending
                  }
                  className="w-full"
                >
                  {createFolderMutation.isPending ? (
                    <>
                      <IconSize size="sm" className="mr-2">
                        <Loader2 className="animate-spin" />
                      </IconSize>
                      Đang tạo...
                    </>
                  ) : (
                    "Tạo"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

