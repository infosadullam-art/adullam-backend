import { Worker, type Job } from "@/lib/queue"
import prisma from "@/lib/prisma"
import redis from "@/lib/redis"

interface FakeDetectionJobData {
  batchId?: string
}

// Simple fake detection based on keywords and patterns
const FAKE_INDICATORS = [
  "replica",
  "fake",
  "copy",
  "1:1",
  "aaa quality",
  "super copy",
  "mirror",
  "knockoff",
  "imitation",
]

const SUSPICIOUS_PATTERNS = [
  /\d{1,2}:\d{1,2}/i, // Ratios like 1:1
  /grade\s*a+/i, // Grade AAA
  /original\s*box\s*not\s*included/i,
]

function detectFake(title: string, description?: string | null): boolean {
  const text = `${title} ${description || ""}`.toLowerCase()

  // Check for fake indicators
  for (const indicator of FAKE_INDICATORS) {
    if (text.includes(indicator)) {
      return true
    }
  }

  // Check suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) {
      return true
    }
  }

  return false
}

export async function runFakeDetection(job: Job<FakeDetectionJobData>) {
  const { batchId } = job.data

  const jobLog = await prisma.jobLog.create({
    data: {
      type: "FAKE_DETECTION",
      status: "RUNNING",
      payload: { batchId },
      startedAt: new Date(),
    },
  })

  try {
    const where = batchId
      ? { importBatchId: batchId, status: "COMPLETED", isDuplicate: false, isFake: false }
      : { status: "COMPLETED", isDuplicate: false, isFake: false }

    const rawProducts = await prisma.rawProduct.findMany({
      where,
      select: { id: true, rawTitle: true, rawDescription: true },
    })

    let fakesDetected = 0

    for (let i = 0; i < rawProducts.length; i++) {
      const product = rawProducts[i]

      if (detectFake(product.rawTitle, product.rawDescription)) {
        await prisma.rawProduct.update({
          where: { id: product.id },
          data: { isFake: true },
        })
        fakesDetected++
      }

      await job.updateProgress(Math.round(((i + 1) / rawProducts.length) * 100))
    }

    await prisma.jobLog.update({
      where: { id: jobLog.id },
      data: {
        status: "COMPLETED",
        progress: 100,
        result: {
          total: rawProducts.length,
          fakesDetected,
        },
        completedAt: new Date(),
      },
    })

    return { total: rawProducts.length, fakesDetected }
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

export const fakeDetectionWorker = new Worker("fakeDetection", runFakeDetection, {
  connection: redis,
  concurrency: 2,
})
