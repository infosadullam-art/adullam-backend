// scripts/approve-today-clean-products.ts
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { DbService } from "../importer/db/db-service"

// ⭐ Adapter PostgreSQL pour Node.js 24
const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter, // ✅ Requis pour engineType = "client"
  log: ["info", "warn", "error"],
})

const db = new DbService(prisma)

async function approveTodayCleanProducts() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const cleanProducts = await prisma.cleanProduct.findMany({
      where: {
        isApproved: false,
        createdAt: { gte: today }
      },
      include: { rawProduct: true }
    })

    console.log(`📦 Found ${cleanProducts.length} clean products`)
    
    // ... reste du code inchangé ...
    
  } finally {
    await prisma.$disconnect()
  }
}

approveTodayCleanProducts()