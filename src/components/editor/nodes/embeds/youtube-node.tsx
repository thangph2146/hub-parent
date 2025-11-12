import * as React from "react"
import { JSX } from "react"
import { BlockWithAlignableContents } from "@lexical/react/LexicalBlockWithAlignableContents"
import { useLexicalEditable } from "@lexical/react/useLexicalEditable"
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection"
import { ImageResizer } from "@/components/editor/editor-ui/image-resizer"
import {
  DecoratorBlockNode,
  SerializedDecoratorBlockNode,
} from "@lexical/react/LexicalDecoratorBlockNode"
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from "lexical"
import { $getNodeByKey } from "lexical"

type YouTubeComponentProps = Readonly<{
  className: Readonly<{
    base: string
    focus: string
  }>
  format: ElementFormatType | null
  nodeKey: NodeKey
  videoID: string
  width: "inherit" | number
  height: "inherit" | number
  maxWidth: number
  editor: LexicalEditor
}>

function YouTubeComponent({
  className,
  format,
  nodeKey,
  videoID,
  width,
  height,
  maxWidth,
  editor,
}: YouTubeComponentProps) {
  const isEditable = useLexicalEditable()
  const [isSelected] = useLexicalNodeSelection(nodeKey)
  const [isResizing, setIsResizing] = React.useState(false)
  const wrapperRef = React.useRef<HTMLDivElement | null>(null)
  const buttonRef = React.useRef<HTMLButtonElement | null>(null)
  const aspect = 9 / 16
  const actualWidth = typeof width === "number" ? width : maxWidth
  const actualHeight =
    typeof height === "number"
      ? height
      : Math.round(actualWidth * aspect)
  const isFocused = (isSelected || isResizing) && isEditable
  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}
    >
      <div
        style={{ width: actualWidth, height: actualHeight }}
        className="relative inline-block"
        ref={wrapperRef}
      >
        <iframe
          width={actualWidth}
          height={actualHeight}
          src={`https://www.youtube-nocookie.com/embed/${videoID}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen={true}
          title="YouTube video"
        className="block"
        />
        {isFocused && (
          <ImageResizer
            editor={editor}
            buttonRef={buttonRef}
            imageRef={wrapperRef as unknown as { current: null | HTMLImageElement }}
            maxWidth={maxWidth}
            onResizeStart={() => setIsResizing(true)}
            onResizeEnd={(nextWidth, nextHeight) => {
              setTimeout(() => setIsResizing(false), 200)
              editor.update(() => {
                const node = $getNodeByKey(nodeKey)
                if (node instanceof YouTubeNode) {
                  node.setWidthAndHeight(nextWidth, nextHeight)
                }
              })
            }}
            showCaption={false}
            setShowCaption={() => {}}
            captionsEnabled={false}
          />
        )}
      </div>
    </BlockWithAlignableContents>
  )
}

export type SerializedYouTubeNode = Spread<
  {
    videoID: string
    width?: number
    height?: number
    maxWidth?: number
  },
  SerializedDecoratorBlockNode
>

function $convertYoutubeElement(
  domNode: HTMLElement
): null | DOMConversionOutput {
  const videoID = domNode.getAttribute("data-lexical-youtube")
  if (videoID) {
    const node = $createYouTubeNode(videoID)
    return { node }
  }
  return null
}

export class YouTubeNode extends DecoratorBlockNode {
  __id: string
  __width: "inherit" | number
  __height: "inherit" | number
  __maxWidth: number

  static getType(): string {
    return "youtube"
  }

  static clone(node: YouTubeNode): YouTubeNode {
    return new YouTubeNode(
      node.__id,
      node.__format,
      node.__width,
      node.__height,
      node.__maxWidth,
      node.__key
    )
  }

  static importJSON(serializedNode: SerializedYouTubeNode): YouTubeNode {
    const node = $createYouTubeNode(
      serializedNode.videoID,
      serializedNode.width,
      serializedNode.height,
      serializedNode.maxWidth ?? 640
    )
    node.setFormat(serializedNode.format)
    return node
  }

  exportJSON(): SerializedYouTubeNode {
    return {
      ...super.exportJSON(),
      type: "youtube",
      version: 1,
      videoID: this.__id,
      width: this.__width === "inherit" ? undefined : (this.__width as number),
      height:
        this.__height === "inherit" ? undefined : (this.__height as number),
      maxWidth: this.__maxWidth,
    }
  }

  constructor(
    id: string,
    format?: ElementFormatType,
    width?: "inherit" | number,
    height?: "inherit" | number,
    maxWidth: number = 640,
    key?: NodeKey
  ) {
    super(format, key)
    this.__id = id
    this.__width = width ?? "inherit"
    this.__height = height ?? "inherit"
    this.__maxWidth = maxWidth
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("iframe")
    element.setAttribute("data-lexical-youtube", this.__id)
    if (typeof this.__width === "number") {
      element.setAttribute("width", String(this.__width))
    }
    if (typeof this.__height === "number") {
      element.setAttribute("height", String(this.__height))
    }
    element.setAttribute(
      "src",
      `https://www.youtube-nocookie.com/embed/${this.__id}`
    )
    element.setAttribute("frameborder", "0")
    element.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    )
    element.setAttribute("allowfullscreen", "true")
    element.setAttribute("title", "YouTube video")
    return { element }
  }

  static importDOM(): DOMConversionMap | null {
    return {
      iframe: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-youtube")) {
          return null
        }
        return {
          conversion: $convertYoutubeElement,
          priority: 1,
        }
      },
    }
  }

  updateDOM(): false {
    return false
  }

  getId(): string {
    return this.__id
  }

  getTextContent(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _includeInert?: boolean | undefined,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _includeDirectionless?: false | undefined
  ): string {
    return `https://www.youtube.com/watch?v=${this.__id}`
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {}
    const className = {
      base: embedBlockTheme.base || "",
      focus: embedBlockTheme.focus || "",
    }
    return (
      <YouTubeComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        videoID={this.__id}
        width={this.__width}
        height={this.__height}
        maxWidth={this.__maxWidth}
        editor={_editor}
      />
    )
  }

  setWidthAndHeight(width: "inherit" | number, height: "inherit" | number) {
    const writable = this.getWritable()
    writable.__width = width
    writable.__height = height
  }
}

export function $createYouTubeNode(
  videoID: string,
  width?: number,
  height?: number,
  maxWidth?: number
): YouTubeNode {
  return new YouTubeNode(videoID, undefined, width, height, maxWidth)
}

export function $isYouTubeNode(
  node: YouTubeNode | LexicalNode | null | undefined
): node is YouTubeNode {
  return node instanceof YouTubeNode
}
