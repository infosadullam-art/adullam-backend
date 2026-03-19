import type { NextRequest } from "next/server";
import { feedService } from "@/services/feed.service";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { getPaginationParams } from "@/lib/utils/pagination";
import { prisma } from "@/lib/prisma";
import { verifyToken, type JwtPayload } from "@/lib/jwt";
import type { User } from "@prisma/client";
import { ScoringEngine } from "@/lib/scoring";
import { getCountryFromIP } from "@/lib/geo";

/* -------------------------------------------------------------------------- */
/*                               AUTH HELPER                                   */
/* -------------------------------------------------------------------------- */
async function getAuthUser(request: NextRequest): Promise<User | null> {
  try {
    const token = request.cookies.get("accessToken")?.value;
    if (!token) return null;

    const payload: JwtPayload = await verifyToken(token, "access");
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    return user ?? null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                              SESSION HELPER                                 */
/* -------------------------------------------------------------------------- */
function getSessionId(request: NextRequest): string {
  return request.headers.get('x-session-id') || 
         request.nextUrl.searchParams.get('sessionId') || 
         crypto.randomUUID();
}

/* -------------------------------------------------------------------------- */
/*                           RÉCUPÉRER INTERACTIONS                           */
/* -------------------------------------------------------------------------- */
async function getRecentInteractions(context: any) {
  const where = context.userId 
    ? { userId: context.userId }
    : { sessionId: context.sessionId };

  const interactions = await prisma.interaction.findMany({
    where: {
      ...where,
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      productId: true,
      type: true,
      metadata: true,
      createdAt: true
    }
  });

  // ✅ PONDÉRATION TEMPORELLE (plus récent = plus important)
  const now = Date.now();
  const weightedInteractions = interactions.map(i => ({
    ...i,
    weight: Math.exp(-(now - new Date(i.createdAt).getTime()) / (7 * 24 * 60 * 60 * 1000))
  }));

  return {
    viewed: interactions.filter(i => i.type === 'VIEW').map(i => i.productId),
    clicked: interactions.filter(i => i.type === 'CLICK').map(i => i.productId),
    purchased: interactions.filter(i => i.type === 'PURCHASE').map(i => i.productId),
    total: interactions.length,
    weighted: weightedInteractions
  };
}

/* -------------------------------------------------------------------------- */
/*                              MIX INTELLIGENT                                */
/* -------------------------------------------------------------------------- */
function mixFeed(personalized: any[], trending: any[], discovery: any[], limit: number) {
  const result = [];
  
  // Pattern: 2 perso, 1 trending, 1 discovery (répété)
  for (let i = 0; i < limit; i += 4) {
    // 2 personnalisés
    if (personalized.length) {
      result.push(...personalized.splice(0, 2));
    }
    // 1 tendance
    if (trending.length && result.length < limit) {
      result.push(trending.shift());
    }
    // 1 découverte
    if (discovery.length && result.length < limit) {
      result.push(discovery.shift());
    }
  }
  
  return result.slice(0, limit);
}

/* -------------------------------------------------------------------------- */
/*                              RAISONS DYNAMIQUES                            */
/* -------------------------------------------------------------------------- */
function getDynamicReason(product: any, context: any, scores: any): string {
  if (scores.personalScore > 0.8) {
    return "✨ Parfait pour vous";
  }
  if (scores.personalScore > 0.6) {
    return "🎯 Dans votre style";
  }
  if (context.recentlyViewed?.includes(product.id)) {
    return "👀 Vous avez regardé";
  }
  if (scores.trendingScore > 0.7) {
    return `🔥 Tendance ${context.country}`;
  }
  if (scores.trendingScore > 0.5) {
    return "📈 Populaire";
  }
  if (scores.discoveryScore > 0.7) {
    return "🆕 Nouveauté";
  }
  return "💡 Pour vous";
}

/* -------------------------------------------------------------------------- */
/*                              PRÉ-CHARGEMENT                                */
/* -------------------------------------------------------------------------- */
const prefetchCache = new Map();

async function preloadNextFeed(userId: string | undefined, sessionId: string, cursor: string, limit: number) {
  const cacheKey = `${userId || sessionId}-${cursor}`;
  
  setTimeout(async () => {
    try {
      const nextFeed = await feedService.getFeed(userId, 0, limit, cursor);
      prefetchCache.set(cacheKey, {
        data: nextFeed,
        timestamp: Date.now()
      });
      
      // Nettoyer après 30 secondes
      setTimeout(() => prefetchCache.delete(cacheKey), 30000);
    } catch (error) {
      console.error('❌ Preload failed:', error);
    }
  }, 50);
}

/* -------------------------------------------------------------------------- */
/*                                   FEED KILLER                               */
/* -------------------------------------------------------------------------- */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID().slice(0, 8);
  
  try {
    // 1️⃣ RÉCUPÉRER LE CONTEXTE
    const user = await getAuthUser(request);
    const sessionId = getSessionId(request);
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const country = await getCountryFromIP(ip);
    
    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);
    const cursor = searchParams.get('cursor');
    const forceRefresh = searchParams.get('refresh') === 'true';

    // 2️⃣ CONSTRUIRE LE CONTEXTE
    const context = {
      userId: user?.id,
      sessionId,
      country,
      hour: new Date().getHours(),
      requestId
    };

    // 3️⃣ VÉRIFIER LE CACHE MÉMOIRE
    const cacheKey = `${user?.id || sessionId}-${cursor || 'first'}`;
    
    if (!forceRefresh && prefetchCache.has(cacheKey)) {
      const cached = prefetchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 30000) {
        return successResponse(cached.data);
      }
    }

    // 4️⃣ RÉCUPÉRER LES INTERACTIONS
    const recentInteractions = await getRecentInteractions(context);

    // 5️⃣ OBTENIR LES DIFFÉRENTS TYPES DE PRODUITS
    const [personalized, trending, discovery] = await Promise.all([
      feedService.getPersonalizedFeed(user?.id, sessionId, {
        limit: Math.ceil(limit * 0.5),
        cursor,
        interactions: recentInteractions
      }).catch(() => ({ items: [] })),
      
      feedService.getTrendingFeed(country, {
        limit: Math.ceil(limit * 0.3),
        cursor
      }).catch(() => ({ items: [] })),
      
      feedService.getDiscoveryFeed({
        limit: Math.ceil(limit * 0.2),
        cursor
      }).catch(() => ({ items: [] }))
    ]);

    // 6️⃣ MIXER
    let mixedItems = mixFeed(
      personalized.items || [],
      trending.items || [],
      discovery.items || [],
      limit
    );

    // 7️⃣ SCORER ET ENRICHIR
    const scoredFeed = await Promise.all(
      mixedItems.map(async (item) => {
        const scores = await ScoringEngine.calculateProductScore(item, {
          ...context,
          viewedProducts: recentInteractions.viewed,
          clickedProducts: recentInteractions.clicked,
          purchasedProducts: recentInteractions.purchased
        });

        const reason = getDynamicReason(item, {
          ...context,
          recentlyViewed: recentInteractions.viewed
        }, scores);

        return {
          id: item.id,
          name: item.title || item.name,
          priceUSD: item.sellingPriceUSD ?? item.price ?? 0,
          image: Array.isArray(item.images) && item.images.length > 0 
            ? item.images[0] 
            : '/placeholder.jpg',
          rating: item.avgRating ?? 4.5,
          status: item.status,
          isSeed: false,
          forYouScore: scores.finalScore,
          reason,
          meta: {
            category: item.categoryId,
            confidence: Math.round(scores.finalScore * 100)
          }
        };
      })
    );

    // 8️⃣ TRIER
    scoredFeed.sort((a, b) => b.forYouScore - a.forYouScore);

    // 9️⃣ PRÉPARER LA RÉPONSE
    const nextCursor = scoredFeed.length === limit 
      ? scoredFeed[scoredFeed.length - 1].id 
      : null;

    const response = {
      success: true,
      data: scoredFeed,
      pagination: {
        page,
        limit,
        nextCursor,
        hasMore: scoredFeed.length === limit
      },
      meta: {
        requestId,
        duration: Date.now() - startTime,
        source: user ? 'personalized' : 'session',
        country,
        interactions: recentInteractions.total
      }
    };

    // 🔟 PRÉ-CHARGER LA SUITE
    if (nextCursor) {
      preloadNextFeed(user?.id, sessionId, nextCursor, limit);
    }

    return successResponse(response);

  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get feed";
    console.error(`❌ Feed Error [${requestId}]:`, error);
    
    // ✅ FALLBACK
    try {
      const fallback = await feedService.getTrendingFeed('CI', { limit: 12 });
      return successResponse({
        data: fallback.items || [],
        pagination: { page: 1, limit: 12, nextCursor: null, hasMore: false },
        meta: { 
          requestId,
          source: 'fallback', 
          error: message,
          duration: Date.now() - startTime
        }
      });
    } catch {
      return errorResponse(message, 400);
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                              TRACKING                                      */
/* -------------------------------------------------------------------------- */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8);
  
  try {
    const body = await request.json();
    const { productId, type, context, duration, metadata } = body;
    
    const user = await getAuthUser(request);
    const sessionId = getSessionId(request);
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const country = await getCountryFromIP(ip);
    
    if (!productId || !type || !['VIEW', 'CLICK', 'ADD_TO_CART', 'PURCHASE'].includes(type)) {
      return errorResponse('Données invalides', 400);
    }

    // Créer l'interaction
    const interaction = await prisma.interaction.create({
      data: {
        userId: user?.id || 'anonymous',
        productId,
        type,
        context: context || 'FEED',
        sessionId,
        duration: duration ? parseInt(duration) : null,
        metadata: {
          ...metadata,
          country,
          userAgent: request.headers.get('user-agent'),
          timestamp: new Date().toISOString(),
          requestId
        }
      }
    });

    // Mettre à jour les compteurs
    if (type === 'VIEW') {
      await prisma.product.update({
        where: { id: productId },
        data: { viewCount: { increment: 1 } }
      }).catch(() => {});
    }
    
    if (type === 'PURCHASE') {
      await prisma.product.update({
        where: { id: productId },
        data: { purchaseCount: { increment: 1 } }
      }).catch(() => {});
    }

    return successResponse({ 
      id: interaction.id,
      message: 'Interaction enregistrée',
      requestId
    });

  } catch (error) {
    console.error(`❌ Track Error [${requestId}]:`, error);
    return errorResponse('Erreur lors du tracking', 500);
  }
}