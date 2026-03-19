import type { NextRequest } from "next/server";
import { sourcingService } from "@/services/sourcing.service";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/utils/api-response";
import { getPaginationParams } from "@/lib/utils/pagination";
import { prisma } from "@/lib/prisma";
import { verifyToken, type JwtPayload } from "@/lib/jwt";
import type { SourcingRequestStatus, User } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

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
/*                               LIST SOURCING REQUESTS                        */
/* -------------------------------------------------------------------------- */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);

    const user = await getAuthUser(request);
    const isAdmin = user?.role === "ADMIN";

    // Si admin et demande des stats
    if (isAdmin && searchParams.get("stats") === "true") {
      const stats = await sourcingService.getStats();
      return successResponse(stats);
    }

    const filters = {
      status: searchParams.get("status") as SourcingRequestStatus | undefined,
      userId: !isAdmin ? user?.id : undefined, // Non-admin ne voit que ses demandes
      search: isAdmin ? searchParams.get("search") || undefined : undefined,
      startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
      endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
    };

    const { requests, total } = await sourcingService.list(filters, page, limit);

    return paginatedResponse(requests, total, page, limit);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list sourcing requests";
    return errorResponse(message, 400);
  }
}

/* -------------------------------------------------------------------------- */
/*                               CREATE SOURCING REQUEST                       */
/* -------------------------------------------------------------------------- */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return errorResponse("Vous devez être connecté", 401);
    }

    const formData = await request.formData();
    
    const productName = formData.get("productName") as string;
    const productType = formData.get("productType") as string;
    const description = formData.get("description") as string;
    const quantity = parseInt(formData.get("quantity") as string);
    const quantityUnit = formData.get("quantityUnit") as string || "pièces";
    const budgetMin = formData.get("budgetMin") ? parseFloat(formData.get("budgetMin") as string) : null;
    const budgetMax = formData.get("budgetMax") ? parseFloat(formData.get("budgetMax") as string) : null;
    const deadline = formData.get("deadline") ? new Date(formData.get("deadline") as string) : null;

    if (!productName || !productType || !description || !quantity) {
      return errorResponse("Champs requis manquants", 400);
    }

    // Upload des documents
    const documents = [];
    const files = formData.getAll("documents") as File[];
    
    if (files.length > 0) {
      const uploadDir = path.join(process.cwd(), "public/uploads/sourcing");
      await mkdir(uploadDir, { recursive: true });

      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = `${uuidv4()}-${file.name}`;
        const filePath = path.join(uploadDir, fileName);
        await writeFile(filePath, buffer);

        documents.push({
          fileName: file.name,
          url: `/uploads/sourcing/${fileName}`,
          size: file.size,
          type: file.type
        });
      }
    }

    const requestData = await sourcingService.create({
      productName,
      productType,
      description,
      quantity,
      quantityUnit,
      budgetMin: budgetMin || undefined,
      budgetMax: budgetMax || undefined,
      deadline: deadline || undefined,
      userId: user.id,
      fullName: user.name || "Non renseigné",
      email: user.email,
      phone: user.phone || undefined,
      company: (user as any).company || undefined,
      documents: documents.length > 0 ? documents : undefined
    });

    return successResponse(requestData, "Demande envoyée avec succès", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create sourcing request";
    return errorResponse(message, 400);
  }
}