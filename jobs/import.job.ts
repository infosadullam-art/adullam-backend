import { Worker, type Job } from "@/lib/queue"
import prisma from "@/lib/prisma"
import redis from "@/lib/redis"
import { deduplicationQueue, fakeDetectionQueue } from "@/lib/queue"

interface ImportJobData {
  batchId: string
}

export async function processImportBatch(job: Job<ImportJobData>) {
  const { batchId } = job.data

  // Update batch status to processing
  await prisma.importBatch.update({
    where: { id: batchId },
    data: {
      status: "PROCESSING",
      startedAt: new Date(),
    },
  })

  // Create job log
  const jobLog = await prisma.jobLog.create({
    data: {
      type: "IMPORT_PRODUCTS",
      status: "RUNNING",
      payload: { batchId },
      startedAt: new Date(),
    },
  })

  try {
    // Get all raw products in this batch
    const rawProducts = await prisma.rawProduct.findMany({
      where: { importBatchId: batchId, status: "PENDING" },
    })

    let processed = 0
    let failed = 0

    for (const rawProduct of rawProducts) {
      try {
        // Basic validation
        if (!rawProduct.rawTitle || rawProduct.rawTitle.trim().length === 0) {
          await prisma.rawProduct.update({
            where: { id: rawProduct.id },
            data: {
              status: "FAILED",
              errorMessage: "Missing title",
            },
          })
          failed++
          continue
        }

        // Mark as completed for now (will be processed by dedup/fake detection)
        await prisma.rawProduct.update({
          where: { id: rawProduct.id },
          data: { status: "COMPLETED" },
        })

        processed++

        // Update progress
        await job.updateProgress(Math.round((processed / rawProducts.length) * 100))
      } catch (error) {
        await prisma.rawProduct.update({
          where: { id: rawProduct.id },
          data: {
            status: "FAILED",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
          },
        })
        failed++
      }
    }

    // Update batch status
    await prisma.importBatch.update({
      where: { id: batchId },
      data: {
        status: "COMPLETED",
        processed,
        failed,
        completedAt: new Date(),
      },
    })

    // Queue deduplication and fake detection
    await deduplicationQueue.add("runDeduplication", { batchId })
    await fakeDetectionQueue.add("runFakeDetection", { batchId })

    // Update job log
    await prisma.jobLog.update({
      where: { id: jobLog.id },
      data: {
        status: "COMPLETED",
        progress: 100,
        result: { processed, failed },
        completedAt: new Date(),
      },
    })

    return { processed, failed }
  } catch (error) {
    await prisma.importBatch.update({
      where: { id: batchId },
      data: { status: "FAILED" },
    })

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

export const importWorker = new Worker("import", processImportBatch, {
  connection: redis,
  concurrency: 5,
})
