import { Worker, type Job } from "@/lib/queue"
import prisma from "@/lib/prisma"
import redis from "@/lib/redis"

interface CleanProductsJobData {
  batchId?: string
  rawProductId?: string
}

// Simple SEO title cleaner
function cleanTitle(rawTitle: string): string {
  return rawTitle
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/[^\w\s\-$$$$]/g, "") // Remove special chars
    .trim()
    .substring(0, 200) // Limit length
}

// Generate SEO description
function generateSeoDescription(title: string, description?: string | null): string {
  const text = description || title
  return text.substring(0, 160).trim()
}

// Extract keywords
function extractKeywords(title: string, category?: string | null): string[] {
  const words = title
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)
  if (category) words.push(category.toLowerCase())
  return [...new Set(words)].slice(0, 10)
}

// Calculate quality score (0-100)
function calculateQualityScore(raw: {
  rawTitle: string
  rawDescription?: string | null
  rawImages?: string[]
  rawPrice?: number | null
}): number {
  let score = 0

  // Title quality
  if (raw.rawTitle.length > 20) score += 20
  if (raw.rawTitle.length > 50) score += 10

  // Description quality
  if (raw.rawDescription && raw.rawDescription.length > 100) score += 20
  if (raw.rawDescription && raw.rawDescription.length > 300) score += 10

  // Images
  if (raw.rawImages && raw.rawImages.length > 0) score += 20
  if (raw.rawImages && raw.rawImages.length >= 3) score += 10

  // Price
  if (raw.rawPrice && raw.rawPrice > 0) score += 10

  return Math.min(score, 100)
}

export async function cleanProducts(job: Job<CleanProductsJobData>) {
  const { batchId, rawProductId } = job.data

  const jobLog = await prisma.jobLog.create({
    data: {
      type: "CLEAN_PRODUCTS",
      status: "RUNNING",
      payload: { batchId, rawProductId },
      startedAt: new Date(),
    },
  })

  try {
    const where: Record<string, unknown> = {
      status: "COMPLETED",
      isDuplicate: false,
      isFake: false,
      cleanProduct: null, // Not yet cleaned
    }

    if (batchId) where.importBatchId = batchId
    if (rawProductId) where.id = rawProductId

    const rawProducts = await prisma.rawProduct.findMany({
      where,
      take: 1000, // Process in batches
    })

    let cleaned = 0

    for (let i = 0; i < rawProducts.length; i++) {
      const raw = rawProducts[i]

      const cleanedTitle = cleanTitle(raw.rawTitle)
      const seoTitle = cleanedTitle.substring(0, 70)
      const seoDescription = generateSeoDescription(cleanedTitle, raw.rawDescription)
      const seoKeywords = extractKeywords(cleanedTitle, raw.rawCategory)
      const qualityScore = calculateQualityScore(raw)

      await prisma.cleanProduct.create({
        data: {
          rawProductId: raw.id,
          cleanedTitle,
          cleanedDesc: raw.rawDescription,
          seoTitle,
          seoDescription,
          seoKeywords,
          cleanedImages: raw.rawImages || [],
          mockupImages: [],
          suggestedPrice: raw.rawPrice ? raw.rawPrice * 1.5 : null, // 50% markup
          suggestedCat: raw.rawCategory,
          qualityScore,
        },
      })

      cleaned++
      await job.updateProgress(Math.round(((i + 1) / rawProducts.length) * 100))
    }

    await prisma.jobLog.update({
      where: { id: jobLog.id },
      data: {
        status: "COMPLETED",
        progress: 100,
        result: { cleaned },
        completedAt: new Date(),
      },
    })

    return { cleaned }
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

export const cleanProductsWorker = new Worker("cleanProducts", cleanProducts, {
  connection: redis,
  concurrency: 3,
})
