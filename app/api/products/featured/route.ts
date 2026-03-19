// app/api/admin/products/featured/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        featured: true,
        status: 'ACTIVE'
      },
      orderBy: {
        featuredOrder: 'asc' // Si tu veux gérer l'ordre
      },
      select: {
        id: true,
        title: true,
        price: true,
        images: true
      }
    })

    return NextResponse.json({ success: true, data: products })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 })
  }
}