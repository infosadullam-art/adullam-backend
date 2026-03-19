import type { NextRequest } from "next/server"
import { adsService } from "@/services/ads.service"
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/utils/api-response"
import { getPaginationParams } from "@/lib/utils/pagination"
import { getAuthUser } from "@/lib/auth/get-auth-user"
import type { AdsPlatform, AdsEventType } from "@prisma/client"

/* -------------------------------------------------------------------------- */
/*                                LIST ADS EVENTS                              */
/* -------------------------------------------------------------------------- */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return errorResponse("Unauthorized", 403)

    if (user.role !== "ADMIN") return errorResponse("Forbidden", 403)

    const { searchParams } = new URL(request.url)
    const { page, limit } = getPaginationParams(searchParams)

    const filters = {
      platform: searchParams.get("platform") as AdsPlatform | undefined,
      eventType: searchParams.get("eventType") as AdsEventType | undefined,
      campaignId: searchParams.get("campaignId") || undefined,
      startDate: searchParams.get("startDate")
        ? new Date(searchParams.get("startDate")!)
        : undefined,
      endDate: searchParams.get("endDate")
        ? new Date(searchParams.get("endDate")!)
        : undefined,
    }

    const { events, total } = await adsService.list(filters, page, limit)

    return paginatedResponse(events, total, page, limit)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list ads events"
    return errorResponse(message, 400)
  }
}

/* -------------------------------------------------------------------------- */
/*                               CREATE ADS EVENTS                             */
/* -------------------------------------------------------------------------- */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return errorResponse("Unauthorized", 403)
    if (user.role !== "ADMIN") return errorResponse("Forbidden", 403)

    const body = await request.json()

    if (Array.isArray(body)) {
      const result = await adsService.bulkCreateEvents(body)
      return successResponse(result, "Ads events created")
    }

    const event = await adsService.createEvent(body)
    return successResponse(event, "Ads event created")
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create ads event"
    return errorResponse(message, 400)
  }
}
