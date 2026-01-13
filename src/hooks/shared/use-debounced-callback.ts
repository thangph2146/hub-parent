/**
 * Lightweight debounced callback hook
 * Returns a stable debounced function with a cancel method
 * Follows React best practices for cleanup
 */
"use client"

import { useEffect, useMemo, useRef } from "react"

type DebouncedFn<Args extends unknown[]> = ((...args: Args) => void) & {
  cancel: () => void
}

export const useDebouncedCallback = <Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number
): DebouncedFn<Args> => {
  const callbackRef = useRef(callback)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const debounced = useMemo(() => {
    const fn = ((...args: Args) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    }) as DebouncedFn<Args>

    fn.cancel = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    return fn
  }, [delay])

  useEffect(() => () => debounced.cancel(), [debounced])

  return debounced
}

