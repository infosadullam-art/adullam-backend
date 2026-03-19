import type { NextRequest } from "next/server";
import { jobService } from "@/services/job.service";
import {
  errorResponse,
  paginatedResponse,
} from "@/lib/utils/api-response";
import { getPaginationParams } from "@/lib/utils/pagination";
import { verifyToken, type JwtPayload } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import type { User, JobType, JobStatus } from "@prisma/client";

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
/*                               LIST JOBS                                     */
/* -------------------------------------------------------------------------- */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== "ADMIN") {
      return errorResponse("Unauthorized", 403);
    }

    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);

    const filters = {
      type: searchParams.get("type") as JobType | undefined,
      status: searchParams.get("status") as JobStatus | undefined,
    };

    const { jobs, total } = await jobService.list(filters, page, limit);
    return paginatedResponse(jobs, total, page, limit);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list jobs";
    return errorResponse(message, 400);
  }
}
