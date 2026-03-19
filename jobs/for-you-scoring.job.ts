import { Worker, type Job } from "@/lib/queue"
import prisma from "@/lib/prisma"
import redis from "@/lib/redis"

interface ForYouScoringJobData {
  userId?: string
}

// Calculate ForYou score based on user interactions
async function calculateUserProductScore(userId: string, productId: string): Promise<number> {
  const interactions = await prisma.interaction.findMany({
    where: { userId, productId },
    select: { type: true, createdAt: true },
  })

  let score = 0

  for (const interaction of interactions) {
    // Weight by interaction type
    switch (interaction.type) {
      case "PURCHASE":
        score += 100
        break
      case "ADD_TO_CART":
        score += 50
        break
      case "WISHLIST_ADD":
        score += 30
        break
      case "VIEW":
        score += 10
        break
      case "CLICK":
        score += 5
        break
    }

    // Decay by time (reduce score for older interactions)
    const daysSince = (Date.now() - interaction.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    const decayFactor = Math.max(0.1, 1 - daysSince / 30) // 30-day decay
    score *= decayFactor
  }

  return Math.round(score * 100) / 100
}

export async function forYouScoring(job: Job<ForYouScoringJobData>) {
  const { userId } = job.data

  const jobLog = await prisma.jobLog.create({
    data: {
      type: "FOR_YOU_SCORING",
      status: "RUNNING",
      payload: { userId },
      startedAt: new Date(),
    },
  })

  try {
    // Get users to score
    const users = userId
      ? [{ id: userId }]
      : await prisma.user.findMany({
          where: { role: "USER" },
          select: { id: true },
          take: 100,
        })

    // Get active products
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
      take: 1000,
    })

    let scoresCreated = 0

    for (const user of users) {
      for (const product of products) {
        const score = await calculateUserProductScore(user.id, product.id)

        if (score > 0) {
          // Get current max version
          const existing = await prisma.forYouScore.findFirst({
            where: { userId: user.id, productId: product.id },
            orderBy: { version: "desc" },
            select: { version: true },
          })

          const newVersion = (existing?.version || 0) + 1

          await prisma.forYouScore.upsert({
            where: {
              userId_productId_version: {
                userId: user.id,
                productId: product.id,
                version: newVersion,
              },
            },
            create: {
              userId: user.id,
              productId: product.id,
              score,
              version: newVersion,
              factors: { interactionBased: true },
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
            update: {
              score,
              factors: { interactionBased: true },
              calculatedAt: new Date(),
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          })

          scoresCreated++
        }
      }

      await job.updateProgress(Math.round(((users.indexOf(user) + 1) / users.length) * 100))
    }

    await prisma.jobLog.update({
      where: { id: jobLog.id },
      data: {
        status: "COMPLETED",
        progress: 100,
        result: { usersProcessed: users.length, scoresCreated },
        completedAt: new Date(),
      },
    })

    return { usersProcessed: users.length, scoresCreated }
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

export const forYouScoringWorker = new Worker("forYouScoring", forYouScoring, {
  connection: redis,
  concurrency: 2,
})
