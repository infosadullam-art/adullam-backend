import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helper'
import { z } from 'zod'

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3001'

export async function GET(req: NextRequest) {
  const headers = {
    'Access-Control-Allow-Origin': FRONTEND_URL,
    'Access-Control-Allow-Credentials': 'true',
  }

  try {
    const auth = await requireAuth(req)
    if ('error' in auth) return auth.error

    const wishlist = await prisma.wishlistItem.findMany({
      where: { userId: auth.user.userId },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            currency: true,
            images: true,
            slug: true
          }
        },
        variant: {
          select: {
            id: true,
            name: true,
            price: true,
            attributes: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: wishlist
    }, { headers })
  } catch (error) {
    console.error('Erreur wishlist:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500, headers }
    )
  }
}

const addToWishlistSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional()
})

export async function POST(req: NextRequest) {
  const headers = {
    'Access-Control-Allow-Origin': FRONTEND_URL,
    'Access-Control-Allow-Credentials': 'true',
  }

  try {
    const auth = await requireAuth(req)
    if ('error' in auth) return auth.error

    const body = await req.json()
    const validation = addToWishlistSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400, headers }
      )
    }

    const { productId, variantId } = validation.data

    // Vérifier si déjà dans la wishlist
    const existing = await prisma.wishlistItem.findFirst({
      where: {
        userId: auth.user.userId,
        productId,
        ...(variantId && { variantId })
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Produit déjà dans la wishlist' },
        { status: 409, headers }
      )
    }

    const item = await prisma.wishlistItem.create({
      data: {
        userId: auth.user.userId,
        productId,
        variantId
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            currency: true,
            images: true
          }
        }
      }
    })

    // Enregistrer l'interaction
    await prisma.interaction.create({
      data: {
        userId: auth.user.userId,
        productId,
        variantId,
        type: 'WISHLIST_ADD',
        context: 'PRODUCT_PAGE'
      }
    })

    return NextResponse.json({
      success: true,
      data: item
    }, { headers })
  } catch (error) {
    console.error('Erreur add to wishlist:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500, headers }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': FRONTEND_URL,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  })
}