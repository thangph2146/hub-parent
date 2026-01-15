/**
 * Prisma Client singleton
 */
import "server-only"
import { PrismaClient } from "@prisma/client/index"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

let connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in environment variables")
}

// Ensure sslmode=verify-full to avoid SECURITY WARNING with pg driver
if (connectionString.includes("sslmode=require")) {
  connectionString = connectionString.replace("sslmode=require", "sslmode=verify-full")
} else if (!connectionString.includes("sslmode=")) {
  const separator = connectionString.includes("?") ? "&" : "?"
  connectionString = `${connectionString}${separator}sslmode=verify-full`
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
