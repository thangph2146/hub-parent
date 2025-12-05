"use client"

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { JSX, useEffect, useRef, useState } from "react"
import * as React from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $wrapNodeInElement, mergeRegister } from "@lexical/utils"
import {
  $createParagraphNode,
  $createRangeSelection,
  $getSelection,
  $insertNodes,
  $isNodeSelection,
  $isRootOrShadowRoot,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  LexicalCommand,
  LexicalEditor,
} from "lexical"

import {
  $createImageNode,
  $isImageNode,
  ImageNode,
  ImagePayload,
} from "@/components/editor/nodes/image-node"
import { CAN_USE_DOM } from "@/components/editor/shared/can-use-dom"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useImagesList } from "@/features/admin/uploads/hooks/use-uploads-queries"
import { Loader2, Folder, ChevronRight } from "lucide-react"
import Image from "next/image"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { FolderNode } from "@/features/admin/uploads/types"

export type InsertImagePayload = Readonly<ImagePayload>

const getDOMSelection = (targetWindow: Window | null): Selection | null =>
  CAN_USE_DOM ? (targetWindow || window).getSelection() : null

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
  createCommand("INSERT_IMAGE_COMMAND")

export function InsertImageUriDialogBody({
  onClick,
}: {
  onClick: (payload: InsertImagePayload) => void
}) {
  const [src, setSrc] = useState("")
  const [altText, setAltText] = useState("")

  const isDisabled = src === ""

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="image-url">Image URL</Label>
        <Input
          id="image-url"
          placeholder="i.e. https://source.unsplash.com/random"
          onChange={(e) => setSrc(e.target.value)}
          value={src}
          data-test-id="image-modal-url-input"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="alt-text">Alt Text</Label>
        <Input
          id="alt-text"
          placeholder="Random unsplash image"
          onChange={(e) => setAltText(e.target.value)}
          value={altText}
          data-test-id="image-modal-alt-text-input"
        />
      </div>
      <DialogFooter>
        <Button
          type="submit"
          disabled={isDisabled}
          onClick={() => onClick({ altText, src })}
          data-test-id="image-modal-confirm-btn"
        >
          Confirm
        </Button>
      </DialogFooter>
    </div>
  )
}

export function InsertImageUploadedDialogBody({
  onClick,
}: {
  onClick: (payload: InsertImagePayload) => void
}) {
  const [src, setSrc] = useState("")
  const [altText, setAltText] = useState("")

  const isDisabled = src === ""

  const loadImage = (files: FileList | null) => {
    const reader = new FileReader()
    reader.onload = function () {
      if (typeof reader.result === "string") {
        setSrc(reader.result)
      }
      return ""
    }
    if (files !== null) {
      reader.readAsDataURL(files[0])
    }
  }

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="image-upload">Image Upload</Label>
        <Input
          id="image-upload"
          type="file"
          onChange={(e) => loadImage(e.target.files)}
          accept="image/*"
          data-test-id="image-modal-file-upload"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="alt-text">Alt Text</Label>
        <Input
          id="alt-text"
          placeholder="Descriptive alternative text"
          onChange={(e) => setAltText(e.target.value)}
          value={altText}
          data-test-id="image-modal-alt-text-input"
        />
      </div>
      <Button
        type="submit"
        disabled={isDisabled}
        onClick={() => onClick({ altText, src })}
        data-test-id="image-modal-file-upload-btn"
      >
        Confirm
      </Button>
    </div>
  )
}

