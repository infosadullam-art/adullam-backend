import { Worker, type Job } from "@/lib/queue"
import prisma from "@/lib/prisma"
import redis from "@/lib/redis"

interface DeduplicationJobData {
  batchId?: string
}

// Simple hash function for title similarity
function simpleHash(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 50)
}

export async function runDeduplication(job: Job<DeduplicationJobData>) {
  const { batchId } = job.data

  const jobLog = await prisma.jobLog.create({
    data: {
      type: "DEDUPLICATION",
      status: "RUNNING",
      payload: { batchId },
      startedAt: new Date(),
    },
  })

  try {
    const where = batchId
      ? { importBatchId: batchId, status: "COMPLETED", isDuplicate: false }
      : { status: "COMPLETED", isDuplicate: false }

    const rawProducts = await prisma.rawProduct.findMany({
      where,
      select: { id: true, rawTitle: true, externalId: true },
    })

    // Build hash map
    const hashMap = new Map<string, string>()
    const duplicates: string[] = []

    for (const product of rawProducts) {
      const hash = simpleHash(product.rawTitle)

      // Check for existing product with same title
      const existingProductId = hashMap.get(hash)

      if (existingProductId) {
        duplicates.push(product.id)
        await prisma.rawProduct.update({
          where: { id: product.id },
          data: {
            isDuplicate: true,
            duplicateOfId: existingProductId,
          },
        })
      } else {
        // Check against existing active products
        const existingActive = await prisma.product.findFirst({
          where: {
            title: { contains: product.rawTitle.substring(0, 50), mode: "insensitive" },
          },
          select: { id: true },
        })

        if (existingActive) {
          duplicates.push(product.id)
          await prisma.rawProduct.update({
            where: { id: product.id },
            data: { isDuplicate: true },
          })
        } else {
          hashMap.set(hash, product.id)
        }
      }

      await job.updateProgress(Math.round(((rawProducts.indexOf(product) + 1) / rawProducts.length) * 100))
    }

    await prisma.jobLog.update({
      where: { id: jobLog.id },
      data: {
        status: "COMPLETED",
        progress: 100,
        result: {
          total: rawProducts.length,
          duplicates: duplicates.length,
        },
        completedAt: new Date(),
      },
    })

    return { total: rawProducts.length, duplicates: duplicates.length }
  } catch (error) {
    await prisma.jobLog.update({
      where: { id: jobLog.id },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      },
    })
    throw error
  }
}

export const deduplicationWorker = new Worker("deduplication", runDeduplication, {
  connection: redis,
  concurrency: 2,
})
