// scripts/activate-products.ts
import { prisma } from "@/lib/prisma"

async function activateProducts() {
  try {
    const updated = await prisma.product.updateMany({
      where: { status: "DRAFT" },
      data: { status: "ACTIVE" },
    })

    console.log(`✅ ${updated.count} produits activés`)
  } catch (err) {
    console.error("❌ Failed to activate products:", err)
  } finally {
    process.exit(0)
  }
}

activateProducts()
