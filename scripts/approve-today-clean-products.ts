// scripts/approve-today-clean-products.ts
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { DbService } from "../importer/db/db-service" // ⭐ Chemin relatif !

// ⭐ Initialisation correcte de Prisma pour Node.js
const prisma = new PrismaClient({
  log: ["info", "warn", "error"],
})

// ⭐ Passage explicite du client Prisma au DbService
const db = new DbService(prisma)

async function approveTodayCleanProducts() {
  try {
    // 🔒 Aujourd'hui à 00:00
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    console.log(`📅 Date: ${today.toISOString().split('T')[0]}`)

    // 1️⃣ Récupérer les clean products d'aujourd'hui non approuvés
    const cleanProducts = await prisma.cleanProduct.findMany({
      where: {
        isApproved: false,
        createdAt: {
          gte: today,
        },
      },
      include: {
        rawProduct: true,
      },
    })

    console.log(`📦 Found ${cleanProducts.length} clean products to approve`)

    if (cleanProducts.length === 0) {
      console.log("✅ No products to approve today.")
      process.exit(0)
    }

    let approvedCount = 0
    let productCreatedCount = 0

    for (const clean of cleanProducts) {
      try {
        console.log(`\n🔄 Processing clean product: ${clean.id}`)
        
        // 2️⃣ Approuver
        await prisma.cleanProduct.update({
          where: { id: clean.id },
          data: {
            isApproved: true,
            approvedAt: new Date(),
            approvedBy: "AUTO_APPROVE_TODAY",
          },
        })
        approvedCount++
        console.log(`   ✅ Approved`)

        // 3️⃣ Catégorie auto
        let categoryId: string | undefined = undefined
        if (clean.suggestedCat) {
          try {
            categoryId = await db.getOrCreateCategory(clean.suggestedCat)
            console.log(`   📁 Category: ${clean.suggestedCat} -> ${categoryId}`)
          } catch (catError) {
            console.error(`   ⚠️ Failed to create category: ${clean.suggestedCat}`, catError)
          }
        }

        // 4️⃣ Extraire le poids du rawProduct
        let weight = 0
        if (clean.rawProduct) {
          weight = (clean.rawProduct as any).weight || 0
        }

        // 5️⃣ Créer le product final
        const productId = await db.createFinalProduct(
          clean.id,
          {
            ...clean,
            suggestedCat: categoryId,
          } as any,
          weight,
          100 // stock par défaut
        )

        if (!productId) {
          console.error(`   ❌ Failed to create product for cleanProduct ${clean.id}`)
          continue
        }

        productCreatedCount++
        console.log(`   ✅ Product created: ${productId}`)

      } catch (error) {
        console.error(`   ❌ Error processing cleanProduct ${clean.id}:`, error)
        continue
      }
    }

    console.log("\n" + "=".repeat(50))
    console.log("🎉 APPROVAL COMPLETE")
    console.log("=".repeat(50))
    console.log(`📦 Clean products found:    ${cleanProducts.length}`)
    console.log(`✅ Clean products approved:  ${approvedCount}`)
    console.log(`🆕 Products created:        ${productCreatedCount}`)
    console.log("=".repeat(50))

  } catch (error) {
    console.error("❌ Fatal error:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécution avec gestion d'erreurs
approveTodayCleanProducts()
  .then(() => {
    console.log("\n✨ Script completed successfully")
    process.exit(0)
  })
  .catch(err => {
    console.error("\n💥 Script failed:", err)
    process.exit(1)
  })