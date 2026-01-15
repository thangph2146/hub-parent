import { useState, useRef, useEffect, useTransition } from "react"
import type { DataTableLoader, DataTableResult, DataTableQueryState } from "../types"

export interface UseDataTableLoaderOptions<T extends object> {
    loader: DataTableLoader<T>
    query: DataTableQueryState
    refreshKey?: number | string
    initialData?: DataTableResult<T>
}

export function useDataTableLoader<T extends object>({
    loader,
    query,
    refreshKey,
    initialData,
}: UseDataTableLoaderOptions<T>) {
    const [dataPromise, setDataPromise] = useState<Promise<DataTableResult<T>>>(() => {
        if (initialData) {
            return Promise.resolve(initialData)
        }
        const promise = safeLoad(loader, query)
        promise.finally(() => {
            // No-op, useEffect will handle initial state
        })
        return promise
    })
    const [isPending, startTransition] = useTransition()
    
    const prevQueryRef = useRef<DataTableQueryState>(query)
    const prevRefreshKeyRef = useRef<string | number | undefined>(undefined)
    const prevLoaderRef = useRef<DataTableLoader<T> | undefined>(undefined)
    const prevInitialDataRef = useRef<DataTableResult<T> | undefined>(initialData)
    const isFirstMountRef = useRef(true)
    const [isFetching, setIsFetching] = useState(!initialData)
    const lastFetchTimeRef = useRef(0)

    useEffect(() => {
        const now = Date.now()
        const refreshKeyChanged = prevRefreshKeyRef.current !== refreshKey
        const loaderChanged = prevLoaderRef.current !== loader
        const initialDataChanged = prevInitialDataRef.current !== initialData

        if (isFetching && !refreshKeyChanged && !loaderChanged) {
            return
        }
        
        if (isFirstMountRef.current) {
            isFirstMountRef.current = false
            prevRefreshKeyRef.current = refreshKey
            prevQueryRef.current = query
            prevLoaderRef.current = loader
            prevInitialDataRef.current = initialData
            lastFetchTimeRef.current = initialData ? now : 0
            return
        }
        
        if (loaderChanged) {
            prevLoaderRef.current = loader
        }
        if (initialDataChanged) {
            prevInitialDataRef.current = initialData
        }

        const queryChanged = !areQueriesEqual(query, prevQueryRef.current)
        const timeSinceLastFetch = now - lastFetchTimeRef.current

        if (timeSinceLastFetch < 100 && queryChanged && !refreshKeyChanged && !loaderChanged) {
            prevQueryRef.current = query
            return
        }

        if (refreshKeyChanged) {
            prevRefreshKeyRef.current = refreshKey
        }
        
        if (initialDataChanged && initialData && !refreshKeyChanged) {
            prevQueryRef.current = query
            lastFetchTimeRef.current = Date.now()
            const clonedData: DataTableResult<T> = {
                ...initialData,
                rows: [...initialData.rows],
            }
            const newPromise = new Promise<DataTableResult<T>>((resolve) => {
                queueMicrotask(() => resolve(clonedData))
            })
            startTransition(() => {
                setDataPromise(newPromise)
            })
            return
        }
        
        if (loaderChanged) {
            prevQueryRef.current = query
            lastFetchTimeRef.current = Date.now()
            
            queueMicrotask(() => setIsFetching(true))
            const promise = safeLoad(loader, query)
            promise.finally(() => {
                setIsFetching(false)
            })
            startTransition(() => {
                setDataPromise(promise)
            })
            return
        }

        if (queryChanged || refreshKeyChanged || (initialDataChanged && !initialData)) {
            prevQueryRef.current = query
            lastFetchTimeRef.current = Date.now()
            
            queueMicrotask(() => setIsFetching(true))
            const promise = safeLoad(loader, query)
            promise.finally(() => {
                setIsFetching(false)
            })
            startTransition(() => {
                setDataPromise(promise)
            })
        }
    }, [loader, query, refreshKey, initialData, isFetching])

    return {
        dataPromise,
        isPending,
        isFetching,
    }
}

function areQueriesEqual(a: DataTableQueryState, b: DataTableQueryState) {
    if (a.page !== b.page) return false
    if (a.limit !== b.limit) return false
    if (a.search !== b.search) return false
    const keysA = Object.keys(a.filters)
    const keysB = Object.keys(b.filters)
    if (keysA.length !== keysB.length) return false
    return keysA.every((key) => a.filters[key] === b.filters[key])
}

function safeLoad<T extends object>(
    loader: DataTableLoader<T>,
    query: DataTableQueryState,
): Promise<DataTableResult<T>> {
    return loader(query).catch((error) => {
        if (error?.name === "CancelledError" || error?.message?.includes("CancelledError")) {
            return {
                rows: [],
                page: query.page,
                limit: query.limit,
                total: 0,
                totalPages: 0,
            }
        }
        console.error("[DataTable] Failed to load data", error)
        return {
            rows: [],
            page: query.page,
            limit: query.limit,
            total: 0,
            totalPages: 0,
        }
    })
}
