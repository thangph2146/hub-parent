"use client"

import { createContext, useContext } from "react"

export const PriorityImageContext = createContext<string | null>(null)

export const usePriorityImage = () => useContext(PriorityImageContext)
