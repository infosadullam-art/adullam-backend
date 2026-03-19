import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import Redis from 'ioredis'

// ✅ Configuration Redis avec variables d'environnement
const redis = new Redis({
  host: process.env.REDIS_HOST || 'positive-jay-73943.upstash.io',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  tls: process.env.REDIS_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  retryStrategy: (times) => {
    if (times > 3) {
      console.debug('⚠️ Redis: abandon après 3 tentatives')
      return null
    }
    return Math.min(times * 100, 3000)
  }
})

redis.on('error', (err) => {
  console.debug('⚠️ Redis erreur:', err.message)
})

redis.on('connect', () => {
  console.log('✅ Redis connecté')
})

// ✅ POIDS DES INTERACTIONS POUR ALS
const INTERACTION_WEIGHTS = {
  'VIEW': 1,
  'CLICK': 2,
  'ADD_TO_CART': 3,
  'PURCHASE': 5,
  'SHARE': 2,
  'WISHLIST': 2
} as const

type InteractionType = keyof typeof INTERACTION_WEIGHTS

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    const body = await req.json()
    
    // ✅ Récupérer ou créer un sessionId
    const cookieStore = await cookies()
    let sessionId = cookieStore.get('sessionId')?.value || body.sessionId
    
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      // Optionnel : sauvegarder dans un cookie
    }
    
    const { 
      productId, 
      variantId,
      type,
      context,
      duration,
      scrollDepth,
      returned,
      viewCount,
      referrer,
      searchQuery,
      metadata 
    } = body

    // Validation du type
    if (!type || !(type in INTERACTION_WEIGHTS)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Type invalide' 
      }, { status: 400 })
    }

    // Détection du pays
    const country = req.headers.get('cf-ipcountry') || 
                    req.headers.get('x-vercel-ip-country') || 
                    null

    // ✅ 1️⃣ ENREGISTRER L'INTERACTION
    const interaction = await prisma.interaction.create({
      data: {
        userId: user?.id || null,
        sessionId: sessionId || null,
        productId,
        variantId,
        type,
        context: context || 'FOR_YOU',
        deviceType: getDeviceType(req.headers.get('user-agent')),
        duration: duration ? parseFloat(duration) : null,
        scrollDepth: scrollDepth ? parseFloat(scrollDepth) : null,
        returned: returned || false,
        viewCount: viewCount || 1,
        referrer: referrer || req.headers.get('referer'),
        searchQuery,
        country,
        metadata: metadata || {},
        createdAt: new Date()
      }
    })

    // ✅ 2️⃣ METTRE À JOUR LES COMPTEURS PRODUIT
    if (productId) {
      const updates: any = {}
      
      if (type === 'VIEW') {
        updates.viewCount = { increment: viewCount || 1 }
      }
      if (type === 'PURCHASE') {
        updates.purchaseCount = { increment: 1 }
      }
      
      if (Object.keys(updates).length > 0) {
        try {
          await prisma.product.update({
            where: { id: productId },
            data: updates
          })
        } catch (e) {
          console.log(`⚠️ Impossible de mettre à jour les compteurs pour ${productId}:`, e)
        }
      }
    }

    // ✅ 3️⃣ PUBLIER POUR ALS INCRÉMENTAL
    if (user?.id && productId) {
      try {
        const weight = INTERACTION_WEIGHTS[type as InteractionType] || 1
        
        await redis.publish('user_interactions', JSON.stringify({
          user_id: user.id,
          product_id: productId,
          type: type,
          weight: weight,
          duration: duration || 0,
          timestamp: new Date().toISOString()
        }))
        
        console.log(`📤 Interaction publiée pour ALS: ${user.id} - ${productId} (poids: ${weight})`)
      } catch (pubError) {
        console.debug('⚠️ Publication ALS échouée:', pubError instanceof Error ? pubError.message : 'unknown error')
      }
    }

    // ✅ 4️⃣ METTRE À JOUR LA SESSION REDIS
    if (sessionId) {
      await updateRedisSession(sessionId, user?.id, {
        productId,
        type,
        duration: duration ? parseFloat(duration) : undefined,
        scrollDepth: scrollDepth ? parseFloat(scrollDepth) : undefined
      })

      // Mise à jour PostgreSQL en arrière-plan
      updateUserSession(sessionId, user?.id, {
        productId,
        type,
        duration: duration ? parseFloat(duration) : undefined,
        scrollDepth: scrollDepth ? parseFloat(scrollDepth) : undefined
      }).catch(console.error)
    }

    // ✅ 5️⃣ METTRE À JOUR LES PROFILS
    if (user?.id) {
      updateUserProfile(user.id, sessionId).catch(console.error)
    } else if (sessionId) {
      updateAnonymousProfile(sessionId, {
        productId,
        type,
        duration: duration ? parseFloat(duration) : undefined,
        country,
        deviceType: getDeviceType(req.headers.get('user-agent'))
      }).catch(console.error)
    }

    console.log(`📊 [${type}] ${productId || 'sans produit'} - Durée: ${duration || 0}s - Session: ${sessionId}`)

    return NextResponse.json({ 
      success: true, 
      id: interaction.id,
      sessionId 
    })

  } catch (error) {
    console.error('❌ Track error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// ============================================================
// ✅ FONCTIONS UTILITAIRES OPTIMISÉES
// ============================================================

async function updateRedisSession(
  sessionId: string, 
  userId: string | null | undefined,
  data: { 
    productId?: string; 
    type: string; 
    duration?: number;
    scrollDepth?: number;
  }
) {
  try {
    const sessionKey = `session:${sessionId}`
    const now = new Date().toISOString()
    
    let sessionData = await redis.get(sessionKey)
    let session = sessionData ? JSON.parse(sessionData) : {
      sessionId,
      userId,
      viewedProducts: [],
      clickedProducts: [],
      cartProducts: [],
      lastActivity: now,
      createdAt: now
    }

    // Mettre à jour selon le type
    if (data.type === 'VIEW' && data.productId) {
      session.viewedProducts.push({
        productId: data.productId,
        timestamp: now,
        duration: data.duration || 0,
        scrollDepth: data.scrollDepth || 0
      })
      session.viewedProducts = session.viewedProducts.slice(-50)
    }

    if (data.type === 'CLICK' && data.productId) {
      session.clickedProducts.push({
        productId: data.productId,
        timestamp: now
      })
      session.clickedProducts = session.clickedProducts.slice(-50)
    }

    if (data.type === 'ADD_TO_CART' && data.productId) {
      session.cartProducts.push({
        productId: data.productId,
        timestamp: now
      })
      session.cartProducts = session.cartProducts.slice(-50)
    }

    session.lastActivity = now
    session.userId = userId || session.userId

    await redis.setex(sessionKey, 86400, JSON.stringify(session))
    console.log(`✅ Redis session mise à jour: ${sessionId} (${session.viewedProducts.length} vues)`)

  } catch (error) {
    console.debug('⚠️ Redis indisponible:', error instanceof Error ? error.message : 'unknown error')
  }
}

async function updateUserSession(
  sessionId: string, 
  userId: string | null | undefined,
  data: { 
    productId?: string; 
    type: string; 
    duration?: number;
    scrollDepth?: number;
  }
) {
  try {
    const now = new Date()
    
    let session = await prisma.userSession.findUnique({
      where: { sessionId }
    })

    if (!session) {
      session = await prisma.userSession.create({
        data: {
          sessionId,
          userId: userId || null,
          startedAt: now,
          lastActivityAt: now,
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          viewedProducts: [],
          clickedProducts: [],
          ignoredProducts: [],
          scrollPattern: {},
          totalViewTime: 0,
          productsViewed: 0,
          productsClicked: 0,
          currentKeywords: [],
          currentPriceRange: {},
          sessionEmbedding: []
        }
      })
    }

    const updates: any = { lastActivityAt: now }

    if (data.type === 'VIEW' && data.productId) {
      const viewed = (session.viewedProducts as any[]) || []
      viewed.push({
        productId: data.productId,
        timestamp: now.toISOString(),
        duration: data.duration || 0,
        scrollDepth: data.scrollDepth || 0
      })
      updates.viewedProducts = viewed.slice(-50)
      updates.productsViewed = { increment: 1 }
      updates.totalViewTime = { increment: data.duration || 0 }
    }

    if (data.type === 'CLICK' && data.productId) {
      const clicked = (session.clickedProducts as any[]) || []
      clicked.push({
        productId: data.productId,
        timestamp: now.toISOString()
      })
      updates.clickedProducts = clicked.slice(-50)
      updates.productsClicked = { increment: 1 }
    }

    await prisma.userSession.update({
      where: { sessionId },
      data: updates
    })

  } catch (error) {
    console.error('❌ Erreur updateUserSession:', error)
  }
}

async function updateUserProfile(userId: string, sessionId: string) {
  try {
    const interactions = await prisma.interaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { product: { include: { category: true } } }
    })

    if (interactions.length === 0) return

    const categoryMap = new Map()
    let totalViewTime = 0
    let viewCount = 0
    let totalSpent = 0

    interactions.forEach(i => {
      if (i.product?.categoryId) {
        const catId = i.product.categoryId
        const current = categoryMap.get(catId) || { count: 0, weight: 0 }
        current.count++
        
        const weight = INTERACTION_WEIGHTS[i.type as InteractionType] || 0
        current.weight += weight
        
        categoryMap.set(catId, current)
      }
      
      if (i.duration) {
        totalViewTime += i.duration
        viewCount++
      }
    })

    const preferredCategories = Array.from(categoryMap.entries())
      .map(([id, data]) => ({ 
        categoryId: id, 
        weight: (data as any).weight,
        count: (data as any).count 
      }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10)

    const purchases = interactions.filter(i => i.type === 'PURCHASE')
    purchases.forEach(i => {
      if (i.product?.sellingPriceUSD) {
        totalSpent += i.product.sellingPriceUSD
      }
    })

    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        preferredCategories: JSON.stringify(preferredCategories),
        avgViewTime: viewCount > 0 ? totalViewTime / viewCount : undefined,
        totalSpentUSD: { increment: totalSpent },
        totalOrders: { increment: purchases.length },
        lastActiveAt: new Date(),
        avgBasketUSD: purchases.length > 0 ? totalSpent / purchases.length : undefined
      },
      create: {
        userId,
        preferredCategories: JSON.stringify(preferredCategories),
        avgViewTime: viewCount > 0 ? totalViewTime / viewCount : null,
        totalSpentUSD: totalSpent,
        totalOrders: purchases.length,
        lastActiveAt: new Date(),
        avgBasketUSD: purchases.length > 0 ? totalSpent / purchases.length : null,
        embedding: []
      }
    })

    console.log(`👤 Profil mis à jour pour ${userId}: ${preferredCategories.length} catégories, ${purchases.length} achats`)

  } catch (error) {
    console.error('❌ Erreur updateUserProfile:', error)
  }
}

