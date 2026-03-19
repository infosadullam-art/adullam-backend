import type { NextRequest } from "next/server";
import { jobService } from "@/services/job.service";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { prisma } from "@/lib/prisma";
import { verifyToken, type JwtPayload } from "@/lib/jwt";
import type { User } from "@prisma/client";

/* -------------------------------------------------------------------------- */
/*                        AUTH HELPER - GET USER                               */
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
/*                               JOB STATS                                     */
/* -------------------------------------------------------------------------- */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== "ADMIN") {
      return errorResponse("Unauthorized", 403);
    }

    const stats = await jobService.getStats();
    return successResponse(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get job stats";
    return errorResponse(message, 400);
  }
}
