"use client";

// Helper function để chuyển đổi CSS variable sang màu hex/rgb
export const getComputedColor = (cssVar: string): string => {
  if (typeof window === "undefined") return "#3b82f6";
  
  // Nếu đã là màu HSL, hex hoặc rgb, trả về trực tiếp
  if (cssVar.startsWith("hsl(") || cssVar.startsWith("#") || cssVar.startsWith("rgb")) {
    return cssVar;
  }
  
  // Xử lý CSS variable
  const varName = cssVar.startsWith("var(") 
    ? cssVar.replace("var(", "").replace(")", "").trim()
    : cssVar;
  
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (value) return value;
  
  // Fallback colors nếu không lấy được từ CSS variable
  const fallbackColors: Record<string, string> = {
    "var(--chart-1)": "#3d5a9e",
    "var(--chart-2)": "#c9444f",
    "var(--chart-3)": "#6b6b6b",
    "var(--chart-4)": "#6b8cae",
    "var(--chart-5)": "#e57580",
  };
  
  return fallbackColors[cssVar] || "#3b82f6";
};
