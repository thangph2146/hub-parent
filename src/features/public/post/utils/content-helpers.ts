interface LexicalNodeLike {
  type: string
  src?: string
  children?: LexicalNodeLike[]
}

export function findFirstImageSrc(node: LexicalNodeLike): string | null {
  if (!node) return null;
  if (node.type === "image" && node.src) {
    return node.src;
  }
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      const src = findFirstImageSrc(child);
      if (src) return src;
    }
  }
  return null;
}
