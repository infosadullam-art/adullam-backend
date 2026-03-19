// Raw Product Storage for Adullam

import type { ParsedRawProduct, ImportStatus } from "../config/types";

// Mock Prisma interface
interface PrismaClient {
  rawProduct: {
    upsert: (data: {
      where: Record<string, unknown>;
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }) => Promise<{ id: string }>;
    findUnique: (data: { where: Record<string, unknown> }) => Promise<unknown | null>;
    updateMany: (data: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<{ count: number }>;
  };
  rawVariant: {
    createMany: (data: { data: Record<string, unknown>[]; skipDuplicates?: boolean }) => Promise<{ count: number }>;
    deleteMany: (data: { where: Record<string, unknown> }) => Promise<{ count: number }>;
  };
}

// Mock implementation for development
const createMockPrisma = (): PrismaClient => {
  const generateId = () => `raw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    rawProduct: {
      upsert: async (data) => {
        console.log("[RawStorage] Upserting product:", data.create.externalProductId);
        return { id: generateId() };
      },
      findUnique: async () => null,
      updateMany: async () => ({ count: 0 }),
    },
    rawVariant: {
      createMany: async (data) => ({ count: data.data.length }),
      deleteMany: async () => ({ count: 0 }),
    },
  };
};

export class RawStorage {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || createMockPrisma();
  }

  /**
   * Store a parsed raw product
   * Returns the raw product ID if successful, null if failed
   */
  async store(product: ParsedRawProduct, batchId: string): Promise<string | null> {
    try {
      // Upsert to handle duplicates gracefully
      const rawProduct = await this.prisma.rawProduct.upsert({
        where: {
          source_externalProductId: {
            source: product.source,
            externalProductId: product.externalProductId,
          },
        },
        create: {
          importBatchId: batchId,
          source: product.source,
          externalProductId: product.externalProductId,
          externalSkuId: product.externalSkuId,
          externalShopId: product.externalShopId,
          sourceUrl: product.sourceUrl,
          rawTitle: product.rawTitle,
          rawDescription: product.rawDescription,
          rawMinPrice: product.rawMinPrice,
          rawMaxPrice: product.rawMaxPrice,
          rawCurrency: product.rawCurrency || "USD",
          rawImages: product.rawImages,
          rawCategory: product.rawCategory,
          rawAttributes: {
            ...product.rawAttributes,
            weight: product.weight,
            volume: product.volume,
          },
          status: "PENDING" as ImportStatus,
          dataSourceType: "ALIEXPRESS_API",
        },
        update: {
          // Update with latest data if product already exists
          importBatchId: batchId,
          rawTitle: product.rawTitle,
          rawDescription: product.rawDescription,
          rawMinPrice: product.rawMinPrice,
          rawMaxPrice: product.rawMaxPrice,
          rawImages: product.rawImages,
          rawAttributes: {
            ...product.rawAttributes,
            weight: product.weight,
            volume: product.volume,
          },
          status: "PENDING" as ImportStatus,
        },
      });

      // Store variants if present
      if (product.variants && product.variants.length > 0) {
        // Delete existing variants first
        await this.prisma.rawVariant.deleteMany({
          where: { rawProductId: rawProduct.id },
        });

        // Create new variants
        await this.prisma.rawVariant.createMany({
          data: product.variants.map((variant) => ({
            rawProductId: rawProduct.id,
            externalSkuId: variant.externalSkuId,
            price: variant.price,
            currency: variant.currency || product.rawCurrency || "USD",
            stock: variant.stock,
            attributes: variant.attributes,
            image: variant.image,
          })),
          skipDuplicates: true,
        });
      }

      return rawProduct.id;
    } catch (error) {
      console.error("[RawStorage] Failed to store product:", error);
      return null;
    }
  }

  /**
   * Store multiple products in batch
   */
  async storeBatch(
    products: ParsedRawProduct[],
    batchId: string
  ): Promise<{ stored: number; failed: number }> {
    let stored = 0;
    let failed = 0;

    for (const product of products) {
      const id = await this.store(product, batchId);
      if (id) {
        stored++;
      } else {
        failed++;
      }
    }

    return { stored, failed };
  }

  /**
   * Mark product as processed
   */
  async markProcessed(rawProductId: string, status: ImportStatus = "COMPLETED"): Promise<void> {
    await this.prisma.rawProduct.updateMany({
      where: { id: rawProductId },
      data: { status },
    });
  }

  /**
   * Mark product as failed with error message
   */
  async markFailed(rawProductId: string, errorMessage: string): Promise<void> {
    await this.prisma.rawProduct.updateMany({
      where: { id: rawProductId },
      data: {
        status: "FAILED" as ImportStatus,
        errorMessage,
      },
    });
  }

  /**
   * Check if product already exists
   */
  async exists(source: string, externalProductId: string): Promise<boolean> {
    const existing = await this.prisma.rawProduct.findUnique({
      where: {
        source_externalProductId: {
          source,
          externalProductId,
        },
      },
    });
    return existing !== null;
  }

  /**
   * Mark product as duplicate
   */
  async markDuplicate(rawProductId: string, duplicateOfId: string): Promise<void> {
    await this.prisma.rawProduct.updateMany({
      where: { id: rawProductId },
      data: {
        isDuplicate: true,
        duplicateOfId,
      },
    });
  }
}
