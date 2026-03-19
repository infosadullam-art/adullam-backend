import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function createBatch(batchNumber: number, itemsCount = 3) {
  // Créer un batch avec un ID unique basé sur le numéro
  const batchId = `TEST_BATCH_${batchNumber}`;

  // Vérifier si le batch existe déjà
  const existing = await prisma.importBatch.findUnique({
    where: { id: batchId },
  });

  if (existing) {
    console.log(`Batch ${batchId} existe déjà, skipping...`);
    return;
  }

  const rawProductsData = Array.from({ length: itemsCount }, (_, i) => ({
    rawTitle: `Produit Test ${batchNumber}-${i + 1}`,
    rawDescription: `Description du produit test ${batchNumber}-${i + 1}`,
    rawPrice: (i + 1) * 100,
    rawCurrency: 'XOF',
    rawImages: ['https://via.placeholder.com/150'],
  }));

  const batch = await prisma.importBatch.create({
    data: {
      id: batchId,
      source: 'ALIEXPRESS',
      totalItems: itemsCount,
      status: 'PENDING',
      rawProducts: {
        create: rawProductsData,
      },
    },
    include: { rawProducts: true },
  });

  console.log(`Batch créé : ${batch.id} avec ${batch.rawProducts.length} produits`);
}

async function main() {
  // Exemple : créer 5 batches de test
  for (let i = 1; i <= 5; i++) {
    await createBatch(i, 3); // 3 produits par batch
  }

  console.log('Tous les batches ont été créés.');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
