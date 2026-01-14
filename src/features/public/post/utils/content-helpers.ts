interface LexicalNodeLike {
  type: string
  src?: string
  text?: string
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

/**
 * Ước tính thời gian đọc dựa trên số lượng từ trong nội dung Lexical
 * @param content Nội dung Lexical (SerializedEditorState)
 * @returns Số phút đọc ước tính
 */
export function estimateReadingTime(content: { root: LexicalNodeLike }): number {
  if (!content || !content.root) return 0;

  let textContent = "";
  
  function extractText(node: LexicalNodeLike) {
    if (node.text) {
      textContent += node.text + " ";
    }
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(extractText);
    }
  }

  extractText(content.root);
  
  const wordsPerMinute = 200;
  const words = textContent.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  
  return minutes || 1;
}
