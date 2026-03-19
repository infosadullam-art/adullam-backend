import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Cache plus court pour mobile (30 minutes)
const cache = {
  data: null as any,
  timestamp: 0,
  ttl: 30 * 60 * 1000 // 30 minutes
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier le cache
    const now = Date.now()
    if (cache.data && (now - cache.timestamp) < cache.ttl) {
      console.log('📦 Cache meilleures ventes mobile utilisé')
      return NextResponse.json(cache.data)
    }

    console.log('🔄 Récupération des meilleures ventes mobile...')

    // Récupérer les produits les plus vendus
    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE'
      },
      orderBy: [
        { purchaseCount: 'desc' },  // Les plus vendus d'abord
        { viewCount: 'desc' },       // Puis les plus vus
        { createdAt: 'desc' }        // Enfin les plus récents
      ],
      take: 8, // 8 produits pour le carrousel
      select: {
        id: true,
        title: true,
        price: true,
        images: true,
        purchaseCount: true,
        viewCount: true
      }
    })

    console.log(`📦 ${products.length} produits trouvés`)

    // Formater les produits
    const formattedProducts = products.map(p => ({
      id: p.id,
      name: p.title,
      priceUSD: p.price,
      image: p.images?.[0] || '/placeholder.jpg'
      // Stats supprimées pour alléger la réponse
    }))

    // Préparer la réponse
    const response = {
      success: true,
      data: formattedProducts,
      meta: {
        total: products.length,
        cached: false,
        expiresIn: '30 minutes'
      }
    }

    // Mettre en cache
    cache.data = response
    cache.timestamp = now

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Erreur API meilleures ventes mobile:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}