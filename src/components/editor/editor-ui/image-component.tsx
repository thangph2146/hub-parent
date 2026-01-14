import * as React from "react"
import {
  JSX,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import Image from "next/image"
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { LexicalNestedComposer } from "@lexical/react/LexicalNestedComposer"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { useLexicalEditable } from "@lexical/react/useLexicalEditable"
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection"
import { mergeRegister } from "@lexical/utils"
import type {
  BaseSelection,
  LexicalCommand,
  LexicalEditor,
  NodeKey,
} from "lexical"
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGSTART_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from "lexical"
import { $getRoot } from "lexical"

import { ContentEditable } from "@/components/editor/editor-ui/content-editable"
import { ImageResizer } from "@/components/editor/editor-ui/image-resizer"
import {
  getContainerWidth,
  getImageAspectRatio,
} from "@/components/editor/editor-ui/image-sizing"
import { $isImageNode } from "@/components/editor/nodes/image-node"
import { cn } from "@/utils"
import { useEditorContainer } from "@/components/editor/context/editor-container-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  InsertImageDialog,
  InsertImagePayload,
} from "@/components/editor/plugins/images-plugin"
import { Logo } from "@/components/icons/logo"
import { usePriorityImage } from "@/components/editor/context/priority-image-context"

// Cache for image dimensions and aspect ratios to prevent layout shift
const imageCache = new Map<string, { width: number; height: number; ratio: number }>()
const RESIZE_HANDLE_HIDE_DELAY = 200

// Default aspect ratio for placeholders (16:9 is common for web content)
const DEFAULT_ASPECT_RATIO = 16 / 9
const DEFAULT_WIDTH = 800
const DEFAULT_HEIGHT = Math.round(DEFAULT_WIDTH / DEFAULT_ASPECT_RATIO)
const DEFAULT_DIMENSIONS = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, ratio: DEFAULT_ASPECT_RATIO }

type TimeoutHandle = ReturnType<typeof setTimeout>

export const RIGHT_CLICK_IMAGE_COMMAND: LexicalCommand<MouseEvent> =
  createCommand("RIGHT_CLICK_IMAGE_COMMAND")

type DimensionValue = "inherit" | number

interface ImageComponentProps {
  altText: string
  caption: LexicalEditor
  captionsEnabled: boolean
  fullWidth: boolean
  height: DimensionValue
  maxWidth: number
  nodeKey: NodeKey
  resizable: boolean
  showCaption: boolean
  src: string
  width: DimensionValue
}

function LazyImage({
  altText,
  className,
  imageRef,
  src,
  width,
  height,
  maxWidth: _maxWidth,
  onError,
  fetchPriority = "auto",
}: {
  altText: string
  className: string | null
  height: DimensionValue
  imageRef: { current: null | HTMLImageElement }
  maxWidth: number
  src: string
  width: DimensionValue
  onError: () => void
  fetchPriority?: "high" | "low" | "auto"
}): JSX.Element {
  // Convert DimensionValue to number for width/height attributes
  const getNumericValue = (value: DimensionValue): number | undefined => {
    if (typeof value === "number") return value
    if (typeof value === "string") {
      if (value === "inherit") return undefined
      const num = parseInt((value as string).replace("px", ""), 10)
      return isNaN(num) ? undefined : num
    }
    return undefined
  }
  
  const widthAttr = getNumericValue(width)
  const heightAttr = getNumericValue(height)
  
  const cachedDims = imageCache.get(src)
  const [actualDimensions, setActualDimensions] = useState<{ width?: number; height?: number; ratio?: number }>(
    cachedDims || DEFAULT_DIMENSIONS
  )
  
  const wrapperRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (wrapperRef.current) {
      const imgElement = wrapperRef.current.querySelector("img") as HTMLImageElement | null
      if (imgElement) {
        imageRef.current = imgElement
        if ((width === "inherit" || height === "inherit") && imgElement.complete && imgElement.naturalWidth && imgElement.naturalHeight) {
          const ratio = imgElement.naturalWidth / imgElement.naturalHeight
          setActualDimensions({
            width: imgElement.naturalWidth,
            height: imgElement.naturalHeight,
            ratio,
          })
          imageCache.set(src, {
            width: imgElement.naturalWidth,
            height: imgElement.naturalHeight,
            ratio,
          })
        }
      }
    }
  }, [width, height, imageRef, src])
  
  const getSizes = (): string => {
    if (typeof widthAttr === "number" && widthAttr > 0) {
      if (widthAttr <= 640) return "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      return "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
    }
    return "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
  }

  const renderWidth = widthAttr || actualDimensions.width || DEFAULT_WIDTH
  const renderHeight = heightAttr || actualDimensions.height || DEFAULT_HEIGHT

  return (
    <div ref={wrapperRef} style={{ display: "inline-block", width: "100%" }}>
      <Image
        className={className || undefined}
        src={src}
        alt={altText}
        width={renderWidth}
        height={renderHeight}
        sizes={getSizes()}
        quality={75}
        style={{
          height: height === "inherit" ? "auto" : height,
          width: width === "inherit" ? "100%" : width,
          maxWidth: "100%",
        }}
        onError={onError}
        draggable={false}
        priority={fetchPriority === "high"}
        decoding="async"
        onLoad={(e) => {
          const img = e.currentTarget
          if (img) {
            imageRef.current = img
            const ratio = img.naturalWidth / img.naturalHeight
            imageCache.set(src, {
              width: img.naturalWidth,
              height: img.naturalHeight,
              ratio,
            })
            if (width === "inherit" || height === "inherit") {
              setActualDimensions({
                width: img.naturalWidth,
                height: img.naturalHeight,
              })
            }
          }
        }}
      />
    </div>
  )
}

