import type { NextRequest } from "next/server"
import { videoService } from "@/services/video.service"
import { successResponse, errorResponse, paginatedResponse } from "@/lib/utils/api-response"
import { prisma } from "@/lib/prisma"
import { verifyToken, type JwtPayload } from "@/lib/jwt"
import type { User } from "@prisma/client"

/* -------------------------------------------------------------------------- */
/*                               AUTH HELPER                                   */
/* -------------------------------------------------------------------------- */
async function getAuthUser(request: NextRequest): Promise<User | null> {
  try {
    const token = request.cookies.get("accessToken")?.value
    if (!token) return null

    const payload: JwtPayload = await verifyToken(token, "access")
    if (!payload?.userId) return null

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    return user ?? null
  } catch {
    return null
  }
}

/* -------------------------------------------------------------------------- */
/*                               VIDEO ROUTES                                  */
/* -------------------------------------------------------------------------- */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.role !== "ADMIN") {
      return errorResponse("Unauthorized", 403)
    }

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get("page") || 1)
    const limit = Number(searchParams.get("limit") || 20)
    const status = searchParams.get("status")
    const productId = searchParams.get("productId")

    const filters: Record<string, unknown> = {}
    if (status) filters.status = status
    if (productId) filters.productId = productId

    const [videos, total] = await Promise.all([
      prisma.productVideo.findMany({
        where: filters,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { product: { select: { id: true, title: true, slug: true } } },
      }),
      prisma.productVideo.count({ where: filters }),
    ])

    return paginatedResponse(videos, total, page, limit)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list videos"
    return errorResponse(message, 400)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.role !== "ADMIN") {
      return errorResponse("Unauthorized", 403)
    }

    const body = await request.json()
    const { productId, videoUrl, thumbnailUrl, duration } = body

    if (!productId || !videoUrl) {
      return errorResponse("Product ID and video URL are required", 400)
    }

    const video = await videoService.create({ productId, videoUrl, thumbnailUrl, duration })
    return successResponse(video, "Video created")
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create video"
    return errorResponse(message, 400)
  }
}
