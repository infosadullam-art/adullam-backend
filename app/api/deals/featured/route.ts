// app/api/deals/featured/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get('limit')) || 3

  try {
    // Récupérer les produits mis en avant (featured = true)
    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        featured: true
      },
      orderBy: {
        createdAt: 'desc'  // Les plus récents d'abord
      },
      take: limit,
      select: {
        id: true,
        title: true,
        price: true,
        images: true,
        viewCount: true,
        purchaseCount: true,
        createdAt: true
      }
    })

    // Si pas assez de produits featured, compléter avec des récents
    if (products.length < limit) {
      const remaining = limit - products.length
      const recentProducts = await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          id: { notIn: products.map(p => p.id) }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: remaining,
        select: {
          id: true,
          title: true,
          price: true,
          images: true,
          viewCount: true,
          purchaseCount: true,
          createdAt: true
        }
      })
      
      products.push(...recentProducts)
    }

    // Formater la réponse
    const formattedProducts = products.map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      image: p.images[0] || '/placeholder.jpg',
      badge: p.purchaseCount > 1000 ? 'Populaire' : 
             p.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? 'Nouveau' : 
             undefined
    }))

    return NextResponse.json({
      success: true,
      data: formattedProducts
    })

  } catch (error) {
    console.error('❌ Erreur API featured:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}