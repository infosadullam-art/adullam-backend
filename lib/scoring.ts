// ============================================
// 🧠 ALGORITHME DE SCORING ULTIME
// ============================================

interface ScoringContext {
  userId?: string
  sessionId?: string
  country?: string
  hour?: number
  viewedProducts?: string[]
  clickedProducts?: string[]
  purchasedProducts?: string[]
}

interface ProductScore {
  productId: string
  baseScore: number
  personalScore: number
  trendingScore: number
  discoveryScore: number
  finalScore: number
  reasons: string[]
}

export class ScoringEngine {
  
  // ============================================
  // 1️⃣ CALCUL DU SCORE POUR UN PRODUIT
  // ============================================
  static async calculateProductScore(
    product: any,
    context: ScoringContext
  ): Promise<ProductScore> {
    
    const scores = {
      productId: product.id,
      baseScore: 0,
      personalScore: 0,
      trendingScore: 0,
      discoveryScore: 0,
      finalScore: 0,
      reasons: []
    }

    // ✅ SCORE DE BASE (popularité générale)
    scores.baseScore = this.calculateBaseScore(product)
    
    // ✅ SCORE PERSONNALISÉ (si utilisateur connecté ou session)
    if (context.userId || context.sessionId) {
      scores.personalScore = await this.calculatePersonalScore(product, context)
      if (scores.personalScore > 0.5) {
        scores.reasons.push('Basé sur vos préférences')
      }
    }

    // ✅ SCORE DE TENDANCE (par pays)
    if (context.country) {
      scores.trendingScore = await this.calculateTrendingScore(product, context.country)
      if (scores.trendingScore > 0.7) {
        scores.reasons.push(`Tendance en ${context.country}`)
      }
    }

    // ✅ SCORE DE DÉCOUVERTE (nouveautés, moins vus)
    scores.discoveryScore = this.calculateDiscoveryScore(product)
    if (scores.discoveryScore > 0.8) {
      scores.reasons.push('Nouveauté')
    }

    // ✅ PONDÉRATION DYNAMIQUE
    scores.finalScore = this.weightScores(scores, context)

    return scores
  }

  // ============================================
  // 2️⃣ SCORE DE BASE (POPULARITÉ)
  // ============================================
  private static calculateBaseScore(product: any): number {
    const viewScore = Math.min(product.viewCount / 1000, 1) * 0.3
    const purchaseScore = Math.min(product.purchaseCount / 100, 1) * 0.5
    const ratingScore = (product.avgRating || 0) / 5 * 0.2
    
    return viewScore + purchaseScore + ratingScore
  }

  // ============================================
  // 3️⃣ SCORE PERSONNALISÉ (UTILISATEUR/SESSION)
  // ============================================
  private static async calculatePersonalScore(
    product: any,
    context: ScoringContext
  ): Promise<number> {
    const prisma = (await import('@/lib/prisma')).prisma
    
    // Récupérer les interactions récentes
    const interactions = await prisma.interaction.findMany({
      where: {
        OR: [
          { userId: context.userId },
          { sessionId: context.sessionId }
        ],
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      take: 50
    })

    if (interactions.length === 0) return 0

    // ✅ Similarité de catégorie
    const sameCategory = interactions.filter(i => 
      i.metadata?.categoryId === product.categoryId
    ).length
    const categoryScore = sameCategory / interactions.length * 0.4

    // ✅ Similarité de prix
    const similarPrice = interactions.filter(i => {
      const price = i.metadata?.price
      return price && Math.abs(price - product.price) / product.price < 0.3
    }).length
    const priceScore = similarPrice / interactions.length * 0.3

    // ✅ Interactions positives
    const positiveInteractions = interactions.filter(i => 
      i.type === 'PURCHASE' || i.type === 'ADD_TO_CART'
    ).length
    const positiveScore = positiveInteractions / interactions.length * 0.3

    return categoryScore + priceScore + positiveScore
  }

  // ============================================
  // 4️⃣ SCORE DE TENDANCE (PAR PAYS)
  // ============================================
  private static async calculateTrendingScore(
    product: any,
    country: string
  ): Promise<number> {
    const prisma = (await import('@/lib/prisma')).prisma
    
    const viewsInCountry = await prisma.interaction.count({
      where: {
        productId: product.id,
        metadata: { path: ['country'], equals: country },
        type: 'VIEW',
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    })

    const purchasesInCountry = await prisma.interaction.count({
      where: {
        productId: product.id,
        metadata: { path: ['country'], equals: country },
        type: 'PURCHASE',
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    })

    const totalViews = await prisma.interaction.count({
      where: {
        type: 'VIEW',
        metadata: { path: ['country'], equals: country },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    })

    if (totalViews === 0) return 0

    const viewRatio = viewsInCountry / totalViews
    const purchaseBonus = purchasesInCountry * 0.1

    return Math.min(viewRatio + purchaseBonus, 1)
  }

  // ============================================
  // 5️⃣ SCORE DE DÉCOUVERTE (Nouveautés)
  // ============================================
  private static calculateDiscoveryScore(product: any): number {
    const daysOld = (Date.now() - new Date(product.createdAt).getTime()) / (24 * 60 * 60 * 1000)
    
    // Plus le produit est récent, plus le score est élevé
    const recencyScore = Math.max(0, 1 - (daysOld / 30))
    
    // Pénalité si trop vu
    const viewPenalty = Math.min(product.viewCount / 10000, 1)
    
    return recencyScore * (1 - viewPenalty * 0.5)
  }

  // ============================================
  // 6️⃣ PONDÉRATION DYNAMIQUE
  // ============================================
  private static weightScores(
    scores: any,
    context: ScoringContext
  ): number {
    // Poids qui évoluent selon le contexte
    let weights = {
      base: 0.2,
      personal: 0.4,
      trending: 0.3,
      discovery: 0.1
    }

    // Si pas d'utilisateur, plus de poids sur les tendances
    if (!context.userId && !context.sessionId) {
      weights = {
        base: 0.3,
        personal: 0,
        trending: 0.5,
        discovery: 0.2
      }
    }

    // Si utilisateur avec historique, plus de poids personnel
    if (context.userId && context.viewedProducts?.length > 10) {
      weights = {
        base: 0.1,
        personal: 0.6,
        trending: 0.2,
        discovery: 0.1
      }
    }

    // Calcul final
    return (
      scores.baseScore * weights.base +
      scores.personalScore * weights.personal +
      scores.trendingScore * weights.trending +
      scores.discoveryScore * weights.discovery
    )
  }

  // ============================================
  // 7️⃣ GÉNÉRATION DES RAISONS
  // ============================================
  static getReason(scores: ProductScore): string {
    if (scores.personalScore > 0.7) return "Parfait pour vous"
    if (scores.personalScore > 0.5) return "Basé sur vos achats"
    if (scores.trendingScore > 0.7) return "Tendance actuelle"
    if (scores.trendingScore > 0.5) return "Populaire"
    if (scores.discoveryScore > 0.7) return "Nouveauté"
    return "Recommandé pour vous"
  }
}