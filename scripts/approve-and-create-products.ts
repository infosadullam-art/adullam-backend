// scripts/approve-and-create-products.ts
import { config } from "dotenv"
import { PrismaClient } from "@prisma/client"

// Charger les variables d'environnement
config()

console.log("📦 DATABASE_URL:", process.env.DATABASE_URL ? "✅ trouvée" : "❌ non trouvée")

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL n'est pas définie dans .env")
  process.exit(1)
}

// ⭐ Création SIMPLE du client Prisma
const prisma = new PrismaClient()

async function approveAndCreateProducts() {
  console.log("🚀 Début du traitement...")
  
  try {
    // Test de connexion
    await prisma.$connect()
    console.log("✅ Connecté à la base de données")
    
    // 1️⃣ Récupère les CleanProduct non approuvés AVEC leurs variantes
    const cleanProducts = await prisma.cleanProduct.findMany({
      where: { 
        isApproved: false,
        product: null
      },
      include: {
        variants: true
      }
    })

    console.log(`📦 ${cleanProducts.length} produits trouvés`)

    if (cleanProducts.length === 0) {
      console.log("✅ Aucun produit à traiter")
      return
    }

    let successCount = 0
    let errorCount = 0

    for (const clean of cleanProducts) {
      try {
        console.log(`\n🔄 Traitement: ${clean.cleanedTitle}`)
        console.log(`   📊 ${clean.variants.length} variantes`)
        
        // 2️⃣ Créer le slug
        const slug = clean.cleanedTitle
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') + '-' + Date.now()

        // 3️⃣ Créer le produit final avec ses variantes
        const product = await prisma.product.create({
          data: {
            cleanProductId: clean.id,
            sku: `ADU-${clean.id.slice(-8)}`,
            title: clean.cleanedTitle,
            slug: slug,
            description: clean.cleanedDesc,
            price: clean.suggestedPrice || 0,
            currency: "USD",
            images: clean.cleanedImages,
            mockupImages: clean.mockupImages || [],
            categoryId: clean.suggestedCat,
            tags: clean.seoKeywords || [],
            stock: 100,
            status: "ACTIVE",
            weight: 0.5,
            variants: {
              create: clean.variants.map(v => ({
                sku: v.externalSkuId,
                name: v.name || "Option",
                price: v.price || clean.suggestedPrice || 0,
                currency: v.currency || "USD",
                stock: v.stock || 100,
                weight: v.weight,
                attributes: v.attributes || {},
                image: v.image,
                sortOrder: 0
              }))
            }
          },
          include: {
            variants: true
          }
        })

        // 4️⃣ Marquer le CleanProduct comme approuvé
        await prisma.cleanProduct.update({
          where: { id: clean.id },
          data: {
            isApproved: true,
            approvedAt: new Date()
          }
        })

        console.log(`   ✅ Produit créé: ${product.id} avec ${product.variants.length} variantes`)
        successCount++

      } catch (error) {
        console.error(`   ❌ Erreur pour ${clean.id}:`, error)
        errorCount++
      }
    }

    console.log("\n" + "=".repeat(50))
    console.log("📊 RÉSULTATS FINAUX")
    console.log("=".repeat(50))
    console.log(`✅ Réussis: ${successCount}`)
    console.log(`❌ Échecs: ${errorCount}`)
    console.log("=".repeat(50))

  } catch (error) {
    console.error("❌ Erreur de connexion à la base:", error)
  } finally {
    await prisma.$disconnect()
  }
}

approveAndCreateProducts()
  .catch(console.error)