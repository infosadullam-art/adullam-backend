import type { NextRequest } from "next/server";
import { importService } from "@/services/import.service";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/utils/api-response";
import { getPaginationParams } from "@/lib/utils/pagination";
import { prisma } from "@/lib/prisma";
import { verifyToken, type JwtPayload } from "@/lib/jwt";
import type { User, ImportSource, ImportStatus } from "@prisma/client";

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
/*                               GET IMPORT BATCHES                             */
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
      source: searchParams.get("source") as ImportSource | undefined,
      status: (["PENDING", "PROCESSING", "COMPLETED"].includes(searchParams.get("status") ?? "")
        ? (searchParams.get("status") as ImportStatus)
        : undefined),
      startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
      endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
    };

    const { batches, total } = await importService.listBatches(filters, page, limit);
    return paginatedResponse(batches, total, page, limit);
  } catch (error) {
    console.error("Import GET error:", error);
    const message = error instanceof Error ? error.message : "Failed to list import batches";
    return errorResponse(message, 400);
  }
}

/* -------------------------------------------------------------------------- */
/*                               CREATE IMPORT BATCH                            */
/* -------------------------------------------------------------------------- */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== "ADMIN") {
      return errorResponse("Unauthorized", 403);
    }

    const body = await request.json();
    const { source, products } = body;

    if (!source || !["ALIEXPRESS", "OTHER"].includes(source)) {
      return errorResponse("Invalid or missing source", 400);
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return errorResponse("Products array is required", 400);
    }

    const validProducts = products.map((p: any) => ({
      ...p,
      name: p.name || "Unnamed Product",
      price: typeof p.price === "number" && p.price > 0 ? p.price : 1,
      quantity: typeof p.quantity === "number" && p.quantity >= 0 ? p.quantity : 1,
    }));

    const batch = await importService.createBatch({
      source: source as ImportSource,
      products: validProducts,
    });

    return successResponse(batch, "Import batch created");
  } catch (error) {
    console.error("Import POST error:", error);
    const message = error instanceof Error ? error.message : "Failed to create import batch";
    return errorResponse(message, 400);
  }
}
