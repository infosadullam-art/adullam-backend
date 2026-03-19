import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Fonction pour générer un SKU simple
function generateSKU(title: string) {
  return title.toUpperCase().replace(/\s+/g, '-') + '-' + Date.now();
}

// Fonction pour générer un slug unique
async function generateSlug(title: string) {
  let baseSlug = title.toLowerCase().replace(/\s+/g, '-');
  let slug = baseSlug;
  let count = 1;

  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${count}`;
    count++;
  }
  return slug;
}

async function processBatch(batchId: string) {
  const batch = await prisma.importBatch.findUnique({
    where: { id: batchId },
    include: { rawProducts: true },
  });

  if (!batch) return console.log(`Batch ${batchId} introuvable`);
  if (batch.status !== 'PENDING') return console.log(`Batch ${batchId} déjà traité`);

  // Marquer le batch comme PROCESSING
  await prisma.importBatch.update({
    where: { id: batch.id },
    data: { status: 'PROCESSING', startedAt: new Date() },
  });

  let processed = 0;
  let failed = 0;

  for (const raw of batch.rawProducts) {
    try {
      // Créer CleanProduct minimal
      const clean = await prisma.cleanProduct.create({
        data: {
          rawProductId: raw.id,
          cleanedTitle: raw.rawTitle,
          cleanedDesc: raw.rawDescription || '',
          seoKeywords: [],
          cleanedImages: raw.rawImages,
        },
      });

      // Créer Product actif minimal
      const product = await prisma.product.create({
        data: {
          cleanProductId: clean.id,
          sku: generateSKU(clean.cleanedTitle),
          title: clean.cleanedTitle,
          slug: await generateSlug(clean.cleanedTitle),
          price: raw.rawPrice || 0,
          currency: raw.rawCurrency || 'XOF',
          images: clean.cleanedImages,
          status: 'ACTIVE',
        },
      });

      // Créer GraphNode minimal
      await prisma.graphNode.create({
        data: { type: 'PRODUCT', entityId: clean.id },
      });

      processed++;
      console.log(`Produit créé : ${product.title}`);
    } catch (error) {
      failed++;
      console.error(`Erreur produit "${raw.rawTitle}":`, error);
    }
  }

  // Mettre à jour le batch avec les stats finales
  await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      status: failed === 0 ? 'COMPLETED' : 'FAILED',
      processed,
      failed,
      completedAt: new Date(),
    },
  });

  console.log(`Batch terminé ! Processed: ${processed}, Failed: ${failed}`);
}

async function main() {
  // Récupérer tous les batches PENDING
  const pendingBatches = await prisma.importBatch.findMany({
    where: { status: 'PENDING' },
  });

  if (pendingBatches.length === 0) return console.log('Aucun batch PENDING à traiter');

  for (const batch of pendingBatches) {
    console.log(`Traitement du batch ${batch.id}...`);
    await processBatch(batch.id);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
