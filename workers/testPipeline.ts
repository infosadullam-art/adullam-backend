import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1️⃣ Créer un batch test
  const batch = await prisma.importBatch.create({
    data: {
      source: 'ALIEXPRESS',
      totalItems: 3,
      status: 'PENDING',
      rawProducts: {
        create: [
          {
            rawTitle: 'Produit Test 1',
            rawDescription: 'Description du produit test 1',
            rawPrice: 100,
            rawCurrency: 'XOF',
            rawImages: ['https://via.placeholder.com/150'],
          },
          {
            rawTitle: 'Produit Test 2',
            rawDescription: 'Description du produit test 2',
            rawPrice: 200,
            rawCurrency: 'XOF',
            rawImages: ['https://via.placeholder.com/150'],
          },
          {
            rawTitle: 'Produit Test 3',
            rawDescription: 'Description du produit test 3',
            rawPrice: 300,
            rawCurrency: 'XOF',
            rawImages: ['https://via.placeholder.com/150'],
          },
        ],
      },
    },
    include: { rawProducts: true },
  });

  console.log('Batch créé avec ID :', batch.id);

  // 2️⃣ Pipeline RAW → CLEAN → PRODUCT → GRAPH
  for (const raw of batch.rawProducts) {

    // 🔹 CLEAN PRODUCT (1–1 avec RawProduct)
    const clean = await prisma.cleanProduct.create({
      data: {
        rawProductId: raw.id,
        cleanedTitle: raw.rawTitle,
        cleanedDesc: raw.rawDescription ?? '',
        seoKeywords: [],
        cleanedImages: raw.rawImages,
      },
    });

    // 🔹 SKU OBLIGATOIRE
    const sku = `SKU-${clean.id}`;

    // 🔹 SLUG UNIQUE GARANTI
    const slug = `${clean.id}-${clean.cleanedTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}`;

    // 🔹 PRODUCT (CONNECT via relation, PAS cleanProductId)
    const product = await prisma.product.create({
      data: {
        title: clean.cleanedTitle,
        slug,
        price: raw.rawPrice ?? 0,
        currency: raw.rawCurrency ?? 'XOF',
        images: clean.cleanedImages,
        status: 'ACTIVE',
        sku,
        cleanProduct: {
          connect: { id: clean.id },
        },
      },
    });

    // 🔹 GRAPH NODE (clé unique logique)
    await prisma.graphNode.create({
      data: {
        type: 'PRODUCT',
        entityId: clean.id,
      },
    });

    console.log(`Produit créé : ${product.title}`);
  }

  // 3️⃣ Finaliser batch
  await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      status: 'COMPLETED',
      processed: batch.rawProducts.length,
      completedAt: new Date(),
    },
  });

  console.log('Batch terminé !');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
