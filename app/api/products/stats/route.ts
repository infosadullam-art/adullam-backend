import { productService } from "@/services/product.service"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    await requireAdmin()

    const stats = await productService.getStats()
    return successResponse(stats)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get product stats"
    return errorResponse(message, 400)
  }
}
