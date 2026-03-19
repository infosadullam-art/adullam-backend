import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Fonction utilitaire pour générer un slug propre
function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

async function processBatch(batchId: string) {
  const batch = await prisma.importBatch.findUnique({
    where: { id: batchId },
    include: { rawProducts: true },
  })

  if (!batch) {
    console.log(`Batch ${batchId} introuvable`)
    return
  }

  console.log(`Traitement du batch ${batch.id}...`)

  let processed = 0
  let failed = 0

  for (const raw of batch.rawProducts) {
    try {
      // 🔹 Upsert CleanProduct
      const clean = await prisma.cleanProduct.upsert({
        where: { rawProductId: raw.id },
        update: {},
        create: {
          rawProductId: raw.id,
          cleanedTitle: raw.rawTitle,
          cleanedDesc: raw.rawDescription || '',
          seoKeywords: [],
          cleanedImages: raw.rawImages,
        },
      })

      // 🔹 Vérifier si le produit existe déjà
      let product = await prisma.product.findFirst({
        where: {
          cleanProduct: { id: clean.id },
        },
      })

      if (!product) {
        const baseSlug = slugify(clean.cleanedTitle)
        const uniqueSlug = `${baseSlug}-${clean.id.slice(-6)}`

        product = await prisma.product.create({
          data: {
            title: clean.cleanedTitle,
            slug: uniqueSlug, // ✅ slug unique garanti
            price: raw.rawPrice || 0,
            currency: raw.rawCurrency || 'XOF',
            images: clean.cleanedImages,
            status: 'ACTIVE',
            sku: `SKU-${clean.id}`, // ✅ SKU obligatoire
            cleanProduct: { connect: { id: clean.id } },
          },
        })
      }

      // 🔹 Vérifier ou créer GraphNode
      const nodeExists = await prisma.graphNode.findFirst({
        where: { type: 'PRODUCT', entityId: clean.id },
      })

      if (!nodeExists) {
        await prisma.graphNode.create({
          data: { type: 'PRODUCT', entityId: clean.id },
        })
      }

      console.log(`Produit créé ou existant : ${product.title}`)
      processed++
    } catch (err: any) {
      console.error(`Erreur produit "${raw.rawTitle}" :`, err.message)
      failed++
    }
  }

  // 🔹 Finaliser le batch
  await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      status: 'COMPLETED',
      processed,
      failed,
      completedAt: new Date(),
    },
  })

  console.log(`Batch terminé ! Processed: ${processed}, Failed: ${failed}`)
}

async function main() {
  console.log('Worker démarré, écoute des batches PENDING...')

  while (true) {
    const batch = await prisma.importBatch.findFirst({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    })

    if (!batch) {
      await new Promise((r) => setTimeout(r, 5000))
      continue
    }

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: { status: 'PROCESSING', startedAt: new Date() },
    })

    await processBatch(batch.id)
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
