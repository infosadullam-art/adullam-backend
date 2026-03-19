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
/*                             CATEGORY ROUTES                                 */
/* -------------------------------------------------------------------------- */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const category = await categoryService.getById(id);

    if (!category) {
      return errorResponse("Category not found", 404);
    }

    return successResponse(category);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get category";
    return errorResponse(message, 400);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== "ADMIN") {
      return errorResponse("Unauthorized", 403);
    }

    const { id } = await params;
    const body = await request.json();
    const category = await categoryService.update(id, body);

    return successResponse(category, "Category updated");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update category";
    return errorResponse(message, 400);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== "ADMIN") {
      return errorResponse("Unauthorized", 403);
    }

    const { id } = await params;
    await categoryService.delete(id);

    return successResponse(null, "Category deleted");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete category";
    return errorResponse(message, 400);
  }
}
