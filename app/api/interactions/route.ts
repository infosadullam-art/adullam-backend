import type { NextRequest } from "next/server";
import { interactionService } from "@/services/interaction.service";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/utils/api-response";
import { getPaginationParams } from "@/lib/utils/pagination";
import { prisma } from "@/lib/prisma";
import { verifyToken, type JwtPayload } from "@/lib/jwt";
import type { InteractionType, User } from "@prisma/client";

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
/*                             LIST INTERACTIONS                               */
/* -------------------------------------------------------------------------- */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);

    const type = searchParams.get("type") as InteractionType | undefined;

    const { interactions, total } =
      await interactionService.getUserInteractions(
        user.id,
        type,
        page,
        limit
      );

    return paginatedResponse(interactions, total, page, limit);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to list interactions";

    return errorResponse(message, 400);
  }
}

/* -------------------------------------------------------------------------- */
/*                             CREATE INTERACTION                              */
/* -------------------------------------------------------------------------- */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();

    const interaction = await interactionService.create({
      ...body,
      userId: user.id,
    });

    return successResponse(interaction, "Interaction recorded");
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to record interaction";

    return errorResponse(message, 400);
  }
}
