import { NextResponse, NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import redis from '@/lib/redis-client'

// 🔷 ID par défaut pour les produits sans variante
const DEFAULT_VARIANT_ID = "00000000-0000-0000-0000-000000000000"

// 🔷 URL des services Python - VERSION RAILWAY
const REALTIME_SERVICE_URL = process.env.REALTIME_SERVICE_URL || 'https://laudable-integrity-production-5344.up.railway.app'

// ============================================================
// ✅ FONCTION POUR OBTENIR LE POIDS SELON LE TYPE
// ============================================================
function getInteractionWeight(type: string): number {
  switch(type) {
    case 'PURCHASE': return 5.0;
    case 'ADD_TO_CART': return 3.0;
    case 'CLICK': return 2.0;
    case 'VIEW': return 1.0;
    default: return 1.0;
  }
}

// ============================================================
// ✅ PUBLIER LES INTERACTIONS AU SERVICE TEMPS RÉEL
// ============================================================
async function publishInteractionToRealtime(
  userId: string | null,
  productId: string,
  interactionType: 'VIEW' | 'CLICK' | 'ADD_TO_CART' | 'PURCHASE',
  sessionId: string,
  metadata?: any
) {
  const weight = getInteractionWeight(interactionType);
  
  // Publication asynchrone - on ne bloque pas la réponse
  fetch(`${REALTIME_SERVICE_URL}/api/external-interaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId || 'anonymous',
      product_id: productId,
      session_id: sessionId,
      type: interactionType,
      weight: weight,
      source: metadata?.source || 'unknown',
      reason: metadata?.reason,
      metadata: {
        ...metadata,
        weight,
        price: metadata?.price,
        page: metadata?.page,
        position: metadata?.position
      },
      timestamp: new Date().toISOString()
    })
  }).catch(err => {
    console.log(`⚠️ Realtime (${REALTIME_SERVICE_URL}) non disponible: ${err.message}`);
  });
}

// ============================================================
// ✅ ENDPOINT GET (RECOMMANDATIONS) - ARCHITECTURE OPTIMISÉE
// ============================================================
export async function GET(req: NextRequest) {
  try {
    // 1️⃣ Récupérer l'utilisateur (si connecté) et la session
    const user = await getUserFromRequest(req).catch(() => null)
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('sessionId')?.value
    
    // Si pas de sessionId, en créer un nouveau
    const effectiveSessionId = sessionId || crypto.randomUUID()

    // 2️⃣ Pagination et exclusion
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '24')
    const seenIdsParam = searchParams.get('seenIds') || ''
    const seenIds = seenIdsParam ? seenIdsParam.split(',') : []
    
    console.log(`📦 Page ${page} - ${seenIds.length} déjà vus - User: ${user?.id || 'anonyme'}`)

    // ============================================
    // 🔥 ÉTAPE 1: VÉRIFIER LE CACHE REDIS
    // ============================================
    const cacheKey = `foryou:${user?.id || 'anon'}:${effectiveSessionId}:${page}:${seenIds.length}`;
    
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log(`✅ Cache Redis HIT pour ${cacheKey}`);
        const cachedData = JSON.parse(cached);
        
        // Vérifier que le cache n'est pas trop vieux (5 minutes)
        const cacheAge = Date.now() - (cachedData.timestamp || 0);
        if (cacheAge < 5 * 60 * 1000) {
          return NextResponse.json(cachedData.data);
        } else {
          console.log(`⚠️ Cache expiré (${Math.round(cacheAge/1000)}s), recalcul...`);
        }
      } else {
        console.log(`❌ Cache Redis MISS pour ${cacheKey}`);
      }
    } catch (redisError) {
      console.log('⚠️ Redis indisponible, passage en mode HTTP:', redisError.message);
    }

    // ============================================
    // 🔥 ÉTAPE 2: SERVICE TEMPS RÉEL (HTTP)
    // ============================================
    let recommendations: any[] = []
    let pythonMeta = {}
    let serviceUsed = 'fallback'
    
    try {
      console.log(`🐍 Appel HTTP du service TEMPS RÉEL (${REALTIME_SERVICE_URL}) pour ${user?.id || 'anonymous'}`)
      
      let url = `${REALTIME_SERVICE_URL}/api/recommendations/${user?.id || 'anonymous'}?session_id=${effectiveSessionId}&limit=${limit}&page=${page}`
      
      if (seenIds.length > 0) {
        url += `&seen_ids=${seenIds.join(',')}`
      }
      
      const realtimeResponse = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(6000) // 6 secondes timeout
      })

      if (realtimeResponse.ok) {
        const realtimeData = await realtimeResponse.json()
        
        if (realtimeData.success && realtimeData.data && realtimeData.data.length > 0) {
          const productIds = realtimeData.data.map((item: any) => item.id).filter(Boolean)
          
          let productsMap = new Map()
          if (productIds.length > 0) {
            const products = await prisma.product.findMany({
              where: {
                id: { in: productIds },
                status: 'ACTIVE'
              },
              select: {
                id: true,
                title: true,
                price: true,
                sellingPriceUSD: true,
                images: true,
                avgRating: true,
                status: true,
                categoryId: true
              }
            })
            productsMap = new Map(products.map(p => [p.id, p]))
          }
          
          recommendations = realtimeData.data
            .map((item: any) => {
              const product = productsMap.get(item.id)
              if (!product) return null
              
              console.log(`🔍 Produit reçu: ${item.id} - source: ${item.source} - reason: ${item.reason}`);
              
              return {
                id: item.id,
                name: product.title || 'Produit sans nom',
                title: product.title || 'Produit sans nom',
                priceUSD: product.sellingPriceUSD ?? product.price ?? 0,
                image: product.images?.[0] || '/placeholder.jpg',
                rating: product.avgRating ?? 4.5,
                status: product.status,
                isSeed: false,
                forYouScore: item.score || 0.5,
                reason: item.reason || generateReasonFromSource(item.source),
                source: item.source || 'realtime',
                categoryId: product.categoryId,
                scores: item.sources,
                type: item.type || 'prediction'
              }
            })
            .filter(Boolean)

          pythonMeta = realtimeData.meta || {}
          serviceUsed = 'realtime'
          
          console.log(`✅ ${recommendations.length} recommandations temps réel reçues`)
          console.log(`📊 Sources: ${recommendations.map(r => r.source).join(', ')}`);
        } else {
          console.log(`ℹ️ Service temps réel a retourné 0 recommandations`)
        }
      } else {
        console.log(`⚠️ Service temps réel a répondu avec le statut ${realtimeResponse.status}`)
      }
    } catch (httpError) {
      console.log('⏱️ Service temps réel indisponible (timeout ou erreur), utilisation du fallback...')
    }

    // ============================================
    // ✅ ÉTAPE 3: FALLBACK BASE DE DONNÉES
    // ============================================
    if (recommendations.length === 0) {
      console.log('📢 Fallback → recommandations depuis la base de données')
      recommendations = await getFallbackRecommendations(
        user,
        effectiveSessionId,
        page,
        limit,
        seenIds
      )
      serviceUsed = 'fallback'
    }

    // ============================================
    // ✅ PAGINATION
    // ============================================
    const hasMore = pythonMeta.hasMore ?? false

    console.log(`✅ ${recommendations.length} recommandations générées (source: ${serviceUsed})`)

    // ============================================
    // 💾 SAUVEGARDER DANS REDIS POUR LES PROCHAINES FOIS
    // ============================================
    if (recommendations.length > 0) {
      try {
        await redis.setex(
          cacheKey,
          300, // 5 minutes
          JSON.stringify({
            timestamp: Date.now(),
            data: {
              success: true,
              data: recommendations,
              meta: {
                page,
                limit,
                total: recommendations.length,
                hasMore,
                nextPage: hasMore ? page + 1 : null,
                source: serviceUsed,
                weights: pythonMeta.weights,
                prediction_count: pythonMeta.prediction_count,
                diversity_count: pythonMeta.diversity_count
              }
            }
          })
        );
        console.log(`✅ Cache Redis sauvegardé pour ${cacheKey}`);
      } catch (e) {
        console.log('⚠️ Impossible de sauvegarder dans Redis:', e.message);
      }
    }

    // Sauvegarder en cache Prisma si utilisateur connecté
    if (user?.id && recommendations.length > 0) {
      await cacheRecommendations(user.id, recommendations, serviceUsed)
    }

    return NextResponse.json({
      success: true,
      data: recommendations,
      meta: {
        page,
        limit,
        total: recommendations.length,
        hasMore,
        nextPage: hasMore ? page + 1 : null,
        source: serviceUsed,
        weights: pythonMeta.weights,
        prediction_count: pythonMeta.prediction_count,
        diversity_count: pythonMeta.diversity_count
      }
    })

  } catch (error) {
    console.error('❌ For You API Error:', error)
    return getUltimateFallback()
  }
}

// ============================================================
// ✅ ENDPOINT POST - REÇOIT LES INTERACTIONS
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      productId, 
      type, 
      sessionId, 
      userId, 
      context,
      metadata 
    } = body;
    
    const weight = getInteractionWeight(type);
    
    console.log(`📨 Interaction reçue: ${type} (poids:${weight}) - ${productId} (session: ${sessionId})`);
    
    try {
      await prisma.interaction.create({
        data: {
          userId: userId || 'anonymous',
          productId,
          variantId: DEFAULT_VARIANT_ID,
          type,
          weight,
          context: context || 'FOR_YOU',
          metadata: { ...metadata, weight },
          sessionId,
          timestamp: new Date()
        }
      });
    } catch (dbError) {
      console.log('⚠️ Erreur sauvegarde base:', dbError.message);
    }
    
    // Publier seulement au service temps réel (l'ALS est géré par Redis)
    await publishInteractionToRealtime(
      userId,
      productId,
      type,
      sessionId,
      { ...metadata, weight }
    );
    
    // Invalider le cache Redis pour cet utilisateur
    if (userId) {
      try {
        const keys = await redis.keys(`foryou:${userId}:*`);
        if (keys.length > 0) {
          await redis.del(...keys);
          console.log(`✅ Cache Redis invalidé pour l'utilisateur ${userId}`);
        }
      } catch (e) {
        console.log('⚠️ Erreur invalidation cache:', e.message);
      }
    }
    
    if (type === 'PURCHASE' && productId) {
      try {
        await prisma.product.update({
          where: { id: productId },
          data: { purchaseCount: { increment: 1 } }
        });
        console.log(`💰 Compteur d'achats incrémenté pour ${productId}`);
      } catch (e) {
        console.log('⚠️ Erreur mise à jour compteur:', e.message);
      }
    }
    
    return NextResponse.json({ success: true, weight });
    
  } catch (error) {
    console.error('❌ Erreur POST interaction:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// ============================================================
// FONCTIONS UTILITAIRES (inchangées)
// ============================================================

async function getFallbackRecommendations(
  user: any,
  sessionId: string,
  page: number,
  limit: number,
  seenIds: string[]
): Promise<any[]> {
  
  if (user?.id) {
    const cachedScores = await prisma.forYouScore.findMany({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() },
        product: { 
          status: 'ACTIVE',
          id: { notIn: seenIds }
        }
      },
      orderBy: { score: 'desc' },
      take: limit,
      include: { 
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            sellingPriceUSD: true,
            images: true,
            avgRating: true,
            status: true
          }
        }
      }
    })

    if (cachedScores.length > 0) {
      console.log(`📦 Fallback cache: ${cachedScores.length} scores trouvés`)
      return cachedScores.map(({ product, score, factors }) => ({
        id: product.id,
        name: product.title || 'Produit sans nom',
        title: product.title || 'Produit sans nom',
        priceUSD: product.sellingPriceUSD ?? product.price ?? 0,
        image: product.images?.[0] || '/placeholder.jpg',
        rating: product.avgRating ?? 4.5,
        status: product.status,
        isSeed: false,
        forYouScore: score,
        reason: generateReasonFromFactors(factors) || 'Recommandé pour vous',
        source: 'cache',
        type: 'prediction'
      }))
    }
  }

  console.log('📢 Fallback → produits populaires')
  
  const popularProducts = await prisma.product.findMany({
    where: { 
      status: 'ACTIVE',
      id: { notIn: seenIds }
    },
    orderBy: [
      { purchaseCount: 'desc' },
      { viewCount: 'desc' },
      { createdAt: 'desc' }
    ],
    take: limit,
    skip: (page - 1) * limit
  })

  if (popularProducts.length === 0) {
    const allProducts = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      take: limit,
      skip: (page - 1) * limit
    })

    return allProducts.map((p, index) => ({
      id: p.id,
      name: p.title || 'Produit sans nom',
      title: p.title || 'Produit sans nom',
      priceUSD: p.sellingPriceUSD ?? p.price ?? 0,
      image: p.images?.[0] || '/placeholder.jpg',
      rating: p.avgRating ?? 4.5,
      status: p.status,
      isSeed: false,
      forYouScore: 0.7 - (index * 0.02),
      reason: 'Nouveauté',
      source: 'fallback_total',
      type: 'diversity'
    }))
  }

  return popularProducts.map((p, index) => ({
    id: p.id,
    name: p.title || 'Produit sans nom',
    title: p.title || 'Produit sans nom',
    priceUSD: p.sellingPriceUSD ?? p.price ?? 0,
    image: p.images?.[0] || '/placeholder.jpg',
    rating: p.avgRating ?? 4.5,
    status: p.status,
    isSeed: false,
    forYouScore: Math.max(0.5, 0.8 - (index * 0.03)),
    reason: 'Populaire',
    source: 'popular',
    type: 'trending'
  }))
}

