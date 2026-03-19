import type { NextRequest } from "next/server";
import { productService } from "@/services/product.service";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/utils/api-response";
import { getPaginationParams } from "@/lib/utils/pagination";
import { prisma } from "@/lib/prisma"; // Prisma client
import { verifyToken, type JwtPayload } from "@/lib/jwt"; // JWT utils
import type { ProductStatus, User } from "@prisma/client";

/* -------------------------------------------------------------------------- */
/*                        AUTH HELPER - GET USER                               */
/* -------------------------------------------------------------------------- */
async function getAuthUser(request: NextRequest): Promise<User | null> {
  try {
    const token = request.cookies.get("accessToken")?.value;
    if (!token) return null;

    // ⚠️ Vérification JWT async et récupération du payload
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
/*                               LIST PRODUCTS                                 */
/* -------------------------------------------------------------------------- */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);

    const user = await getAuthUser(request);
    const isAdmin = user?.role === "ADMIN";

    const filters = {
      status: isAdmin
        ? (searchParams.get("status") as ProductStatus | undefined)
        : ("ACTIVE" as ProductStatus),
      categoryId: searchParams.get("categoryId") || undefined,
      featured: searchParams.get("featured") === "true" ? true : undefined,
      minPrice: searchParams.get("minPrice")
        ? Number.parseFloat(searchParams.get("minPrice")!)
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? Number.parseFloat(searchParams.get("maxPrice")!)
        : undefined,
      search: searchParams.get("search") || undefined,
      tags: searchParams.get("tags")?.split(",").filter(Boolean),
      inStock: searchParams.get("inStock") === "true" ? true : undefined,
    };

    const { products, total } = await productService.list(filters, page, limit);

    // Assurer un poids par défaut
    const safeProducts = products.map((p) => ({
      ...p,
      weight: typeof p.weight === "number" && p.weight > 0 ? p.weight : 1,
    }));

    return paginatedResponse(safeProducts, total, page, limit);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list products";
    return errorResponse(message, 400);
  }
}

/* -------------------------------------------------------------------------- */
/*                               CREATE PRODUCT                                */
/* -------------------------------------------------------------------------- */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== "ADMIN") {
      return errorResponse("Unauthorized", 403);
    }

    const body = await request.json();

    // Poids par défaut si absent
    if (body.weight == null || body.weight <= 0) {
      body.weight = 1;
    }

    const product = await productService.create(body);

    return successResponse(product, "Product created");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    return errorResponse(message, 400);
  }
}
