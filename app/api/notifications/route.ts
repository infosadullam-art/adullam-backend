import type { NextRequest } from "next/server"
import { notificationService } from "@/services/notification.service"
import { errorResponse, paginatedResponse } from "@/lib/utils/api-response"
import { getPaginationParams } from "@/lib/utils/pagination"
import { getAuthUser } from "@/lib/auth/get-auth-user"
import type {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
} from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return errorResponse("Unauthorized", 403)

    const { searchParams } = new URL(request.url)
    const { page, limit } = getPaginationParams(searchParams)

    const filters = {
      userId: user.role === "ADMIN"
        ? searchParams.get("userId") || undefined
        : user.id,
      type: searchParams.get("type") as NotificationType | undefined,
      channel: searchParams.get("channel") as NotificationChannel | undefined,
      status: searchParams.get("status") as NotificationStatus | undefined,
    }

    const { notifications, total } =
      await notificationService.list(filters, page, limit)

    return paginatedResponse(notifications, total, page, limit)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list notifications"
    return errorResponse(message, 400)
  }
}
