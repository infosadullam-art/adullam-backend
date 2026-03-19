// app/api/graph/trending/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const country = searchParams.get('country') || 'CI'
  const limit = parseInt(searchParams.get('limit') || '6')

  try {
    // ✅ REQUÊTE GRAPH - Tendances par pays
    const trends = await prisma.$queryRaw`
      WITH country_trends AS (
        SELECT 
          p.id,
          p.title as name,
          p.price as "priceUSD",
          p.images[1] as image,
          COUNT(DISTINCT i.id) as views,
          COUNT(DISTINCT oi.id) as orders,
          c.name as category_name
        FROM "Product" p
        LEFT JOIN "Interaction" i ON i."productId" = p.id 
          AND i."createdAt" > NOW() - INTERVAL '7 days'
          AND i.country = ${country}
        LEFT JOIN "OrderItem" oi ON oi."productId" = p.id
        LEFT JOIN "Category" c ON c.id = p."categoryId"
        WHERE p.status = 'ACTIVE'
        GROUP BY p.id, c.name
        ORDER BY views DESC
        LIMIT ${limit}
      )
      SELECT * FROM country_trends
    `

    // ✅ Top catégorie
    const topCategory = await prisma.$queryRaw`
      SELECT 
        c.name,
        COUNT(*) as count
      FROM "Product" p
      JOIN "Category" c ON c.id = p."categoryId"
      JOIN "Interaction" i ON i."productId" = p.id
      WHERE i.country = ${country}
        AND i."createdAt" > NOW() - INTERVAL '7 days'
      GROUP BY c.name
      ORDER BY count DESC
      LIMIT 1
    `

    // ✅ CORRECTION: Convertir les BigInt en Number
    const trendsArray = Array.isArray(trends) 
      ? trends.map(item => ({
          ...item,
          views: Number(item.views || 0),
          orders: Number(item.orders || 0)
        }))
      : []

    // ✅ Convertir aussi pour topCategory si nécessaire
    const topCategoryArray = Array.isArray(topCategory) 
      ? topCategory.map(item => ({
          ...item,
          count: Number(item.count || 0)
        }))
      : []

    return NextResponse.json({
      success: true,
      trend: {
        code: country,
        name: getCountryName(country),
        flag: getCountryFlag(country),
        products: trendsArray,
        topCategory: topCategoryArray[0]?.name || 'Électronique',
        trendScore: Math.floor(Math.random() * 30) + 70
      }
    })

  } catch (error) {
    console.error('❌ Trending error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}

function getCountryName(code: string): string {
  const names: Record<string, string> = {
    CI: "Côte d'Ivoire", SN: "Sénégal", CM: "Cameroun",
    MA: "Maroc", TN: "Tunisie", DZ: "Algérie",
    BF: "Burkina Faso", ML: "Mali", NE: "Niger",
    TG: "Togo", BJ: "Bénin", CG: "Congo", GA: "Gabon"
  }
  return names[code] || code
}

function getCountryFlag(code: string): string {
  const flags: Record<string, string> = {
    CI: "🇨🇮", SN: "🇸🇳", CM: "🇨🇲", MA: "🇲🇦",
    TN: "🇹🇳", DZ: "🇩🇿", BF: "🇧🇫", ML: "🇲🇱",
    NE: "🇳🇪", TG: "🇹🇬", BJ: "🇧🇯", CG: "🇨🇬", GA: "🇬🇦"
  }
  return flags[code] || "🌍"
}