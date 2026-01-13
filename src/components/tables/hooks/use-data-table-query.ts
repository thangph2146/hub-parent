import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { useDebouncedCallback } from "@/hooks"
import type { DataTableQueryState } from "../types"

export interface UseDataTableQueryOptions {
    initialPage?: number
    initialLimit?: number
    initialFilters?: Record<string, string>
    availableLimits: number[]
}

export function useDataTableQuery({
    initialPage = 1,
    initialLimit,
    initialFilters,
    availableLimits,
}: UseDataTableQueryOptions) {
    const defaultFilters = useMemo(() => {
        const filters: Record<string, string> = {}
        if (initialFilters) {
            Object.entries(initialFilters).forEach(([key, value]) => {
                if (value != null && value !== "") {
                    filters[key] = value
                }
            })
        }
        return filters
    }, [initialFilters])

    const defaultQuery = useMemo<DataTableQueryState>(
        () => ({
            page: initialPage,
            limit: initialLimit ?? availableLimits[0],
            search: "",
            filters: defaultFilters,
        }),
        [initialPage, initialLimit, availableLimits, defaultFilters],
    )

    const [query, setQuery] = useState<DataTableQueryState>(defaultQuery)
    const [pendingTextFilters, setPendingTextFilters] = useState<Record<string, string>>(
        () => ({ ...defaultFilters }),
    )
    const prevPageRef = useRef<number | null>(null)

    // Scroll to top when page changes
    useEffect(() => {
        if (prevPageRef.current !== null && prevPageRef.current !== query.page) {
            window.scrollTo({ top: 0, behavior: "smooth" })
        }
        prevPageRef.current = query.page
    }, [query.page])

    const applyFilters = useCallback((filters: Record<string, string>) => {
        setQuery((prev) => {
            const keysPrev = Object.keys(prev.filters)
            const keysNext = Object.keys(filters)
            const same =
                keysPrev.length === keysNext.length &&
                keysNext.every((key) => prev.filters[key] === filters[key])
            if (same) {
                return prev
            }
            return {
                ...prev,
                page: 1,
                filters: { ...filters },
            }
        })
    }, [])

    const debouncedApplyFilters = useDebouncedCallback(applyFilters, 300)

    const handleFilterChange = (columnKey: string, value: string, immediate = false) => {
        setPendingTextFilters((prev) => {
            const next = { ...prev }
            if (!value) {
                delete next[columnKey]
            } else {
                next[columnKey] = value
            }
            if (immediate) {
                debouncedApplyFilters.cancel()
                applyFilters(next)
            } else {
                debouncedApplyFilters(next)
            }
            return next
        })
    }

    const handleLimitChange = (value: number) => {
        setQuery((prev) => ({
            ...prev,
            page: 1,
            limit: value,
        }))
    }

    const handlePageChange = (nextPage: number, totalPages?: number) => {
        setQuery((prev) => {
            const clampedTotalPages = totalPages ?? prev.page
            const safePage = Math.max(1, Math.min(nextPage, clampedTotalPages || 1))
            if (safePage === prev.page) {
                return prev
            }
            return {
                ...prev,
                page: safePage,
            }
        })
    }

    const handleResetFilters = () => {
        debouncedApplyFilters.cancel()
        setPendingTextFilters({})
        applyFilters({})
        setQuery((prev) => ({
            ...prev,
            page: 1,
            search: "",
            filters: {},
        }))
    }

    const hasAppliedFilters =
        query.search.trim().length > 0 ||
        Object.values(query.filters).some((value) => value && value.trim().length > 0)
    const hasPendingFilters = Object.values(pendingTextFilters).some(
        (value) => value && value.trim().length > 0,
    )
    const showClearFilters = hasAppliedFilters || hasPendingFilters

    return {
        query,
        setQuery,
        pendingTextFilters,
        setPendingTextFilters,
        handleFilterChange,
        handleLimitChange,
        handlePageChange,
        handleResetFilters,
        showClearFilters,
    }
}
