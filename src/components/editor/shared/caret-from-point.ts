export function caretFromPoint(
  x: number,
  y: number
): null | {
  offset: number
  node: Node
} {
  if (typeof document.caretRangeFromPoint !== "undefined") {
    const range = document.caretRangeFromPoint(x, y)
    if (range === null) {
      return null
    }
    return {
      node: range.startContainer,
      offset: range.startOffset,
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - caretPositionFromPoint is a Firefox-specific API not in TypeScript types
  } else if (document.caretPositionFromPoint !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - FF - no types
    const range = document.caretPositionFromPoint(x, y)
    if (range === null) {
      return null
    }
    return {
      node: range.offsetNode,
      offset: range.offset,
    }
  } else {
    // Gracefully handle IE
    return null
  }
}