function useResponsiveImageDimensions({
  editor,
  height,
  imageRef,
  width,
  isResizing,
  fullWidth,
  maxWidthLimit,
  src,
}: {
  editor: LexicalEditor
  height: DimensionValue
  imageRef: { current: null | HTMLImageElement }
  width: DimensionValue
  isResizing: boolean
  fullWidth?: boolean
  maxWidthLimit?: number
  src: string
}) {
  const [dimensions, setDimensions] = useState<{
    width: DimensionValue
    height: DimensionValue
  }>({
    width,
    height,
  })

  useEffect(() => {
    if (isResizing) {
      return
    }

    let cancelScheduledUpdate: null | (() => void) = null
    const cleanupTasks: Array<() => void> = []
    const scheduleDimensionsUpdate = (next: {
      width: DimensionValue
      height: DimensionValue
    }) => {
      if (cancelScheduledUpdate) {
        cancelScheduledUpdate()
      }

      const applyNext = () => {
        cancelScheduledUpdate = null
        setDimensions((prev) => {
          if (prev.width === next.width && prev.height === next.height) {
            return prev
          }
          return next
        })
      }

      if (
        typeof window !== "undefined" &&
        typeof window.requestAnimationFrame === "function"
      ) {
        const frameId = window.requestAnimationFrame(applyNext)
        cancelScheduledUpdate = () => window.cancelAnimationFrame(frameId)
      } else {
        const timeoutId = setTimeout(applyNext)
        cancelScheduledUpdate = () => clearTimeout(timeoutId)
      }
    }

    const editorRoot = editor.getRootElement()
    const image = imageRef.current

    if (!image) {
      scheduleDimensionsUpdate({ width, height })
      return () => {
        cancelScheduledUpdate?.()
      }
    }

    if (typeof width === "number" && typeof height === "number") {
      scheduleDimensionsUpdate({ width, height })
      return () => {
        cancelScheduledUpdate?.()
      }
    }

    const updateDimensions = () => {
      const containerWidth = getContainerWidth(
        image,
        editorRoot,
        maxWidthLimit
      )

      if (!containerWidth) {
        scheduleDimensionsUpdate({ width, height })
        return
      }

      const cached = imageCache.get(src)
      const baseWidth =
        typeof width === "number"
          ? width
          : image.naturalWidth || cached?.width || image.getBoundingClientRect().width || containerWidth

      let baseHeight: DimensionValue
      if (typeof height === "number") {
        baseHeight = height
      } else if (image.naturalHeight > 0) {
        baseHeight = image.naturalHeight
      } else if (cached?.height) {
        baseHeight = cached.height
      } else {
        const ratio = cached?.ratio || getImageAspectRatio(image) || DEFAULT_ASPECT_RATIO
        baseHeight = ratio > 0 ? Math.round(baseWidth / ratio) : "inherit"
      }

      let nextWidth: DimensionValue = baseWidth
      let nextHeight: DimensionValue = baseHeight

      if (fullWidth) {
        nextWidth = containerWidth
        if (typeof baseHeight === "number") {
          const ratio =
            typeof baseWidth === "number" && baseWidth > 0
              ? baseWidth / baseHeight
              : cached?.ratio || getImageAspectRatio(image) || DEFAULT_ASPECT_RATIO
          nextHeight = Math.max(Math.round(containerWidth / ratio), 1)
        } else if (baseHeight === "inherit") {
          const ratio = cached?.ratio || getImageAspectRatio(image) || DEFAULT_ASPECT_RATIO
          nextHeight = ratio > 0 ? Math.max(Math.round(containerWidth / ratio), 1) : baseHeight
        }
      } else if (
        width === "inherit" &&
        typeof baseWidth === "number" &&
        baseWidth > containerWidth
      ) {
        const scale = containerWidth / baseWidth
        nextWidth = containerWidth
        if (typeof baseHeight === "number") {
          nextHeight = Math.max(Math.round(baseHeight * scale), 1)
        } else if (baseHeight === "inherit") {
          const ratio = cached?.ratio || getImageAspectRatio(image) || DEFAULT_ASPECT_RATIO
          nextHeight =
            ratio > 0 ? Math.max(Math.round(containerWidth / ratio), 1) : baseHeight
        }
      }

      scheduleDimensionsUpdate({ width: nextWidth, height: nextHeight })
    }

    updateDimensions()

    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(updateDimensions)
      if (editorRoot) {
        resizeObserver.observe(editorRoot)
      }
      if (image.parentElement) {
        resizeObserver.observe(image.parentElement)
      }
      cleanupTasks.push(() => {
        resizeObserver.disconnect()
      })
    } else if (typeof window !== "undefined") {
      window.addEventListener("resize", updateDimensions)
      cleanupTasks.push(() => {
        window.removeEventListener("resize", updateDimensions)
      })
    }

    return () => {
      cancelScheduledUpdate?.()
      cleanupTasks.forEach((task) => task())
    }
  }, [
    editor,
    height,
    imageRef,
    isResizing,
    width,
    fullWidth,
    maxWidthLimit,
    src,
  ])

  return dimensions
}