async function cacheRecommendations(userId: string, recommendations: any[], source: string) {
  for (const item of recommendations) {
    try {
      const existing = await prisma.forYouScore.findFirst({
        where: {
          userId,
          productId: item.id,
          variantId: DEFAULT_VARIANT_ID,
          version: 1
        }
      });

      if (existing) {
        await prisma.forYouScore.update({
          where: { id: existing.id },
          data: {
            score: item.forYouScore || 0.5,
            factors: { 
              source,
              reason: item.reason,
              type: item.type,
              ...item.scores
            },
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        });
      } else {
        await prisma.forYouScore.create({
          data: {
            userId,
            productId: item.id,
            variantId: DEFAULT_VARIANT_ID,
            score: item.forYouScore || 0.5,
            factors: { 
              source,
              reason: item.reason,
              type: item.type,
              ...item.scores
            },
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            version: 1,
            context: source
          }
        });
      }
    } catch (e) {
      console.debug(`Cache non critique pour ${item.id}:`, e.message);
    }
  }
}

function generateReasonFromSource(source: string): string {
  switch(source) {
    case 'session_graph':
    case 'session':
      return 'Similaire à ce que vous avez regardé';
    case 'als':
      return 'Basé sur vos préférences';
    case 'trend':
      return 'Tendance du moment';
    case 'new':
      return 'Nouveauté à découvrir';
    case 'random':
      return 'Pour varier les découvertes';
    case 'popular':
      return 'Populaire en ce moment';
    case 'emergency':
      return 'Recommandation';
    default:
      return 'Recommandé pour vous';
  }
}

function generateReasonFromFactors(factors: any): string {
  if (!factors) return 'Recommandé pour vous'
  if (factors.source === 'realtime') return 'Basé sur votre navigation'
  if (factors.type === 'diversity') {
    if (factors.source === 'popular') return 'Populaire en ce moment'
    if (factors.source === 'new') return 'Nouveauté'
    if (factors.source === 'random') return 'Découverte'
  }
  if (factors.similarity > 10) return 'Tendance populaire'
  if (factors.weight > 20) return 'Souvent acheté ensemble'
  return 'Basé sur vos préférences'
}

function getUltimateFallback() {
  return NextResponse.json({
    success: true,
    data: [],
    meta: { 
      source: 'error_fallback',
      hasMore: false,
      nextPage: null
    }
  })
}