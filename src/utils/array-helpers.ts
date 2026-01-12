/**
 * Array utility functions for common operations
 * Shared across the codebase to reduce duplication
 */

/**
 * Deduplicate array by a key function
 * @param array - Array to deduplicate
 * @param getKey - Function to get unique key from item
 * @returns Deduplicated array
 */
export function deduplicateBy<T>(
  array: T[],
  getKey: (item: T) => string | number
): T[] {
  const seen = new Set<string | number>();
  const result: T[] = [];
  
  for (const item of array) {
    const key = getKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  
  return result;
}

/**
 * Deduplicate array by id property (common pattern)
 */
export function deduplicateById<T extends { id: string | number }>(
  array: T[]
): T[] {
  return deduplicateBy(array, (item) => item.id);
}

/**
 * Get duplicate IDs from array
 */
export function getDuplicateIds<T extends { id: string | number }>(
  array: T[]
): Set<string | number> {
  const seen = new Set<string | number>();
  const duplicates = new Set<string | number>();
  
  for (const item of array) {
    if (seen.has(item.id)) {
      duplicates.add(item.id);
    } else {
      seen.add(item.id);
    }
  }
  
  return duplicates;
}

/**
 * Compare two arrays for deep equality
 * More efficient than JSON.stringify for simple arrays
 */
export function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      // For nested arrays/objects, fallback to JSON.stringify
      if (Array.isArray(a[i]) && Array.isArray(b[i])) {
        if (!arraysEqual(a[i] as unknown as T[], b[i] as unknown as T[])) {
          return false;
        }
      } else if (typeof a[i] === "object" && typeof b[i] === "object" && a[i] !== null && b[i] !== null) {
        if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) {
          return false;
        }
      } else {
        return false;
      }
    }
  }
  return true;
}