function useImageCaptionControls({
  caption,
  editor,
  nodeKey,
  showCaption,
}: {
  caption: LexicalEditor
  editor: LexicalEditor
  nodeKey: NodeKey
  showCaption: boolean
}) {
  const [hasCaptionContent, setHasCaptionContent] = useState(false)
  const [localShowCaption, setLocalShowCaption] = useState(showCaption)
  const isUpdatingCaptionRef = useRef(false)
  const lastShowCaptionRef = useRef(showCaption)

  useEffect(() => {
    let timeout: TimeoutHandle | null = null
    timeout = setTimeout(() => {
      if (!showCaption) {
        setHasCaptionContent(false)
        setLocalShowCaption(false)
      } else if (
        !isUpdatingCaptionRef.current &&
        lastShowCaptionRef.current !== showCaption
      ) {
        setLocalShowCaption(showCaption)
        lastShowCaptionRef.current = showCaption
      }
      isUpdatingCaptionRef.current = false
    }, 0)

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [showCaption])

  const setShowCaption = useCallback(
    (show: boolean) => {
      isUpdatingCaptionRef.current = true
      lastShowCaptionRef.current = show

      setLocalShowCaption(show)

      if (!show) {
        setHasCaptionContent(false)
      }

      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if ($isImageNode(node)) {
          node.setShowCaption(show)

          if (!show) {
            caption.update(() => {
              const root = $getRoot()
              root.clear()
            })
          }
        }
      })
    },
    [caption, editor, nodeKey]
  )

  useEffect(() => {
    const computeHasContent = () => {
      const state = caption.getEditorState()
      const hasContent = state.read(() => {
        const root = $getRoot()
        const raw = root.getTextContent()
        const text = raw.replace(/[\u200B\u00A0\s]+/g, "")
        return text.length > 0
      })
      setHasCaptionContent(showCaption && hasContent)
    }

    const timer = setTimeout(() => {
      computeHasContent()
    }, 0)

    const unregister = caption.registerUpdateListener(() => {
      computeHasContent()
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if ($isImageNode(node)) {
          node.setShowCaption(showCaption)
        }
      })
    })

    return () => {
      clearTimeout(timer)
      unregister()
    }
  }, [caption, editor, nodeKey, showCaption])

  return {
    hasCaptionContent,
    localShowCaption,
    setShowCaption,
  }
}

