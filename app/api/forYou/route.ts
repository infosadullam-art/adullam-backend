import type { NextRequest } from "next/server";
import { forYouService } from "@/services/forYou.service";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { getPaginationParams } from "@/lib/utils/pagination";
import { prisma } from "@/lib/prisma";
import { verifyToken, type JwtPayload } from "@/lib/jwt";
import type { User } from "@prisma/client";

/* -------------------------------------------------------------------------- */
/*                               AUTH HELPER                                   */
/* -------------------------------------------------------------------------- */
async function getAuthUser(request: NextRequest): Promise<User | null> {
  try {
    const token = request.cookies.get("accessToken")?.value;
    if (!token) return null;

    const payload: JwtPayload = await verifyToken(token, "access");
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    return user ?? null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                               GET FOR YOU                                   */
/* -------------------------------------------------------------------------- */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);

    const recommendations = await forYouService.getRecommendations(
      user.id,
      page,
      limit
    );

    return successResponse(recommendations);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to get recommendations";

    return errorResponse(message, 400);
  }
}
