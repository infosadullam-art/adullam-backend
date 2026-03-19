import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

/**
 * 🔒 Sécurisation de DATABASE_URL
 * - Vérifie qu’elle existe
 * - Force le type string
 */
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL || typeof DATABASE_URL !== "string") {
  throw new Error("❌ DATABASE_URL is missing or not a string")
}

/**
 * 🧠 Pool PostgreSQL
 * - Compatible Prisma 7 + adapter-pg
 * - Support SSL (Supabase / Railway / Neon)
 */
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : undefined,
})

/**
 * 🔌 Prisma PG Adapter
 */
const adapter = new PrismaPg(pool)

/**
 * ♻️ Singleton Prisma (anti hot-reload crash)
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

export default prisma
