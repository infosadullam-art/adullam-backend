import type { NextRequest } from "next/server"
import { videoService } from "@/services/video.service"
import { successResponse, errorResponse, paginatedResponse } from "@/lib/utils/api-response"
import { getPaginationParams } from "@/lib/utils/pagination"
import { getAuthUser } from "@/lib/auth/get-auth-user"

/* -------------------------------------------------------------------------- */
/*                                VIDEO ROUTES                                 */
/* -------------------------------------------------------------------------- */

/* ---------------------------- LIST VIDEOS ---------------------------- */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.role !== "ADMIN") {
      return errorResponse("Unauthorized", 403)
    }

    const { searchParams } = new URL(request.url)
    const { page, limit } = getPaginationParams(searchParams)

    const filters = {
      productId: searchParams.get("productId") || undefined,
      status: searchParams.get("status") || undefined,
    }

    const { videos, total } = await videoService.list(filters, page, limit)
    return paginatedResponse(videos, total, page, limit)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list videos"
    return errorResponse(message, 400)
  }
}

/* ---------------------------- CREATE VIDEO ---------------------------- */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.role !== "ADMIN") {
      return errorResponse("Unauthorized", 403)
    }

    const body = await request.json()
    const video = await videoService.create(body)
    return successResponse(video, "Video created")
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create video"
    return errorResponse(message, 400)
  }
}

/* ---------------------------- GET VIDEO BY ID ---------------------------- */
export async function GET_BY_ID(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const video = await videoService.getById(id)
    if (!video) return errorResponse("Video not found", 404)
    return successResponse(video)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get video"
    return errorResponse(message, 400)
  }
}

/* ---------------------------- UPDATE VIDEO ---------------------------- */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.role !== "ADMIN") return errorResponse("Unauthorized", 403)

    const { id } = await params
    const body = await request.json()
    const video = await videoService.update(id, body)
    return successResponse(video, "Video updated")
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update video"
    return errorResponse(message, 400)
  }
}

/* ---------------------------- DELETE VIDEO ---------------------------- */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.role !== "ADMIN") return errorResponse("Unauthorized", 403)

    const { id } = await params
    await videoService.delete(id)
    return successResponse(null, "Video deleted")
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete video"
    return errorResponse(message, 400)
  }
}
