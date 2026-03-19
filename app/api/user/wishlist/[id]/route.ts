import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helper'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(req)
    if ('error' in auth) return auth.error

    const item = await prisma.wishlistItem.findFirst({
      where: {
        id: params.id,
        userId: auth.user.userId
      }
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Élément introuvable' },
        { status: 404 }
      )
    }

    await prisma.wishlistItem.delete({
      where: { id: params.id }
    })

    // Enregistrer l'interaction
    await prisma.interaction.create({
      data: {
        userId: auth.user.userId,
        productId: item.productId,
        variantId: item.variantId,
        type: 'WISHLIST_REMOVE',
        context: 'PRODUCT_PAGE'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Retiré des favoris'
    })
  } catch (error) {
    console.error('Erreur remove from wishlist:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}