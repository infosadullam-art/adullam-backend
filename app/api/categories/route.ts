import type { NextRequest } from "next/server";
import { categoryService } from "@/services/category.service";
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
/*                               CATEGORY ROUTES                               */
/* -------------------------------------------------------------------------- */
export async function GET() {
  try {
    const categories = await categoryService.list();
    return successResponse(categories);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list categories";
    return errorResponse(message, 400);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== "ADMIN") {
      return errorResponse("Unauthorized", 403);
    }

    const body = await request.json();
    const category = await categoryService.create(body);
    return successResponse(category, "Category created");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create category";
    return errorResponse(message, 400);
  }
}
