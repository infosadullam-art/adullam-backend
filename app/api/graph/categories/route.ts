// app/api/graph/categories/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const country = searchParams.get('country') || 'CI'
  const limit = parseInt(searchParams.get('limit') || '12')
  
  const session = await getServerSession()
  const userId = session?.user?.id

  try {
    // ============================================
    // 🧠 REQUÊTE GRAPH - Catégories personnalisées
    // ============================================
    const categories = await prisma.$queryRaw`
      WITH user_interests AS (
        SELECT 
          c.id,
          c.name,
          c.slug,
          c.image,
          COUNT(p.id) as product_count,
          COALESCE(SUM(
            CASE 
              WHEN i."userId" = ${userId} THEN 2.0
              ELSE 0.5
            END *
            CASE 
              WHEN i.type = 'PURCHASE' THEN 3
              WHEN i.type = 'ADD_TO_CART' THEN 2
              WHEN i.type = 'VIEW' THEN 1
              ELSE 0.5
            END
          ), 0) + 
          COALESCE((
            SELECT COUNT(*) * 0.1
            FROM "Product" p2
            WHERE p2."categoryId" = c.id
            AND p2."createdAt" > NOW() - INTERVAL '7 days'
          ), 0) as relevance_score
        FROM "Category" c
        LEFT JOIN "Product" p ON p."categoryId" = c.id AND p.status = 'ACTIVE'
        LEFT JOIN "Interaction" i ON i."productId" = p.id
          AND i."createdAt" > NOW() - INTERVAL '30 days'
        GROUP BY c.id
        ORDER BY relevance_score DESC
        LIMIT ${limit}
      )
      SELECT * FROM user_interests
    `

    // ✅ Convertir les BigInt en Number
    const serializedCategories = (categories as any[]).map(cat => ({
      ...cat,
      product_count: Number(cat.product_count),
      relevance_score: Number(cat.relevance_score)
    }))

    return NextResponse.json({
      success: true,
      categories: serializedCategories,
      meta: {
        country,
        personalized: !!userId,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Graph categories error:', error)
    
    // Fallback élégant
    const fallback = await prisma.category.findMany({
      take: limit,
      orderBy: { products: { _count: 'desc' } },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        _count: { select: { products: true } }
      }
    })

    return NextResponse.json({
      success: true,
      categories: fallback.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.image,
        productCount: Number(c._count.products),
        score: 0.5
      })),
      fallback: true
    })
  }
}