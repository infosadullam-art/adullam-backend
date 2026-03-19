import prisma from "@/lib/prisma"

export class FeedService {
  async getFeed(userId: string, page = 1, limit = 20) {
    // Get personalized feed based on feed scores
    const feedScores = await prisma.feedScore.findMany({
      where: { userId },
      orderBy: { score: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        product: {
          include: {
            videos: {
              where: { status: "READY" },
              take: 1,
            },
          },
        },
      },
    })

    if (feedScores.length > 0) {
      return feedScores.map((fs) => ({
        ...fs.product,
        feedScore: fs.score,
      }))
    }

    // Fallback to trending products with videos
    const products = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        videos: { some: { status: "READY" } },
      },
      orderBy: [{ viewCount: "desc" }, { purchaseCount: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        videos: {
          where: { status: "READY" },
          take: 1,
        },
      },
    })

    return products
  }

  async getVideoFeed(userId: string, page = 1, limit = 10) {
    // TikTok-style video feed
    const videos = await prisma.productVideo.findMany({
      where: { status: "READY" },
      orderBy: [{ viewCount: "desc" }, { likeCount: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
            slug: true,
          },
        },
      },
    })

    return videos
  }

  async recordVideoView(videoId: string, userId: string) {
    await prisma.$transaction([
      prisma.productVideo.update({
        where: { id: videoId },
        data: { viewCount: { increment: 1 } },
      }),
      prisma.interaction.create({
        data: {
          userId,
          type: "VIDEO_VIEW",
          context: "FEED",
          productId: (await prisma.productVideo.findUnique({ where: { id: videoId } }))?.productId,
        },
      }),
    ])
  }

  async likeVideo(videoId: string, userId: string) {
    const video = await prisma.productVideo.findUnique({ where: { id: videoId } })
    if (!video) throw new Error("Video not found")

    await prisma.$transaction([
      prisma.productVideo.update({
        where: { id: videoId },
        data: { likeCount: { increment: 1 } },
      }),
      prisma.interaction.create({
        data: {
          userId,
          type: "VIDEO_LIKE",
          context: "FEED",
          productId: video.productId,
        },
      }),
    ])
  }

  async getFeedStats() {
    const [totalVideos, totalViews, totalLikes, topVideos] = await Promise.all([
      prisma.productVideo.count({ where: { status: "READY" } }),
      prisma.productVideo.aggregate({ _sum: { viewCount: true } }),
      prisma.productVideo.aggregate({ _sum: { likeCount: true } }),
      prisma.productVideo.findMany({
        where: { status: "READY" },
        orderBy: { viewCount: "desc" },
        take: 10,
        include: {
          product: { select: { id: true, title: true } },
        },
      }),
    ])

    return {
      totalVideos,
      totalViews: totalViews._sum.viewCount || 0,
      totalLikes: totalLikes._sum.likeCount || 0,
      topVideos,
    }
  }
}

export const feedService = new FeedService()
