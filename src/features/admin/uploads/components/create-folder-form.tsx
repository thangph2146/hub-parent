/**
 * Create Folder Form Component
 * Component form để tạo folder mới
 */

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldDescription, FieldContent, FieldSet, FieldLegend, FieldGroup } from "@/components/ui/field"
import { useToast } from "@/hooks"
import { useUploadsStore } from "../uploads-store"
import { useCreateFolder } from "../hooks/use-uploads-queries"
import { FolderTreeSelect } from "./folder-tree-select"
import { SubmitButton } from "./submit-button"
import { ModeToggleButtons } from "./mode-toggle-buttons"
import { parseFolderPath, buildFullPath } from "../utils/folder-validation"
import { showValidationError, validateTreeMode, validateStringMode } from "../utils/validation-helpers"
import { getTodayDatePath } from "../utils/date-utils"
import type { FolderItem } from "../types"
import { Flex } from "@/components/ui/flex"

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

  const handleCreateFolder = React.useCallback(() => {
    let folderName = ""
    let parentPath: string | null = null

    if (folderInputMode === "tree") {
      const validation = validateTreeMode(newFolderName)
      if (!validation.isValid) {
        showValidationError(toast, validation.error!)
        return
      }
      folderName = validation.folderName
      parentPath = parentFolderForCreate
    } else {
      const validation = validateStringMode(folderPathString, rootFolderForString)
      if (!validation.isValid) {
        showValidationError(toast, validation.error!)
        return
      }

      const fullPath = buildFullPath(rootFolderForString, folderPathString)
      const parsed = parseFolderPath(fullPath)
      
      if (!parsed) {
        showValidationError(toast, "Đường dẫn thư mục không hợp lệ")
        return
      }

      folderName = parsed.folderName
      parentPath = parsed.parentPath
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

  const handleToggleForm = () => {
    if (showCreateFolderForm) {
      resetCreateFolderForm()
    }
    setShowCreateFolderForm(!showCreateFolderForm)
  }

  const handleTreeSelectChange = (path: string | null) => {
    setParentFolderForCreate(path)
    setFolderTreeSelectOpen(false)
  }

  const handleStringSelectChange = (path: string | null) => {
    setRootFolderForString(path)
    setFolderTreeSelectOpenString(false)
  }

  const handleAddTodayPath = () => {
    const todayPath = getTodayDatePath()
    const newPath = folderPathString.trim() ? `${folderPathString.trim()}/${todayPath}` : todayPath
    setFolderPathString(newPath)
  }

  const handleEnterKey = (e: React.KeyboardEvent, canSubmit: boolean) => {
    if (e.key === "Enter" && !createFolderMutation.isPending && canSubmit) {
      handleCreateFolder()
    }
  }

  if (!showCreateFolderForm) {
    return (
      <Flex direction="col" gap={2} className="border-b pb-4">
        <Flex direction="col" align="start" justify="between" gap={2} className="sm:flex-row sm:items-center">
          <FieldLabel>Tạo thư mục mới</FieldLabel>
          <Button type="button" variant="default" size="sm" onClick={handleToggleForm} className="w-full sm:w-auto">
            Tạo thư mục
          </Button>
        </Flex>
      </Flex>
    )
  }

  return (
      <FieldSet className="group/field-set">
        <Flex direction="col" align="start" justify="between" gap={2} className="sm:flex-row sm:items-center mb-4">
          <FieldLegend variant="legend">Tạo thư mục mới</FieldLegend>
          <Button type="button" variant="outline" size="sm" onClick={handleToggleForm} className="w-full sm:w-auto">
            Hủy
          </Button>
        </Flex>
        <FieldGroup>
        <Field>
          <FieldLabel>Chế độ nhập</FieldLabel>
          <FieldContent>
            <ModeToggleButtons
              mode={folderInputMode}
              onModeChange={setFolderInputMode}
              onTreeModeSelect={() => setFolderPathString("")}
              onStringModeSelect={() => {
                setParentFolderForCreate(null)
                setNewFolderName("")
              }}
            />
          </FieldContent>
        </Field>

        {folderInputMode === "tree" && (
          <>
            <Field>
              <FieldLabel htmlFor="parent-folder-select">Thư mục cha (tùy chọn)</FieldLabel>
              <FieldContent>
                <FolderTreeSelect
                  availableFolders={availableFolders}
                  selectedValue={parentFolderForCreate}
                  openPaths={openFolderPaths}
                  isOpen={folderTreeSelectOpen}
                  isLoading={isLoadingFolders}
                  disabled={createFolderMutation.isPending}
                  placeholder="Root (tạo ở thư mục gốc)"
                  rootLabel="Root (tạo ở thư mục gốc)"
                  onSelect={handleTreeSelectChange}
                  onOpenChange={setFolderTreeSelectOpen}
                  setOpenPaths={setOpenFolderPaths}
                  onClose={() => setFolderTreeSelectOpen(false)}
                />
                <FieldDescription>
                  {parentFolderForCreate
                    ? `Thư mục mới sẽ được tạo trong: ${parentFolderForCreate}/`
                    : "Thư mục mới sẽ được tạo ở thư mục gốc"}
                </FieldDescription>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="new-folder-name">Tên thư mục</FieldLabel>
              <FieldContent>
                <Flex direction="col" align="stretch" gap={2} className="sm:flex-row sm:items-center">
                <Input
                  id="new-folder-name"
                  placeholder="Nhập tên thư mục (ví dụ: products, events)"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  disabled={createFolderMutation.isPending}
                  onKeyDown={(e) => handleEnterKey(e, !!newFolderName.trim())}
                  className="flex-1"
                />
                <SubmitButton
                  isLoading={createFolderMutation.isPending}
                  disabled={!newFolderName.trim()}
                  onClick={handleCreateFolder}
                  loadingText="Đang tạo..."
                  className="w-full sm:w-auto"
                >
                  Tạo
                </SubmitButton>
              </Flex>
              </FieldContent>
            </Field>
          </>
        )}

        {folderInputMode === "string" && (
          <>
            <Field>
              <FieldLabel htmlFor="root-folder-string">Chọn thư mục (tùy chọn)</FieldLabel>
              <FieldContent>
                <FolderTreeSelect
                  availableFolders={availableFolders}
                  selectedValue={rootFolderForString}
                  openPaths={openFolderPathsString}
                  isOpen={folderTreeSelectOpenString}
                  isLoading={isLoadingFolders}
                  disabled={createFolderMutation.isPending}
                  placeholder="Chọn thư mục (để trống để tạo ở root)"
                  rootLabel="Root (tạo ở thư mục gốc)"
                  showSearch
                  onSelect={handleStringSelectChange}
                  onOpenChange={setFolderTreeSelectOpenString}
                  setOpenPaths={setOpenFolderPathsString}
                  onClose={() => setFolderTreeSelectOpenString(false)}
                />
                <FieldDescription>
                  {rootFolderForString
                    ? `Thư mục sẽ được tạo trong: ${rootFolderForString}/`
                    : "Thư mục sẽ được tạo ở thư mục gốc. Chọn bất kỳ folder nào để tạo folder con bên trong."}
                </FieldDescription>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="folder-path-string">Đường dẫn thư mục</FieldLabel>
              <FieldContent>
                <Flex direction="col" gap={2}>
                <Flex direction="col" align="stretch" gap={2} className="sm:flex-row sm:items-center">
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
                    onKeyDown={(e) => handleEnterKey(e, !!(folderPathString.trim() || rootFolderForString))}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTodayPath}
                    disabled={createFolderMutation.isPending}
                    title="Thêm ngày hôm nay (YYYY/MM/DD)"
                    className="w-full sm:w-auto shrink-0"
                  >
                    Hôm nay
                  </Button>
                </Flex>
                <FieldDescription>
                  {rootFolderForString
                    ? `Nhập đường dẫn con. Ví dụ: 2025/12/04 sẽ tạo ${rootFolderForString}/2025/12/04`
                    : "Nhập đường dẫn đầy đủ. Ví dụ: products/2025/12/04 sẽ tạo folder 04 trong products/2025/12/"}
                </FieldDescription>
                <SubmitButton
                  isLoading={createFolderMutation.isPending}
                  disabled={!folderPathString.trim() && !rootFolderForString}
                  onClick={handleCreateFolder}
                  loadingText="Đang tạo..."
                  className="w-full"
                >
                  Tạo
                </SubmitButton>
              </Flex>
              </FieldContent>
            </Field>
          </>
        )}
        </FieldGroup>
      </FieldSet>
  )
}

