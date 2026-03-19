import type { NextRequest } from "next/server"
import { forYouService } from "@/services/forYou.service"
import { successResponse, errorResponse } from "@/lib/utils/api-response"

export async function GET(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await params
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)

    const similar = await forYouService.getSimilarProducts(productId, limit)
    return successResponse(similar)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get similar products"
    return errorResponse(message, 400)
  }
}
