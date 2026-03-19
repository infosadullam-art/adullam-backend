import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // HOMMES
    const menCategory = await prisma.category.findFirst({
      where: { slug: 't-shirts-homme' }
    })
    const menProducts = menCategory ? await prisma.product.findMany({
      where: { status: 'ACTIVE', categoryId: menCategory.id },
      take: 4,
      select: { id: true, title: true, price: true, images: true }
    }) : []

    // FEMMES
    const womenCategory = await prisma.category.findFirst({
      where: { slug: 'robes' }
    })
    const womenProducts = womenCategory ? await prisma.product.findMany({
      where: { status: 'ACTIVE', categoryId: womenCategory.id },
      take: 4,
      select: { id: true, title: true, price: true, images: true }
    }) : []

    // ENFANTS
    const kidsCategory = await prisma.category.findFirst({
      where: { slug: 'chaussures' }
    })

    let kidsProducts: any[] = []
    if (kidsCategory) {
      const allShoes = await prisma.product.findMany({
        where: { status: 'ACTIVE', categoryId: kidsCategory.id },
        select: { id: true, title: true, price: true, images: true }
      })

      // Mots-clés pour identifier les chaussures enfants
      const kidsKeywords = ['enfant', 'kid', 'baby', 'bébé', 'junior', 'fille', 'garçon']
      
      // Filtrer les chaussures enfants
      kidsProducts = allShoes
        .filter(p => kidsKeywords.some(k => p.title.toLowerCase().includes(k)))
        .sort(() => Math.random() - 0.5)
        .slice(0, 4)

      // Si pas assez de chaussures enfants, prendre des chaussures génériques
      if (kidsProducts.length < 4) {
        const genericShoes = allShoes
          .filter(p => !kidsKeywords.some(k => p.title.toLowerCase().includes(k)))
          .sort(() => Math.random() - 0.5)
          .slice(0, 4 - kidsProducts.length)
        
        kidsProducts = [...kidsProducts, ...genericShoes]
      }
    }

    // Formatage
    const format = (products: any[]) => products.map(p => ({
      id: p.id,
      name: p.title,
      priceUSD: p.price,
      image: p.images?.[0] || '/placeholder.jpg',
      moq: Math.floor(Math.random() * 10) + 5
    }))

    return NextResponse.json({
      success: true,
      data: {
        men: format(menProducts),
        women: format(womenProducts),
        kids: format(kidsProducts)
      }
    })

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}