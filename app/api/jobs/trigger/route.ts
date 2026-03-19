import type { NextRequest } from "next/server";
import { jobService } from "@/services/job.service";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { prisma } from "@/lib/prisma";
import { verifyToken, type JwtPayload } from "@/lib/jwt";
import type { User } from "@prisma/client";
import type { QueueName } from "@/lib/queue";

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
/*                             TRIGGER JOB                                     */
/* -------------------------------------------------------------------------- */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== "ADMIN") {
      return errorResponse("Unauthorized", 403);
    }

    const body = await request.json();
    const { queue, job, payload } = body;

    if (!queue || !job) {
      return errorResponse("Queue and job name are required", 400);
    }

    const result = await jobService.triggerJob(
      queue as QueueName,
      job,
      payload
    );

    return successResponse(result, "Job triggered");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to trigger job";
    return errorResponse(message, 400);
  }
}