// Component để hiển thị folder tree cho image picker
function ImagePickerFolderTree({
  folder,
  level = 0,
  openFolders,
  setOpenFolders,
  selectedImage,
  onImageSelect,
}: {
  folder: FolderNode
  level?: number
  openFolders: Set<string>
  setOpenFolders: React.Dispatch<React.SetStateAction<Set<string>>>
  selectedImage: string | null
  onImageSelect: (imageUrl: string, originalName: string) => void
}) {
  const hasContent = folder.images.length > 0 || folder.subfolders.length > 0
  const isOpen = openFolders.has(folder.path)

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (open) {
        setOpenFolders((prev) => {
          const newSet = new Set(prev)
          newSet.add(folder.path)
          return newSet
        })
      } else {
        setOpenFolders((prev) => {
          const newSet = new Set(prev)
          newSet.delete(folder.path)
          return newSet
        })
      }
    },
    [folder.path, setOpenFolders]
  )

  if (!hasContent) return null

  return (
    <Collapsible key={folder.path} open={isOpen} onOpenChange={handleOpenChange} className="mb-2">
      <CollapsibleTrigger className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-muted rounded-md transition-colors text-left text-sm">
        <ChevronRight className={`h-3.5 w-3.5 transition-transform shrink-0 ${isOpen ? "rotate-90" : ""}`} />
        <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="font-medium truncate">{folder.name}</span>
        <span className="text-xs text-muted-foreground ml-auto shrink-0">
          {`${folder.images.length} hình${folder.subfolders.length > 0 ? `, ${folder.subfolders.length} thư mục` : ""}`}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="ml-4 mt-1">
        {/* Render images in this folder */}
        {folder.images.length > 0 && (
          <div className="mb-3 grid grid-cols-4 gap-2">
            {folder.images.map((image) => (
              <button
                key={image.fileName}
                type="button"
                onClick={() => onImageSelect(image.url, image.originalName)}
                onDoubleClick={() => {
                  // Double-click để insert ngay
                  onImageSelect(image.url, image.originalName)
                  // Trigger confirm sau một chút để state được update
                  setTimeout(() => {
                    const event = new Event("confirm-image-insert", { bubbles: true })
                    document.dispatchEvent(event)
                  }, 100)
                }}
                className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all cursor-pointer ${
                  selectedImage === image.url
                    ? "border-primary ring-2 ring-primary ring-offset-1"
                    : "border-border hover:border-primary/50"
                }`}
                title={`${image.originalName} - Double-click để chèn ngay`}
              >
                <Image
                  src={image.url}
                  alt={image.originalName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 25vw, 20vw"
                  unoptimized
                />
              </button>
            ))}
          </div>
        )}
        {/* Render subfolders */}
        {folder.subfolders.map((subfolder) => (
          <ImagePickerFolderTree
            key={subfolder.path}
            folder={subfolder}
            level={level + 1}
            openFolders={openFolders}
            setOpenFolders={setOpenFolders}
            selectedImage={selectedImage}
            onImageSelect={onImageSelect}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

export function InsertImageUploadsDialogBody({
  onClick,
}: {
  onClick: (payload: InsertImagePayload) => void
}) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [altText, setAltText] = useState("")
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set())
  const limit = 100 // Tăng limit để lấy nhiều hình ảnh hơn cho tree view

  const { data: imagesData, isLoading } = useImagesList(1, limit)
  const folderTree = imagesData?.folderTree

  const isDisabled = !selectedImage

  const handleImageSelect = React.useCallback((imageUrl: string, originalName: string) => {
    setSelectedImage(imageUrl)
    setAltText((prev) => prev || originalName)
  }, [])

  const handleConfirm = React.useCallback(() => {
    if (selectedImage) {
      // Đảm bảo URL là absolute nếu là relative URL từ uploads
      let imageUrl = selectedImage
      if (imageUrl.startsWith("/api/uploads")) {
        // Relative URL từ uploads - giữ nguyên vì nó sẽ hoạt động với same-origin
        imageUrl = selectedImage
      } else if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://") && !imageUrl.startsWith("data:")) {
        // Nếu không phải absolute URL và không phải data URL, thêm protocol
        imageUrl = `https://${imageUrl}`
      }
      
      onClick({ altText: altText || "", src: imageUrl })
    }
  }, [selectedImage, altText, onClick])

  // Listen for double-click confirm event
  React.useEffect(() => {
    const handleDoubleClickConfirm = () => {
      // Use a ref to get the latest selectedImage
      setTimeout(() => {
        handleConfirm()
      }, 50)
    }
    
    document.addEventListener("confirm-image-insert", handleDoubleClickConfirm)
    return () => {
      document.removeEventListener("confirm-image-insert", handleDoubleClickConfirm)
    }
  }, [handleConfirm])

  // Auto-expand root folders on mount
  React.useEffect(() => {
    if (folderTree && folderTree.subfolders.length > 0) {
      setOpenFolders(new Set(folderTree.subfolders.map((f) => f.path)))
    }
  }, [folderTree])

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label>Chọn hình ảnh từ thư viện</Label>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !folderTree || (folderTree.subfolders.length === 0 && folderTree.images.length === 0) ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Chưa có hình ảnh nào được upload
          </div>
        ) : (
          <div className="max-h-[350px] overflow-y-auto p-2 border rounded-md">
            {/* Render root level images if any */}
            {folderTree.images.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-medium text-muted-foreground mb-2 px-1">Root</div>
                <div className="grid grid-cols-4 gap-2">
                  {folderTree.images.map((image) => (
                    <button
                      key={image.fileName}
                      type="button"
                      onClick={() => handleImageSelect(image.url, image.originalName)}
                      onDoubleClick={() => {
                        handleImageSelect(image.url, image.originalName)
                        setTimeout(() => {
                          const event = new Event("confirm-image-insert", { bubbles: true })
                          document.dispatchEvent(event)
                        }, 100)
                      }}
                      className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedImage === image.url
                          ? "border-primary ring-2 ring-primary ring-offset-1"
                          : "border-border hover:border-primary/50"
                      }`}
                      title={`${image.originalName} - Double-click để chèn ngay`}
                    >
                      <Image
                        src={image.url}
                        alt={image.originalName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 25vw, 20vw"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Render folder tree */}
            {folderTree.subfolders.map((subfolder) => (
              <ImagePickerFolderTree
                key={subfolder.path}
                folder={subfolder}
                level={0}
                openFolders={openFolders}
                setOpenFolders={setOpenFolders}
                selectedImage={selectedImage}
                onImageSelect={handleImageSelect}
              />
            ))}
          </div>
        )}
      </div>
      {selectedImage && (
        <div className="grid gap-2">
          <Label htmlFor="alt-text-uploads">Alt Text</Label>
          <Input
            id="alt-text-uploads"
            placeholder="Mô tả hình ảnh"
            onChange={(e) => setAltText(e.target.value)}
            value={altText}
            data-test-id="image-modal-uploads-alt-text-input"
          />
        </div>
      )}
      <DialogFooter>
        <Button
          type="submit"
          disabled={isDisabled}
          onClick={handleConfirm}
          data-test-id="image-modal-uploads-confirm-btn"
        >
          Chèn hình ảnh
        </Button>
      </DialogFooter>
    </div>
  )
}

export function InsertImageDialog({
  activeEditor,
  onClose,
  onInsert,
}: {
  activeEditor: LexicalEditor
  onClose: () => void
  onInsert?: (payload: InsertImagePayload, close: () => void) => void
}): JSX.Element {
  const hasModifier = useRef(false)

  useEffect(() => {
    hasModifier.current = false
    const handler = (e: KeyboardEvent) => {
      hasModifier.current = e.altKey
    }
    document.addEventListener("keydown", handler)
    return () => {
      document.removeEventListener("keydown", handler)
    }
  }, [activeEditor])

  const onClick = (payload: InsertImagePayload) => {
    if (onInsert) {
      onInsert(payload, onClose)
      return
    }
    activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, payload)
    onClose()
  }

  return (
    <Tabs defaultValue="uploads">
      <TabsList className="w-full">
        <TabsTrigger value="uploads" className="w-full">
          Thư viện
        </TabsTrigger>
        <TabsTrigger value="url" className="w-full">
          URL
        </TabsTrigger>
        <TabsTrigger value="file" className="w-full">
          File
        </TabsTrigger>
      </TabsList>
      <TabsContent value="uploads">
        <InsertImageUploadsDialogBody onClick={onClick} />
      </TabsContent>
      <TabsContent value="url">
        <InsertImageUriDialogBody onClick={onClick} />
      </TabsContent>
      <TabsContent value="file">
        <InsertImageUploadedDialogBody onClick={onClick} />
      </TabsContent>
    </Tabs>
  )
}

export function ImagesPlugin({
  captionsEnabled,
}: {
  captionsEnabled?: boolean
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error("ImagesPlugin: ImageNode not registered on editor")
    }

    return mergeRegister(
      editor.registerCommand<InsertImagePayload>(
        INSERT_IMAGE_COMMAND,
        (payload) => {
          const imageNode = $createImageNode(payload)
          $insertNodes([imageNode])
          if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
            $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd()
          }

          return true
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand<DragEvent>(
        DRAGSTART_COMMAND,
        (event) => {
          return $onDragStart(event)
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand<DragEvent>(
        DRAGOVER_COMMAND,
        (event) => {
          return $onDragover(event)
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand<DragEvent>(
        DROP_COMMAND,
        (event) => {
          return $onDrop(event, editor)
        },
        COMMAND_PRIORITY_HIGH
      )
    )
  }, [captionsEnabled, editor])

  return null
}

function $onDragStart(event: DragEvent): boolean {
  const node = $getImageNodeInSelection()
  if (!node) {
    return false
  }
  const dataTransfer = event.dataTransfer
  if (!dataTransfer) {
    return false
  }
  const TRANSPARENT_IMAGE =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
  const img = document.createElement("img")
  img.src = TRANSPARENT_IMAGE
  dataTransfer.setData("text/plain", "_")
  dataTransfer.setDragImage(img, 0, 0)
  dataTransfer.setData(
    "application/x-lexical-drag",
    JSON.stringify({
      data: {
        altText: node.__altText,
        caption: node.__caption,
        height: node.__height,
        key: node.getKey(),
        maxWidth: node.__maxWidth,
        showCaption: node.__showCaption,
        src: node.__src,
        width: node.__width,
      },
      type: "image",
    })
  )

  return true
}

function $onDragover(event: DragEvent): boolean {
  const node = $getImageNodeInSelection()
  if (!node) {
    return false
  }
  if (!canDropImage(event)) {
    event.preventDefault()
  }
  return true
}

function $onDrop(event: DragEvent, editor: LexicalEditor): boolean {
  const node = $getImageNodeInSelection()
  if (!node) {
    return false
  }
  const data = getDragImageData(event)
  if (!data) {
    return false
  }
  event.preventDefault()
  if (canDropImage(event)) {
    const range = getDragSelection(event)
    node.remove()
    const rangeSelection = $createRangeSelection()
    if (range !== null && range !== undefined) {
      rangeSelection.applyDOMRange(range)
    }
    $setSelection(rangeSelection)
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, data)
  }
  return true
}

function $getImageNodeInSelection(): ImageNode | null {
  const selection = $getSelection()
  if (!$isNodeSelection(selection)) {
    return null
  }
  const nodes = selection.getNodes()
  const node = nodes[0]
  return $isImageNode(node) ? node : null
}

function getDragImageData(event: DragEvent): null | InsertImagePayload {
  const dragData = event.dataTransfer?.getData("application/x-lexical-drag")
  if (!dragData) {
    return null
  }
  const { type, data } = JSON.parse(dragData)
  if (type !== "image") {
    return null
  }

  return data
}

declare global {
  interface DragEvent {
    rangeOffset?: number
    rangeParent?: Node
  }
}

function canDropImage(event: DragEvent): boolean {
  const target = event.target
  return !!(
    target &&
    target instanceof HTMLElement &&
    !target.closest("code, span.editor-image") &&
    target.parentElement &&
    target.parentElement.closest("div.ContentEditable__root")
  )
}

function getDragSelection(event: DragEvent): Range | null | undefined {
  let range
  const target = event.target as null | Element | Document
  const targetWindow =
    target == null
      ? null
      : target.nodeType === 9
        ? (target as Document).defaultView
        : (target as Element).ownerDocument.defaultView
  const domSelection = getDOMSelection(targetWindow)
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(event.clientX, event.clientY)
  } else if (event.rangeParent && domSelection !== null) {
    domSelection.collapse(event.rangeParent, event.rangeOffset || 0)
    range = domSelection.getRangeAt(0)
  } else {
    throw Error(`Cannot get the selection when dragging`)
  }

  return range
}