function useImageNodeInteractions({
  buttonRef,
  caption,
  editor,
  imageRef,
  isResizing,
  nodeKey,
  showCaption,
}: {
  buttonRef: React.MutableRefObject<HTMLButtonElement | null>
  caption: LexicalEditor
  editor: LexicalEditor
  imageRef: React.MutableRefObject<HTMLImageElement | null>
  isResizing: boolean
  nodeKey: NodeKey
  showCaption: boolean
}) {
  const [selection, setSelection] = useState<BaseSelection | null>(null)
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey)
  const activeEditorRef = useRef<LexicalEditor | null>(null)

  const $onDelete = useCallback(
    (payload: KeyboardEvent) => {
      const deleteSelection = $getSelection()
      if (isSelected && $isNodeSelection(deleteSelection)) {
        const event: KeyboardEvent = payload
        event.preventDefault()
        editor.update(() => {
          deleteSelection.getNodes().forEach((node) => {
            if ($isImageNode(node)) {
              node.remove()
            }
          })
        })
      }
      return false
    },
    [editor, isSelected]
  )

  const $onEnter = useCallback(
    (event: KeyboardEvent) => {
      const latestSelection = $getSelection()
      const buttonElem = buttonRef.current
      if (
        isSelected &&
        $isNodeSelection(latestSelection) &&
        latestSelection.getNodes().length === 1
      ) {
        if (showCaption) {
          $setSelection(null)
          event.preventDefault()
          caption.focus()
          return true
        } else if (
          buttonElem !== null &&
          buttonElem !== document.activeElement
        ) {
          event.preventDefault()
          buttonElem.focus()
          return true
        }
      }
      return false
    },
    [buttonRef, caption, isSelected, showCaption]
  )

  const $onEscape = useCallback(
    (event: KeyboardEvent) => {
      if (
        activeEditorRef.current === caption ||
        buttonRef.current === event.target
      ) {
        $setSelection(null)
        editor.update(() => {
          setSelected(true)
          const parentRootElement = editor.getRootElement()
          if (parentRootElement !== null) {
            parentRootElement.focus()
          }
        })
        return true
      }
      return false
    },
    [buttonRef, caption, editor, setSelected]
  )

  const onClick = useCallback(
    (payload: MouseEvent) => {
      const event = payload

      if (isResizing) {
        return true
      }
      if (event.target === imageRef.current) {
        if (event.shiftKey) {
          setSelected(!isSelected)
        } else {
          clearSelection()
          setSelected(true)
        }
        return true
      }

      return false
    },
    [clearSelection, imageRef, isResizing, isSelected, setSelected]
  )

  const onRightClick = useCallback(
    (event: MouseEvent): void => {
      editor.getEditorState().read(() => {
        const latestSelection = $getSelection()
        const domElement = event.target as HTMLElement
        if (
          domElement.tagName === "IMG" &&
          $isRangeSelection(latestSelection) &&
          latestSelection.getNodes().length === 1
        ) {
          editor.dispatchCommand(
            RIGHT_CLICK_IMAGE_COMMAND,
            event as MouseEvent
          )
        }
      })
    },
    [editor]
  )

  useEffect(() => {
    let isMounted = true
    const rootElement = editor.getRootElement()
    const unregister = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        if (isMounted) {
          setSelection(editorState.read(() => $getSelection()))
        }
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_, activeEditor) => {
          activeEditorRef.current = activeEditor
          return false
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand<MouseEvent>(
        RIGHT_CLICK_IMAGE_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        DRAGSTART_COMMAND,
        (event) => {
          if (event.target === imageRef.current) {
            event.preventDefault()
            return true
          }
          return false
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        $onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        $onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(KEY_ENTER_COMMAND, $onEnter, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        $onEscape,
        COMMAND_PRIORITY_LOW
      )
    )

    rootElement?.addEventListener("contextmenu", onRightClick)

    return () => {
      isMounted = false
      unregister()
      rootElement?.removeEventListener("contextmenu", onRightClick)
    }
  }, [
    clearSelection,
    editor,
    imageRef,
    isResizing,
    isSelected,
    nodeKey,
    $onDelete,
    $onEnter,
    $onEscape,
    onClick,
    onRightClick,
    setSelected,
  ])

  return { isSelected, selection }
}

