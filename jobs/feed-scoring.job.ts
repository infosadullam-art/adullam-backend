import { Worker, type Job } from "@/lib/queue"
import prisma from "@/lib/prisma"
import redis from "@/lib/redis"

interface FeedScoringJobData {
  userId?: string
}

// Calculate feed score based on video engagement
async function calculateFeedScore(userId: string, productId: string): Promise<number> {
  // Get product videos
  const videos = await prisma.productVideo.findMany({
    where: { productId, status: "READY" },
    select: { viewCount: true, likeCount: true, shareCount: true },
  })

  if (videos.length === 0) return 0

  // Calculate engagement score
  const totalViews = videos.reduce((sum, v) => sum + v.viewCount, 0)
  const totalLikes = videos.reduce((sum, v) => sum + v.likeCount, 0)
  const totalShares = videos.reduce((sum, v) => sum + v.shareCount, 0)

  const engagementRate = totalViews > 0 ? ((totalLikes + totalShares * 2) / totalViews) * 100 : 0

  // Get user video interactions
  const userInteractions = await prisma.interaction.count({
    where: {
      userId,
      productId,
      type: { in: ["VIDEO_VIEW", "VIDEO_LIKE", "VIDEO_COMPLETE"] },
    },
  })

  // Base score from engagement + user preference
  return Math.round((engagementRate * 10 + userInteractions * 5) * 100) / 100
}

export async function feedScoring(job: Job<FeedScoringJobData>) {
  const { userId } = job.data

  const jobLog = await prisma.jobLog.create({
    data: {
      type: "FEED_SCORING",
      status: "RUNNING",
      payload: { userId },
      startedAt: new Date(),
    },
  })

  try {
    const users = userId
      ? [{ id: userId }]
      : await prisma.user.findMany({
          where: { role: "USER" },
          select: { id: true },
          take: 100,
        })

    // Get products with videos
    const products = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        videos: { some: { status: "READY" } },
      },
      select: { id: true },
      take: 500,
    })

    let scoresCreated = 0

    for (const user of users) {
      for (const product of products) {
        const score = await calculateFeedScore(user.id, product.id)

        if (score > 0) {
          const existing = await prisma.feedScore.findFirst({
            where: { userId: user.id, productId: product.id },
            orderBy: { version: "desc" },
            select: { version: true },
          })

          const newVersion = (existing?.version || 0) + 1

          await prisma.feedScore.upsert({
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
              factors: { engagementBased: true },
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
            update: {
              score,
              factors: { engagementBased: true },
              calculatedAt: new Date(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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

export const feedScoringWorker = new Worker("feedScoring", feedScoring, {
  connection: redis,
  concurrency: 2,
})
