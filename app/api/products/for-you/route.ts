import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken, type JwtPayload } from "@/lib/jwt"
import { paginatedResponse, errorResponse } from "@/lib/utils/api-response"
import { getPaginationParams } from "@/lib/utils/pagination"
import type { User } from "@prisma/client"

async function getAuthUser(request: NextRequest): Promise<User | null> {
  try {
    const token = request.cookies.get("accessToken")?.value
    if (!token) return null

    const payload: JwtPayload = await verifyToken(token, "access")
    if (!payload?.userId) return null

    return await prisma.user.findUnique({
      where: { id: payload.userId },
    })
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { page, limit } = getPaginationParams(searchParams)
    const skip = (page - 1) * limit

    const user = await getAuthUser(request)

    /* =====================================================
       🔥 UTILISATEUR CONNECTÉ
    ===================================================== */
    if (user) {
      const scores = await prisma.forYouScore.findMany({
        where: {
          userId: user.id,
          product: {
            status: { in: ["ACTIVE", "DRAFT"] },
          },
        },
        orderBy: { score: "desc" },
        skip,
        take: limit,
        include: { product: true },
      })

      const items = scores.map(({ product, score }) => ({
        id: product.id,
        name: product.title,
        priceUSD: product.sellingPriceUSD ?? product.price, // ✅ RENOMMÉ priceUSD
        image: product.images?.[0] ?? "/placeholder.png",
        rating: product.avgRating ?? Math.round(score * 5),
        forYouScore: score,
        status: product.status,
        reason: generateReason(score) // ✅ AJOUT D'UNE RAISON
      }))

      return paginatedResponse(items, items.length, page, limit)
    }

    /* =====================================================
       🔥 VISITEUR (PAS CONNECTÉ)
    ===================================================== */
    const products = await prisma.product.findMany({
      where: {
        status: { in: ["ACTIVE", "DRAFT"] },
      },
      orderBy: [
        { purchaseCount: "desc" },
        { viewCount: "desc" },
        { createdAt: "desc" },
      ],
      skip,
      take: limit,
    })

    const items = products.map(product => ({
      id: product.id,
      name: product.title,
      priceUSD: product.sellingPriceUSD ?? product.price, // ✅ RENOMMÉ priceUSD
      image: product.images?.[0] ?? "/placeholder.png",
      rating: product.avgRating ?? 0,
      status: product.status,
    }))

    return paginatedResponse(items, items.length, page, limit)

  } catch (error) {
    console.error("FOR YOU API ERROR:", error)
    return errorResponse("Internal Server Error", 500)
  }
}

// ✅ FONCTION POUR GÉNÉRER UNE RAISON
function generateReason(score: number): string {
  if (score > 0.9) return "Parfait pour vous"
  if (score > 0.8) return "Basé sur vos achats"
  if (score > 0.7) return "Tendance actuelle"
  if (score > 0.6) return "Suggestions similaires"
  if (score > 0.5) return "Nouvelle collection"
  return "Populaire"
}