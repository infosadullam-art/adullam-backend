console.log("🚀 importMarketplace.ts démarré");

// workers/importMarketplace.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Nettoyage texte pour SEO
function cleanText(text?: string) {
  return text?.trim().replace(/\s+/g, " ") || "";
}

// Génération slug unique
function generateSlug(title: string, id: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 50) +
    "-" +
    id.slice(-6)
  );
}

// Simulation API Marketplace
async function fetchMarketplaceProducts() {
  console.log("🔹 fetchMarketplaceProducts appelé");
  return [
    {
      rawProductId: "aliex-001",
      title: "Produit AliExpress Extra Long Inutile pour SEO",
      description: "Description propre pour SEO et ventes",
      price: 120,
      currency: "XOF",
      images: ["https://via.placeholder.com/300"],
      weight: 500,
      category: "Electronics",
    },
    {
      rawProductId: "aliba-002",
      title: "Produit Alibaba Exemple",
      description: "Description propre",
      price: 80,
      currency: "XOF",
      images: ["https://via.placeholder.com/300"],
      weight: 0, // poids incorrect -> corrigé
      category: "Home",
    },
  ];
}

export async function importMarketplace() {
  console.log("🔹 importMarketplace démarré");
  const rawProducts = await fetchMarketplaceProducts();
  console.log("🔹 Produits récupérés :", rawProducts.length);

  if (rawProducts.length === 0) {
    console.log("⚠️ Aucun produit récupéré, vérifie fetchMarketplaceProducts");
    return;
  }

  for (const raw of rawProducts) {
    const safeWeight = typeof raw.weight === "number" && raw.weight > 0 ? raw.weight : 1;

    const cleanedTitle = cleanText(raw.title);
    const cleanedDesc = cleanText(raw.description);

    console.log(`🔹 Traitement produit : ${cleanedTitle} | poids=${safeWeight}`);

    // ------------------- CleanProduct -------------------
    const clean = await prisma.cleanProduct.upsert({
      where: { rawProductId: raw.rawProductId },
      update: {
        cleanedTitle,
        cleanedDesc,
        cleanedImages: raw.images,
      },
      create: {
        rawProductId: raw.rawProductId,
        cleanedTitle,
        cleanedDesc,
        seoKeywords: [],
        cleanedImages: raw.images,
        mockupImages: [],
      },
    });
    console.log(`✅ CleanProduct ok : ${clean.id}`);

    // ------------------- Category -------------------
    const categorySlug = raw.category
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      update: { name: raw.category },
      create: { name: raw.category, slug: categorySlug },
    });
    console.log(`✅ Category ok : ${category.name}`);

    // ------------------- Product -------------------
    const product = await prisma.product.upsert({
      where: { cleanProductId: clean.id },
      update: {
        weight: safeWeight,
        price: raw.price,
        images: raw.images,
        status: "ACTIVE",
      },
      create: {
        title: cleanedTitle,
        slug: generateSlug(cleanedTitle, clean.id),
        sku: `SKU-${clean.id.slice(-8)}`,
        price: raw.price,
        currency: raw.currency,
        images: raw.images,
        mockupImages: [],
        weight: safeWeight,
        status: "ACTIVE",
        cleanProduct: { connect: { id: clean.id } },
        category: { connect: { id: category.id } },
      },
    });
    console.log(`✅ Product ok : ${product.title} | poids=${product.weight}`);

    // ------------------- GraphNode -------------------
    await prisma.graphNode.upsert({
      where: {
        type_entityId: {
          type: "PRODUCT",
          entityId: product.id,
        },
      },
      update: {},
      create: {
        type: "PRODUCT",
        entityId: product.id,
      },
    });
    console.log(`✅ GraphNode ok pour ${product.title}`);
  }

  console.log("🎉 Import marketplace terminé ✅");
}

// --- Appel direct pour ts-node ---
if (require.main === module) {
  importMarketplace()
    .then(() => {
      console.log("✔️ Script terminé avec succès");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Erreur dans importMarketplace :", err);
      process.exit(1);
    });
}
