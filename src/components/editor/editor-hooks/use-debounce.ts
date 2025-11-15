import { useEffect, useMemo, useRef } from "react"
import { debounce } from "lodash"

export function useDebounce<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
  maxWait?: number
) {
  const funcRef = useRef<T>(fn)
  
  // Update ref in effect to avoid accessing refs during render
  useEffect(() => {
    funcRef.current = fn
  }, [fn])

  return useMemo(
    () => {
      // Create a stable reference to the current function
      const callFn = (...args: Parameters<T>) => {
        // Accessing ref in debounced callback is safe - it's called asynchronously, not during render
        // The ref is updated in useEffect, and this callback only runs asynchronously via debounce
        // eslint-disable-next-line react-hooks/rules-of-hooks
        funcRef.current(...args)
      }
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return debounce(callFn, ms, { maxWait })
    },
    [ms, maxWait]
  )
}
