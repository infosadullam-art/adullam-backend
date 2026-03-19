import type { NextRequest } from "next/server"
import { notificationService } from "@/services/notification.service"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { getAuthUser } from "@/lib/auth/get-auth-user"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.role !== "ADMIN") {
      return errorResponse("Unauthorized", 403)
    }

    const stats = await notificationService.getStats()
    return successResponse(stats)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get notification stats"
    return errorResponse(message, 400)
  }
}
