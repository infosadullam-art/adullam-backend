import prisma from "@/lib/prisma"

export class ForYouService {
  async getRecommendations(userId: string, page = 1, limit = 20) {
    // Get personalized recommendations based on ForYou scores
    const forYouScores = await prisma.forYouScore.findMany({
      where: { userId },
      orderBy: { score: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    })

    if (forYouScores.length > 0) {
      return forYouScores.map((fys) => ({
        ...fys.product,
        recommendationScore: fys.score,
        factors: fys.factors,
      }))
    }

    // Fallback to popular products
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ purchaseCount: "desc" }, { viewCount: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: { category: true },
    })

    return products
  }

  async getSimilarProducts(productId: string, limit = 10) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true, tags: true },
    })

    if (!product) throw new Error("Product not found")

    // Find similar products based on category and tags
    const similar = await prisma.product.findMany({
      where: {
        id: { not: productId },
        status: "ACTIVE",
        OR: [{ categoryId: product.categoryId }, { tags: { hasSome: product.tags } }],
      },
      orderBy: { purchaseCount: "desc" },
      take: limit,
      include: { category: true },
    })

    return similar
  }

  async getForYouStats(userId: string) {
    const [totalScores, avgScore, topCategories] = await Promise.all([
      prisma.forYouScore.count({ where: { userId } }),
      prisma.forYouScore.aggregate({
        where: { userId },
        _avg: { score: true },
      }),
      prisma.interaction.groupBy({
        by: ["productId"],
        where: {
          userId,
          type: { in: ["PURCHASE", "ADD_TO_CART", "VIEW"] },
        },
        _count: { _all: true },
        orderBy: { _count: { productId: "desc" } },
        take: 5,
      }),
    ])

    return {
      totalScores,
      avgScore: avgScore._avg.score || 0,
      topInteractions: topCategories,
    }
  }
}

export const forYouService = new ForYouService()
