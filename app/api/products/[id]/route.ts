import type { NextRequest } from "next/server";
import { productService } from "@/services/product.service";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { verifyToken, type JwtPayload } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
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
/*                               PRODUCT ROUTES                                 */
/* -------------------------------------------------------------------------- */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await productService.getById(id);

    if (!product) {
      return errorResponse("Product not found", 404);
    }

    return successResponse(product);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get product";
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
    const product = await productService.update(id, body);

    return successResponse(product, "Product updated");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update product";
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
    await productService.delete(id);

    return successResponse(null, "Product deleted");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete product";
    return errorResponse(message, 400);
  }
}
