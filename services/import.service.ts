import prisma from "@/lib/prisma"
import { importQueue, deduplicationQueue } from "@/lib/queue"
import type { ImportSource, ImportStatus, Prisma } from "@prisma/client"

export interface CreateImportBatchInput {
  source: ImportSource
  products: RawProductInput[]
}

export interface RawProductInput {
  externalId?: string
  sourceUrl?: string
  rawTitle: string
  rawDescription?: string
  rawPrice?: number
  rawCurrency?: string
  rawImages?: string[]
  rawCategory?: string
  rawAttributes?: Record<string, unknown>
}

export interface ImportBatchFilters {
  source?: ImportSource
  status?: ImportStatus
  startDate?: Date
  endDate?: Date
}

export class ImportService {
  async createBatch(input: CreateImportBatchInput) {
    const batch = await prisma.importBatch.create({
      data: {
        source: input.source,
        totalItems: input.products.length,
        rawProducts: {
          create: input.products.map((p) => ({
            externalId: p.externalId,
            sourceUrl: p.sourceUrl,
            rawTitle: p.rawTitle,
            rawDescription: p.rawDescription,
            rawPrice: p.rawPrice,
            rawCurrency: p.rawCurrency,
            rawImages: p.rawImages || [],
            rawCategory: p.rawCategory,
            rawAttributes: p.rawAttributes as Prisma.InputJsonValue,
          })),
        },
      },
      include: {
        _count: {
          select: { rawProducts: true },
        },
      },
    })

    // Queue the batch for processing
    await importQueue.add("processImportBatch", { batchId: batch.id })

    return batch
  }

  async getBatch(id: string) {
    return prisma.importBatch.findUnique({
      where: { id },
      include: {
        rawProducts: {
          take: 100,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { rawProducts: true },
        },
      },
    })
  }

  async listBatches(filters: ImportBatchFilters, page = 1, limit = 20) {
    const where: Prisma.ImportBatchWhereInput = {}

    if (filters.source) where.source = filters.source
    if (filters.status) where.status = filters.status
    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) where.createdAt.gte = filters.startDate
      if (filters.endDate) where.createdAt.lte = filters.endDate
    }

    const [batches, total] = await Promise.all([
      prisma.importBatch.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { rawProducts: true },
          },
        },
      }),
      prisma.importBatch.count({ where }),
    ])

    return { batches, total }
  }

  async getRawProducts(batchId: string, status?: ImportStatus, page = 1, limit = 50) {
    const where: Prisma.RawProductWhereInput = { importBatchId: batchId }
    if (status) where.status = status

    const [products, total] = await Promise.all([
      prisma.rawProduct.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.rawProduct.count({ where }),
    ])

    return { products, total }
  }

  async triggerDeduplication(batchId: string) {
    await deduplicationQueue.add("runDeduplication", { batchId })
    return { message: "Deduplication job queued" }
  }

  async getImportStats() {
    const [totalBatches, statusCounts, sourceCounts, recentBatches] = await Promise.all([
      prisma.importBatch.count(),
      prisma.importBatch.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.importBatch.groupBy({
        by: ["source"],
        _count: { _all: true },
      }),
      prisma.importBatch.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          source: true,
          status: true,
          totalItems: true,
          processed: true,
          failed: true,
          createdAt: true,
        },
      }),
    ])

    const totalProducts = await prisma.rawProduct.count()
    const duplicates = await prisma.rawProduct.count({ where: { isDuplicate: true } })
    const fakes = await prisma.rawProduct.count({ where: { isFake: true } })

    return {
      totalBatches,
      totalProducts,
      duplicates,
      fakes,
      byStatus: statusCounts.reduce((acc, s) => ({ ...acc, [s.status]: s._count._all }), {}),
      bySource: sourceCounts.reduce((acc, s) => ({ ...acc, [s.source]: s._count._all }), {}),
      recentBatches,
    }
  }
}

export const importService = new ImportService()
