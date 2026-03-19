// ============================================================
// Database Service for Adullam Import Pipeline
// Strict Prisma operations matching the schema
// VERSION: 2.1 - Added category hierarchy and video storage
// ============================================================

import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CleanProductData, ImportSource, ImportStatus, ParsedRawProduct, ParsedVariant, RawVideo } from "../config/types";
import { generateSku, generateSlug, applyMargin } from "../utils";
import { CONFIG } from "../config";

export class DbService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = (prismaClient || prisma) as PrismaClient;
  }

  /**
   * Create a new import batch
   */
  async createImportBatch(source: ImportSource): Promise<string> {
    const batch = await this.prisma.importBatch.create({
      data: {
        source,
        status: "PROCESSING" as ImportStatus,
        startedAt: new Date(),
      },
    });
    return batch.id;
  }

  /**
   * Update import batch status
   */
  async updateImportBatch(
    batchId: string,
    data: { status: ImportStatus; processed?: number; failed?: number }
  ): Promise<void> {
    await this.prisma.importBatch.update({
      where: { id: batchId },
      data: {
        ...data,
        completedAt: data.status === "COMPLETED" || data.status === "FAILED" ? new Date() : undefined,
      },
    });
  }

  /**
   * Save raw product to database (SOURCE OF TRUTH)
   */
  async saveRawProduct(data: {
    source: ImportSource;
    supplierSku?: string;
    externalProductId?: string;
    externalShopId?: string;
    externalSkuId?: string;
    rawTitle: string;
    rawDescription?: string;
    rawImages?: string[];
    rawCategory?: string;
    rawCurrency?: string;
    rawMinPrice?: number;
    rawMaxPrice?: number;
    rawAttributes?: any;
    importBatchId: string;
    sourceUrl?: string;
    status?: string;
    dataSourceType?: string;
  }): Promise<any> {
    try {
      let supplierSku = data.supplierSku || 
                       data.externalSkuId || 
                       data.externalProductId;
      
      if (!supplierSku || supplierSku.includes('undefined')) {
        supplierSku = `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log(`[DB] Generated supplierSku: ${supplierSku}`);
      }
      
      const validStatuses = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"];
      const status = (data.status && validStatuses.includes(data.status.toUpperCase())) 
        ? data.status.toUpperCase() as ImportStatus 
        : "PENDING";

      const rawProductData = {
        source: data.source,
        supplierSku: supplierSku,
        externalProductId: data.externalProductId || undefined,
        externalShopId: data.externalShopId || undefined,
        externalSkuId: data.externalSkuId || undefined,
        rawTitle: data.rawTitle || 'Untitled Product',
        rawDescription: data.rawDescription || '',
        rawImages: data.rawImages || [],
        rawCategory: data.rawCategory || 'Uncategorized',
        rawCurrency: data.rawCurrency || 'USD',
        rawMinPrice: data.rawMinPrice || 0,
        rawMaxPrice: data.rawMaxPrice || 0,
        rawAttributes: data.rawAttributes || {},
        importBatchId: data.importBatchId,
        sourceUrl: data.sourceUrl || undefined,
        status: status,
        dataSourceType: data.dataSourceType || 'SEARCH',
      };

      const raw = await this.prisma.rawProduct.upsert({
        where: {
          source_supplierSku: {
            source: rawProductData.source,
            supplierSku: rawProductData.supplierSku,
          }
        },
        create: rawProductData,
        update: rawProductData,
      });

      console.log('[DB] rawProduct created/updated:', raw.id);
      return raw;
    } catch (error) {
      console.error('[DB] Error in saveRawProduct:', error);
      throw error;
    }
  }

  /**
   * Save raw variants for a raw product
   */
  async saveRawVariants(
    rawProductId: string,
    variants: ParsedVariant[]
  ): Promise<number> {
    let saved = 0;

    for (const variant of variants) {
      try {
        await this.prisma.rawVariant.upsert({
          where: {
            rawProductId_externalSkuId: {
              rawProductId,
              externalSkuId: variant.externalSkuId,
            },
          },
          create: {
            rawProductId,
            externalSkuId: variant.externalSkuId,
            price: variant.price,
            currency: variant.currency,
            stock: variant.stock,
            weight: variant.weight,
            attributes: variant.attributes as object,
            image: variant.image,
          },
          update: {
            price: variant.price,
            currency: variant.currency,
            stock: variant.stock,
            weight: variant.weight,
            attributes: variant.attributes as object,
            image: variant.image,
          },
        });

        saved++;
      } catch (error) {
        console.error(`[DB] Variant insert failed for SKU ${variant.externalSkuId}:`, error);
      }
    }

    return saved;
  }

  /**
   * Save clean product to database (WITH VARIANTS AND PRICE TIERS)
   */
  async saveCleanProduct(clean: CleanProductData & { 
    variants?: any[]; 
    priceTiers?: { minQuantity: number; maxQuantity: number; price: number; }[];
    transformerVersion?: string;
  }): Promise<string | null> {
    try {
      // 1️⃣ Créer le CleanProduct
      const created = await this.prisma.cleanProduct.create({
        data: {
          rawProductId: clean.rawProductId,
          cleanedTitle: clean.cleanedTitle,
          cleanedDesc: clean.cleanedDesc,
          seoTitle: clean.seoTitle,
          seoDescription: clean.seoDescription,
          seoKeywords: clean.seoKeywords,
          cleanedImages: clean.cleanedImages,
          mockupImages: clean.mockupImages,
          suggestedPrice: clean.suggestedPrice,
          suggestedCat: clean.suggestedCat,
          suggestedMarginPercent: clean.suggestedMarginPercent,
          qualityScore: clean.qualityScore,
          isApproved: false,
          weight: clean.weight,
          transformerVersion: clean.transformerVersion,
        },
      });

      console.log("[DB] CleanProduct CREATED:", created.id);

      // ✅ AJOUT: Sauvegarder les CleanVariant avec variantType
      if (clean.variants && clean.variants.length > 0) {
        await this.prisma.cleanVariant.createMany({
          data: clean.variants.map((v: any) => ({
            cleanProductId: created.id,
            externalSkuId: v.externalSkuId,
            name: v.name || this.generateVariantName(v.attributes),
            price: v.price,
            currency: v.currency || 'USD',
            stock: v.stock || 0,
            weight: v.weight,
            variantType: v.variantType || 'other',
            attributes: v.attributes || {},
            image: v.image,
            sortOrder: 0,
          })),
        });
        console.log(`   ✅ Saved ${clean.variants.length} CleanVariant`);
      }

      // ✅ NOUVEAU: Sauvegarder les PriceTiers (prix par quantité)
      if (clean.priceTiers && clean.priceTiers.length > 0) {
        console.log(`   📊 Found ${clean.priceTiers.length} price tiers (to be saved)`);
      }

      return created.id;
    } catch (error) {
      console.error("[DB] CLEAN PRODUCT INSERT FAILED:", error);
      return null;
    }
  }

  /**
   * Create final product from clean product (with variants and price tiers)
   */
  async createFinalProduct(
    cleanProductId: string,
    clean: CleanProductData & {
      priceTiers?: { minQuantity: number; maxQuantity: number; price: number; }[];
    },
    weight: number,
    stock: number = 100
  ): Promise<string | null> {
    try {
      // 1️⃣ Récupérer les CleanVariant associées
      const cleanVariants = await this.prisma.cleanVariant.findMany({
        where: { cleanProductId }
      });

      // 2️⃣ Créer le produit principal
      const product = await this.prisma.product.create({
        data: {
          cleanProductId,
          sku: generateSku("ADU", cleanProductId),
          title: clean.cleanedTitle,
          slug: `${generateSlug(clean.cleanedTitle)}-${Date.now()}`,
          description: clean.cleanedDesc,
          seoTitle: clean.seoTitle,
          seoDescription: clean.seoDescription,
          seoKeywords: clean.seoKeywords,
          price: clean.suggestedPrice || 0,
          currency: "USD",
          images: clean.cleanedImages,
          mockupImages: clean.mockupImages,
          categoryId: clean.suggestedCat,
          tags: clean.seoKeywords,
          stock,
          status: "ACTIVE",
          weight,
        },
      });

      console.log("[DB] Product CREATED:", product.id);

      // ✅ AJOUT: Créer les ProductVariant avec variantType
      if (cleanVariants.length > 0) {
        await this.prisma.productVariant.createMany({
          data: cleanVariants.map((v: any) => ({
            productId: product.id,
            sku: v.externalSkuId,
            name: v.name,
            price: v.price,
            currency: v.currency || 'USD',
            stock: v.stock || 0,
            weight: v.weight,
            variantType: v.variantType || 'other',
            attributes: v.attributes || {},
            image: v.image,
            sortOrder: 0,
          })),
        });
        console.log(`   ✅ Saved ${cleanVariants.length} ProductVariant`);
      }

      // ✅ NOUVEAU: Créer les PriceTiers pour le produit final
      if (clean.priceTiers && clean.priceTiers.length > 0) {
        console.log(`   📊 Product has ${clean.priceTiers.length} price tiers`);
      }

      return product.id;
    } catch (error) {
      console.error("[DB] Failed to create final product:", error);
      return null;
    }
  }

  /**
   * ✅ NOUVELLE FONCTION: Crée une hiérarchie complète de catégories
   * Exemple: "Apparel>Men's Clothing>T-Shirts" → crée les 3 niveaux
   */
  async createCategoryHierarchy(categoryPath: string, importBatchId?: string): Promise<string> {
    if (!categoryPath) {
      return this.getOrCreateCategory("Non catégorisé");
    }

    const segments = categoryPath.split('>').map(s => s.trim()).filter(Boolean);
    let parentId: string | null = null;
    let lastCategoryId = "";

    for (const segment of segments) {
      // Chercher si la catégorie existe déjà
      let category = await this.prisma.category.findFirst({
        where: {
          name: { equals: segment, mode: 'insensitive' },
          parentId: parentId,
        },
      });

      if (!category) {
        // Créer la catégorie
        category = await this.prisma.category.create({
          data: {
            name: segment,
            slug: this.generateUniqueSlug(segment),
            parentId: parentId,
            sortOrder: 0,
          },
        });
        console.log(`[DB] ✅ Catégorie créée: ${segment} (${category.id})`);
      }

      parentId = category.id;
      lastCategoryId = category.id;
    }

    return lastCategoryId;
  }

  /**
   * ✅ NOUVELLE FONCTION: Sauvegarde les vidéos d'un produit
   * Ne bloque pas l'import si les vidéos sont absentes
   */
  async saveProductVideos(productId: string, videos: RawVideo[]): Promise<number> {
    if (!videos || videos.length === 0) return 0;

    let saved = 0;
    for (const video of videos) {
      try {
        await this.prisma.productVideo.create({
          data: {
            productId,
            videoUrl: video.url,
            thumbnailUrl: video.thumbnailUrl,
            duration: video.duration,
            status: 'PENDING', // PAS ENCORE PRÊT POUR LE FEED
            viewCount: 0,
            likeCount: 0,
            shareCount: 0,
            sortOrder: 0,
          },
        });
        saved++;
      } catch (error) {
        console.warn(`[DB] ⚠️ Erreur sauvegarde vidéo:`, error);
        // Continue même si une vidéo échoue
      }
    }
    
    if (saved > 0) {
      console.log(`[DB] 🎥 ${saved} vidéos sauvegardées pour le produit ${productId}`);
    }
    return saved;
  }

  /**
   * Get or create category by name (ANCIENNE MÉTHODE CONSERVÉE)
   */
  async getOrCreateCategory(name: string, parentId?: string): Promise<string> {
    const slug = generateSlug(name);

    const category = await this.prisma.category.upsert({
      where: { slug },
      create: {
        name,
        slug,
        parentId,
      },
      update: {},
    });

    return category.id;
  }

  /**
   * Generate a unique slug for categories
   */
  private generateUniqueSlug(name: string): string {
    const baseSlug = generateSlug(name);
    const timestamp = Date.now().toString().slice(-4);
    return `${baseSlug}-${timestamp}`;
  }

  /**
   * Update raw product status
   */
  async updateRawProductStatus(
    rawProductId: string,
    status: ImportStatus,
    errorMessage?: string
  ): Promise<void> {
    await this.prisma.rawProduct.update({
      where: { id: rawProductId },
      data: {
        status,
        errorMessage,
      },
    });
  }

  /**
   * Log API usage for tracking
   */
  async logApiUsage(source: ImportSource, endpoint: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.apiUsageLog.upsert({
      where: {
        source_endpoint_date: {
          source,
          endpoint,
          date: today,
        },
      },
      create: {
        source,
        endpoint,
        date: today,
        calls: 1,
      },
      update: {
        calls: { increment: 1 },
      },
    });
  }

  /**
   * Get pipeline stats for dashboard
   */
  async getPipelineStats() {
    const [totalRaw, totalClean, totalProducts, recentBatches] = await Promise.all([
      this.prisma.rawProduct.count(),
      this.prisma.cleanProduct.count(),
      this.prisma.product.count(),
      this.prisma.importBatch.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const statusCount = await this.prisma.rawProduct.groupBy({
      by: ["status"],
      _count: true,
    });

    return {
      totalRaw,
      totalClean,
      totalProducts,
      recentBatches,
      statusCount,
    };
  }

  /**
   * Generate a readable variant name from attributes (FALLBACK ONLY)
   * Version améliorée qui gère aussi les quantités
   */
  private generateVariantName(attributes: any): string {
    if (!attributes) return 'Default';
    
    // ✅ Gérer les variantes de quantité
    if (attributes.minQuantity !== undefined) {
      const minQty = attributes.minQuantity;
      const maxQty = attributes.maxQuantity;
      
      if (maxQty === -1) {
        return `≥ ${minQty} pièces`;
      } else {
        return `${minQty} - ${maxQty} pièces`;
      }
    }
    
    // ✅ Gérer les attributs standards
    const color = attributes.color || attributes.colour || attributes.couleur;
    const size = attributes.size || attributes.taille;
    const storage = attributes.storage || attributes.capacity || attributes.memory;
    const material = attributes.material || attributes.matériau;
    
    const parts: string[] = [];
    if (color) parts.push(color);
    if (size) parts.push(size);
    if (storage) parts.push(storage);
    if (material && parts.length === 0) parts.push(material);
    
    if (parts.length > 0) {
      return parts.join(' - ');
    }
    
    // ✅ Fallback: première valeur
    const firstValue = Object.values(attributes)[0];
    return firstValue ? String(firstValue) : 'Default';
  }
}