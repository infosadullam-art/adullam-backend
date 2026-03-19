// app/api/search/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.toLowerCase() || ''
  const category = searchParams.get('category')
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null
  const sort = searchParams.get('sort') || 'relevance'
  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || 20

  try {
    // Construction de la requête Prisma selon TA structure
    const where: any = {
      status: 'ACTIVE' // Seulement les produits actifs
    }

    // Recherche textuelle (titre, description, tags)
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } },
        { sku: { contains: query, mode: 'insensitive' } }
      ]
    }

    // Filtre par catégorie
    if (category) {
      where.category = {
        slug: category
      }
    }

    // Filtre par prix (en USD dans ta DB)
    if (minPrice !== null || maxPrice !== null) {
      where.price = {}
      if (minPrice !== null) where.price.gte = minPrice
      if (maxPrice !== null) where.price.lte = maxPrice
    }

    // Options de tri
    let orderBy: any = {}
    switch (sort) {
      case 'price-asc':
        orderBy = { price: 'asc' }
        break
      case 'price-desc':
        orderBy = { price: 'desc' }
        break
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      case 'rating':
        orderBy = { avgRating: 'desc' }
        break
      case 'popular':
        orderBy = { purchaseCount: 'desc' }
        break
      default:
        if (query) {
          // Tri par pertinence (ordre alphabétique pour commencer)
          orderBy = { title: 'asc' }
        } else {
          orderBy = { createdAt: 'desc' }
        }
    }

    // Récupérer les catégories pour les filtres
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: { products: true }
        }
      }
    })

    // Compter le nombre total de produits
    const total = await prisma.product.count({ where })

    // Si aucun produit trouvé
    if (total === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0
        },
        filters: {
          categories: categories.map(c => ({
            name: c.name,
            slug: c.slug,
            count: c._count.products
          })),
          priceRange: {
            min: 0,
            max: 0
          }
        },
        query
      })
    }

    // Récupérer les produits avec leurs relations
    const products = await prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: true,
        variants: {
          take: 3 // Pour afficher quelques variantes si besoin
        }
      }
    })

    // Stats de prix pour les filtres
    const priceStats = await prisma.product.aggregate({
      where,
      _min: { price: true },
      _max: { price: true }
    })

    // Formatage des résultats selon TA structure
    const formattedProducts = products.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price, // ✅ Prix en USD dans ta DB
      category: p.category?.name || 'Non catégorisé',
      categorySlug: p.category?.slug || '',
      image: p.images && p.images[0] ? p.images[0] : '/placeholder.jpg',
      images: p.images, // Toutes les images
      rating: p.avgRating || 0,
      reviews: 0, // À calculer si tu as des avis
      inStock: p.stock > 0,
      sku: p.sku,
      slug: p.slug,
      variants: p.variants.map(v => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        price: v.price,
        stock: v.stock,
        image: v.image
      }))
    }))

    return NextResponse.json({
      success: true,
      data: formattedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        categories: categories.map(c => ({
          name: c.name,
          slug: c.slug,
          count: c._count.products
        })),
        priceRange: {
          min: priceStats._min.price || 0,
          max: priceStats._max.price || 0
        }
      },
      query
    })

  } catch (error) {
    console.error('❌ Search error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la recherche',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}