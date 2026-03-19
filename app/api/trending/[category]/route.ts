import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Cache en mémoire simple
const cache = {
  data: null as any,
  timestamp: 0,
  ttl: 2 * 60 * 60 * 1000 // 2 heures en millisecondes
}

async function getAllCategoryIds(categoryId: string): Promise<string[]> {
  const ids = [categoryId]
  const children = await prisma.category.findMany({
    where: { parentId: categoryId },
    select: { id: true }
  })
  for (const child of children) {
    const childIds = await getAllCategoryIds(child.id)
    ids.push(...childIds)
  }
  return ids
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit')) || 4
    const category = "cuisine"

    console.log(`🔍 Recherche tendances pour: "${category}"`)

    // Vérifier si le cache est encore valide
    const now = Date.now()
    if (cache.data && (now - cache.timestamp) < cache.ttl) {
      console.log(`📦 Cache utilisé (expire dans ${Math.round((cache.ttl - (now - cache.timestamp)) / 1000 / 60)} minutes)`)
      return NextResponse.json(cache.data)
    }

    console.log(`🔄 Cache expiré, calcul des nouvelles tendances...`)

    // 1. Trouver la catégorie cuisine
    const mainCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { name: { contains: category, mode: 'insensitive' } },
          { slug: { contains: category, mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true }
    })

    if (!mainCategory) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: {
          category: category,
          found: false,
          message: `Catégorie "${category}" non trouvée`
        }
      })
    }

    console.log(`✅ Catégorie principale trouvée: ${mainCategory.name}`)

    // 2. Récupérer tous les IDs des catégories
    const allCategoryIds = await getAllCategoryIds(mainCategory.id)
    console.log(`📋 ${allCategoryIds.length} catégorie(s) incluses`)

    // 3. Récupérer les produits avec un ORDER BY qui change un peu
    // On ajoute un élément aléatoire pour que l'ordre change légèrement
    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        categoryId: { in: allCategoryIds }
      },
      orderBy: [
        { purchaseCount: 'desc' },
        { viewCount: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit * 2, // Prendre plus de produits pour pouvoir varier
      select: {
        id: true,
        title: true,
        price: true,
        images: true,
        purchaseCount: true,
        viewCount: true,
        createdAt: true
      }
    })

    console.log(`📦 ${products.length} produits trouvés`)

    // 4. Mélanger un peu pour que ce ne soit pas toujours les mêmes
    // Mais en gardant une tendance (les plus populaires reviennent souvent)
    const shuffled = [...products]
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Plus un produit est populaire, moins il a de chances d'être déplacé loin
      if (Math.random() > 0.3) continue // 70% de chance de garder l'ordre
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Prendre seulement 'limit' produits
    const selectedProducts = shuffled.slice(0, limit)

    // 5. Formater
    const formattedProducts = selectedProducts.map(p => ({
      id: p.id,
      name: p.title,
      price: p.price,
      image: p.images?.[0] || '/placeholder.jpg',
      stats: {
        purchases: p.purchaseCount,
        views: p.viewCount
      }
    }))

    // 6. Préparer la réponse
    const response = {
      success: true,
      data: formattedProducts,
      meta: {
        category: mainCategory.name,
        categoriesIncluded: allCategoryIds.length,
        total: products.length,
        limit: limit,
        cached: false,
        expiresIn: '2 heures'
      }
    }

    // Mettre en cache
    cache.data = response
    cache.timestamp = now

    console.log(`✅ Nouvelles tendances calculées et mises en cache`)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Erreur API trending:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}