function BrokenImage(): JSX.Element {
  const transparentPixel = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E"
  
  return (
    <div style={{ display: "inline-block", width: 200, height: 200 }}>
      <Image
        src={transparentPixel}
        alt="Broken image"
        width={200}
        height={200}
        style={{
          opacity: 0.2,
          objectFit: "contain",
        }}
        draggable={false}
        unoptimized
      />
    </div>
  )
}

function ImagePlaceholder({
  width,
  height,
}: {
  width: DimensionValue
  height: DimensionValue
}): JSX.Element {
  const MAX_CONTAINER_WIDTH = 800
  const MAX_CONTAINER_HEIGHT = 600
  
  let containerWidth = typeof width === "number" ? width : 200
  let containerHeight = typeof height === "number" ? height : 200
  
  if (containerWidth > MAX_CONTAINER_WIDTH) {
    const scale = MAX_CONTAINER_WIDTH / containerWidth
    containerWidth = MAX_CONTAINER_WIDTH
    containerHeight = Math.max(200, containerHeight * scale)
  }
  
  if (containerHeight > MAX_CONTAINER_HEIGHT) {
    const scale = MAX_CONTAINER_HEIGHT / containerHeight
    containerHeight = MAX_CONTAINER_HEIGHT
    containerWidth = Math.max(200, containerWidth * scale)
  }
  
  const minDimension = Math.min(containerWidth, containerHeight)
  const logoSize = Math.max(150, Math.min(500, minDimension * 0.45))
  
  return (
    <div
      className="flex items-center justify-center bg-gray-50 rounded border border-gray-200"
      style={{
        width: containerWidth,
        height: containerHeight,
        minWidth: 200,
        minHeight: 200,
        maxWidth: MAX_CONTAINER_WIDTH,
        maxHeight: MAX_CONTAINER_HEIGHT,
      }}
    >
      <div className="relative">
        <Logo
          className="opacity-50 animate-pulse"
          style={{
            width: logoSize,
            height: logoSize,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div 
            className="w-2 h-2 bg-gray-400 rounded-full animate-ping" 
            style={{ animationDelay: "0.5s" }} 
          />
        </div>
      </div>
    </div>
  )
}

function CaptionComposer({
  caption,
  isEditable,
}: {
  caption: LexicalEditor
  isEditable: boolean
}) {
  return (
    <LexicalNestedComposer initialEditor={caption}>
      <AutoFocusPlugin />
      <HistoryPlugin />
      <RichTextPlugin
        contentEditable={
          <div className="relative">
            <ContentEditable
              className={`ImageNode__contentEditable relative block min-h-5 w-full resize-none border-0 bg-transparent px-2.5 py-2 text-sm whitespace-pre-wrap outline-none word-break-break-word ${
                isEditable
                  ? "box-border cursor-text caret-primary user-select-text"
                  : "cursor-default select-text"
              }`}
              placeholder={isEditable ? "Enter a caption..." : ""}
              placeholderDefaults={false}
              placeholderClassName="ImageNode__placeholder absolute top-0 left-0 overflow-hidden px-2.5 py-2 text-ellipsis text-sm"
            />
          </div>
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
    </LexicalNestedComposer>
  )
}

export default function ImageComponent({
  altText,
  caption,
  captionsEnabled,
  fullWidth,
  height,
  maxWidth,
  nodeKey,
  resizable,
  showCaption,
  src,
  width,
}: ImageComponentProps): JSX.Element {
  const imageRef = useRef<null | HTMLImageElement>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const [isResizing, setIsResizing] = useState<boolean>(false)
  const resizeTimeoutRef = useRef<TimeoutHandle | null>(null)
  const [editor] = useLexicalComposerContext()
  const [isLoadError, setIsLoadError] = useState<boolean>(false)
  const [isReplaceDialogOpen, setIsReplaceDialogOpen] = useState(false)
  const isEditable = useLexicalEditable()
  const editorContainer = useEditorContainer()
  
  const prioritySrc = usePriorityImage()
  const isPriority = src === prioritySrc
  
  const {
    hasCaptionContent,
    localShowCaption,
    setShowCaption,
  } = useImageCaptionControls({
    caption,
    editor,
    nodeKey,
    showCaption,
  })
  const responsiveDimensions = useResponsiveImageDimensions({
    editor,
    imageRef,
    width,
    height,
    isResizing,
    fullWidth,
    maxWidthLimit: editorContainer?.maxWidth,
    src,
  })

  const { isSelected, selection } = useImageNodeInteractions({
    buttonRef,
    caption,
    editor,
    imageRef,
    isResizing,
    nodeKey,
    showCaption,
  })

  useEffect(() => {
    if (!isEditable && isReplaceDialogOpen) {
      setTimeout(() => {
        setIsReplaceDialogOpen(false)
      }, 0)
    }
  }, [isEditable, isReplaceDialogOpen])

  useEffect(() => {
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
    }
  }, [])

  const onResizeEnd = useCallback(
    (nextWidth: DimensionValue, nextHeight: DimensionValue) => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
      resizeTimeoutRef.current = setTimeout(() => {
        setIsResizing(false)
      }, RESIZE_HANDLE_HIDE_DELAY)

      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if ($isImageNode(node)) {
          node.setWidthAndHeight(nextWidth, nextHeight)
        }
      })
    },
    [editor, nodeKey]
  )

  const onResizeStart = useCallback(() => {
    setIsResizing(true)
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if ($isImageNode(node)) {
        node.setFullWidth(false)
      }
    })
  }, [editor, nodeKey])

  const handleReplaceImage = useCallback(
    (payload: InsertImagePayload) => {
      if (!payload?.src) {
        return
      }
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if ($isImageNode(node)) {
          node.setSrc(payload.src)
          if (payload.altText !== undefined) {
            node.setAltText(payload.altText)
          }
          node.setWidthAndHeight("inherit", "inherit")
        }
      })
    },
    [editor, nodeKey]
  )

  const draggable = isSelected && $isNodeSelection(selection) && !isResizing
  const isFocused = (isSelected || isResizing) && isEditable
  const shouldRenderCaption =
    showCaption &&
    (isEditable
      ? localShowCaption && captionsEnabled
      : hasCaptionContent)

  const imageClassName = cn(
    "cursor-default",
    isFocused && "focused ring-primary ring-2 ring-offset-2",
    isFocused &&
      $isNodeSelection(selection) &&
      "draggable cursor-grab active:cursor-grabbing"
  )

  const captionWrapperClass = cn(
    "image-caption-container mt-2 block min-w-[100px] overflow-hidden p-0",
    isEditable ? "border-1 rounded-md bg-white/90" : "border-0 bg-transparent"
  )

  return (
    <Suspense
      fallback={
        <div draggable={draggable}>
          <ImagePlaceholder
            width={responsiveDimensions.width}
            height={responsiveDimensions.height}
          />
        </div>
      }
    >
      <>
        <div draggable={draggable}>
          {isLoadError ? (
            <BrokenImage />
          ) : (
            <LazyImage
              className={imageClassName}
              src={src}
              altText={altText}
              imageRef={imageRef}
              width={responsiveDimensions.width}
              height={responsiveDimensions.height}
              maxWidth={maxWidth}
              onError={() => setIsLoadError(true)}
              fetchPriority={isPriority ? "high" : "auto"}
            />
          )}
        </div>

        {shouldRenderCaption && (
          <div className={captionWrapperClass}>
            <CaptionComposer caption={caption} isEditable={isEditable} />
          </div>
        )}
        {resizable && $isNodeSelection(selection) && isFocused && (
          <ImageResizer
            showCaption={localShowCaption}
            setShowCaption={setShowCaption}
            editor={editor}
            buttonRef={buttonRef}
            mediaRef={imageRef}
            onResizeStart={onResizeStart}
            onResizeEnd={onResizeEnd}
            captionsEnabled={!isLoadError && captionsEnabled}
            onSetFullWidth={() => {
              editor.update(() => {
                const node = $getNodeByKey(nodeKey)
                if ($isImageNode(node)) {
                  node.setFullWidth(true)
                }
              })
            }}
            onReplaceMedia={
              isEditable
                ? () => setIsReplaceDialogOpen(true)
                : undefined
            }
          />
        )}
        <Dialog
          open={isReplaceDialogOpen}
          onOpenChange={(open) => setIsReplaceDialogOpen(open)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change image</DialogTitle>
            </DialogHeader>
            <InsertImageDialog
              activeEditor={editor}
              onClose={() => setIsReplaceDialogOpen(false)}
              onInsert={(payload, close) => {
                handleReplaceImage(payload)
                close()
              }}
            />
          </DialogContent>
        </Dialog>
      </>
    </Suspense>
  )
}
