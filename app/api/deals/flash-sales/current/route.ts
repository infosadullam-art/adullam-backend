// app/api/deals/flash-sales/current/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Récupérer la vente flash active la plus proche
    const activeSale = await prisma.flashSale.findFirst({
      where: {
        status: 'ACTIVE',
        endTime: { gt: new Date() }
      },
      orderBy: { endTime: 'asc' },
      include: { product: true }
    })

    if (!activeSale) {
      // Pas de vente flash active, timer à 0 ou valeur par défaut
      return NextResponse.json({
        success: true,
        hasActiveSale: false,
        timeLeft: { hours: 0, minutes: 0, seconds: 0 }
      })
    }

    // Calculer le temps restant
    const now = new Date()
    const diffMs = activeSale.endTime.getTime() - now.getTime()
    const totalSeconds = Math.floor(diffMs / 1000)
    
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return NextResponse.json({
      success: true,
      hasActiveSale: true,
      sale: {
        id: activeSale.id,
        productId: activeSale.productId,
        productName: activeSale.product.title,
        discount: activeSale.discount,
        originalPrice: activeSale.product.price,
        discountedPrice: activeSale.product.price * (1 - activeSale.discount / 100)
      },
      timeLeft: { hours, minutes, seconds }
    })

  } catch (error) {
    console.error('❌ Erreur flash sale:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}