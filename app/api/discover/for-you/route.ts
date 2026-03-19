// app/api/discover/for-you/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Configuration de la rotation
const ROTATION_HOURS = 3 // Change toutes les 3 heures

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get('limit')) || 8
  const country = searchParams.get('country') || 'CI'

  try {
    // Calculer le seed basé sur l'heure actuelle (change toutes les X heures)
    const now = new Date()
    const hoursSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60 * ROTATION_HOURS))
    
    // Utiliser ce seed pour avoir des résultats différents mais déterministes
    const seed = hoursSinceEpoch % 1000

    // 1️⃣ Mélanger les produits populaires + nouveautés
    const products = await prisma.$queryRaw`
      WITH popular_products AS (
        SELECT 
          p.id,
          p.title,
          p.price,
          p.images,
          (p."purchaseCount" * 2 + p."viewCount") as popularity_score,
          EXTRACT(EPOCH FROM p."createdAt") as recency
        FROM "Product" p
        WHERE p.status = 'ACTIVE'
      )
      SELECT 
        id,
        title,
        price,
        images,
        -- Mélange basé sur le seed
        (popularity_score * 0.7 + recency * 0.3 + ${seed} % 100) as mix_score
      FROM popular_products
      ORDER BY mix_score DESC
      LIMIT ${limit}
    `

    const formattedProducts = (products as any[]).map(p => ({
      id: p.id,
      name: p.title,
      price: p.price,
      image: p.images?.[0] || '/placeholder.jpg'
    }))

    // Ajouter des métadonnées sur la rotation
    const nextRotation = new Date(now.getTime() + ROTATION_HOURS * 60 * 60 * 1000)

    return NextResponse.json({
      success: true,
      data: formattedProducts,
      meta: {
        rotation: `Toutes les ${ROTATION_HOURS} heures`,
        nextRotation: nextRotation.toISOString(),
        currentSeed: seed,
        country
      }
    })

  } catch (error) {
    console.error('❌ Erreur API discover:', error)
    
    // Fallback
    const fallbackProducts = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { viewCount: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        price: true,
        images: true
      }
    })

    return NextResponse.json({
      success: true,
      data: fallbackProducts.map(p => ({
        id: p.id,
        name: p.title,
        price: p.price,
        image: p.images?.[0] || '/placeholder.jpg'
      })),
      meta: { fallback: true }
    })
  }
}