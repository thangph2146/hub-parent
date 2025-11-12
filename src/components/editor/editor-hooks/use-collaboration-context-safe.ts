/**
 * Safe wrapper for useCollaborationContext
 * Returns default values if collaboration context is not available
 * 
 * Since we don't use collaboration features in this app, we simply return
 * the default value without attempting to access the context.
 */
"use client"

/**
 * Safely get collaboration context
 * Returns default values since collaboration is not enabled in this app
 */
export function useCollaborationContextSafe(): { isCollabActive: boolean } {
  // Return default value - collaboration is not used in this app
  return { isCollabActive: false }
}