async function updateAnonymousProfile(
  sessionId: string,
  data: { 
    productId?: string; 
    type: string; 
    duration?: number;
    country?: string | null;
    deviceType?: string | null;
  }
) {
  try {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    let profile = await prisma.anonymousProfile.findUnique({
      where: { sessionId }
    })

    if (!profile) {
      profile = await prisma.anonymousProfile.create({
        data: {
          sessionId,
          country: data.country,
          deviceType: data.deviceType,
          firstSeen: now,
          lastSeen: now,
          expiresAt,
          viewedCategories: [],
          viewedProducts: [],
          searchQueries: [],
          priceRangeSeen: {},
          interestVector: []
        }
      })
    }

    const updates: any = { lastSeen: now }

    if (data.type === 'VIEW' && data.productId) {
      const viewed = (profile.viewedProducts as any[]) || []
      const existingIndex = viewed.findIndex(v => v.productId === data.productId)
      
      if (existingIndex >= 0) {
        viewed[existingIndex].count = (viewed[existingIndex].count || 1) + 1
        viewed[existingIndex].totalDuration = (viewed[existingIndex].totalDuration || 0) + (data.duration || 0)
      } else {
        viewed.push({
          productId: data.productId,
          count: 1,
          totalDuration: data.duration || 0
        })
      }
      
      updates.viewedProducts = viewed.slice(-50)
    }

    await prisma.anonymousProfile.update({
      where: { sessionId },
      data: updates
    })

  } catch (error) {
    console.error('❌ Erreur updateAnonymousProfile:', error)
  }
}

function getDeviceType(userAgent: string | null): string | null {
  if (!userAgent) return null
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    return 'tablet'
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    return 'mobile'
  }
  return 'desktop'
}

// ✅ GET pour récupérer une session Redis
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'sessionId requis' }, { status: 400 })
    }

    const session = await redis.get(`session:${sessionId}`)
    return NextResponse.json({ 
      success: true, 
      data: session ? JSON.parse(session) : null 
    })

  } catch (error) {
    console.error('❌ Erreur GET session:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}