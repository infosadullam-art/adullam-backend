import type { NextRequest } from "next/server"
import { adsService } from "@/services/ads.service"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { getAuthUser } from "@/lib/auth/get-auth-user"
import type { AdsPlatform } from "@prisma/client"

/* -------------------------------------------------------------------------- */
/*                             ADS PERFORMANCE                                 */
/* -------------------------------------------------------------------------- */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return errorResponse("Unauthorized", 403)
    if (user.role !== "ADMIN") return errorResponse("Forbidden", 403)

    const { searchParams } = new URL(request.url)

    const filters = {
      platform: searchParams.get("platform") as AdsPlatform | undefined,
      campaignId: searchParams.get("campaignId") || undefined,
      startDate: searchParams.get("startDate")
        ? new Date(searchParams.get("startDate")!)
        : undefined,
      endDate: searchParams.get("endDate")
        ? new Date(searchParams.get("endDate")!)
        : undefined,
    }

    const performance = await adsService.getPerformance(filters)

    return successResponse(performance)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get ads performance"
    return errorResponse(message, 400)
  }
}
