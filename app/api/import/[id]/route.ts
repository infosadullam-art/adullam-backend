import type { NextRequest } from "next/server";
import { importService } from "@/services/import.service";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
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
/*                           GET IMPORT BATCH BY ID                            */
/* -------------------------------------------------------------------------- */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== "ADMIN") {
      return errorResponse("Unauthorized", 403);
    }

    const { id } = params;

    const batch = await importService.getBatch(id);
    if (!batch) {
      return errorResponse("Import batch not found", 404);
    }

    return successResponse(batch);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to get import batch";

    return errorResponse(message, 400);
  }
}
