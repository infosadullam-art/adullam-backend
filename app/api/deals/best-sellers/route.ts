// app/api/deals/best-sellers/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get('limit')) || 3

  try {
    // Récupérer les meilleures ventes
    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE'
      },
      orderBy: {
        purchaseCount: 'desc'  // Les plus vendus d'abord
      },
      take: limit,
      select: {
        id: true,
        title: true,
        price: true,
        images: true,
        purchaseCount: true,
        createdAt: true
      }
    })

    // Formater la réponse
    const formattedProducts = products.map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      image: p.images[0] || '/placeholder.jpg',
      badge: p.purchaseCount > 1000 ? '🔥 Meilleure vente' : undefined
    }))

    return NextResponse.json({
      success: true,
      data: formattedProducts
    })

  } catch (error) {
    console.error('❌ Erreur API best-sellers:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}