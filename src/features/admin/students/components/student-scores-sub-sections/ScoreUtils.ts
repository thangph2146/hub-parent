/**
 * Format điểm số với màu sắc
 */
export const formatScore = (score: number | null, type: "10" | "4" = "10"): { text: string; color: string } => {
  if (score === null || score === undefined) {
    return { text: "—", color: "text-muted-foreground" };
  }

  if (type === "10") {
    if (score >= 8.5) return { text: score.toFixed(1), color: "text-green-600 dark:text-green-400" };
    if (score >= 7.0) return { text: score.toFixed(1), color: "text-blue-600 dark:text-blue-400" };
    if (score >= 5.5) return { text: score.toFixed(1), color: "text-yellow-600 dark:text-yellow-400" };
    return { text: score.toFixed(1), color: "text-red-600 dark:text-red-400" };
  } else {
    if (score >= 3.5) return { text: score.toFixed(1), color: "text-green-600 dark:text-green-400" };
    if (score >= 2.5) return { text: score.toFixed(1), color: "text-blue-600 dark:text-blue-400" };
    if (score >= 2.0) return { text: score.toFixed(1), color: "text-yellow-600 dark:text-yellow-400" };
    return { text: score.toFixed(1), color: "text-red-600 dark:text-red-400" };
  }
};

/**
 * Format điểm chữ
 */
export const formatGrade = (grade: string | null): { text: string; color: string } => {
  if (!grade) {
    return { text: "—", color: "text-muted-foreground" };
  }

  const gradeColors: Record<string, string> = {
    "A+": "text-green-600 dark:text-green-400",
    "A": "text-green-600 dark:text-green-400",
    "A-": "text-green-600 dark:text-green-400",
    "B+": "text-blue-600 dark:text-blue-400",
    "B": "text-blue-600 dark:text-blue-400",
    "B-": "text-blue-600 dark:text-blue-400",
    "C+": "text-yellow-600 dark:text-yellow-400",
    "C": "text-yellow-600 dark:text-yellow-400",
    "C-": "text-yellow-600 dark:text-yellow-400",
    "D+": "text-orange-600 dark:text-orange-400",
    "D": "text-red-600 dark:text-red-400",
    "F": "text-red-600 dark:text-red-400",
  };

  return {
    text: grade,
    color: gradeColors[grade] || "text-muted-foreground",
  };
};
