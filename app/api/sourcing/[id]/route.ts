// app/api/sourcing/[id]/route.ts

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
} from "@/lib/utils/api-response";
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
/*                               GET SOURCING REQUEST                          */
/* -------------------------------------------------------------------------- */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ C'est une Promise
) {
  try {
    // ✅ Il faut attendre params
    const { id } = await params;
    
    const user = await getAuthUser(request);
    if (!user) {
      return errorResponse("Non autorisé", 401);
    }

    const requestData = await prisma.sourcingRequest.findUnique({
      where: { id },  // ✅ Maintenant id est défini
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    });

    if (!requestData) {
      return errorResponse("Demande non trouvée", 404);
    }

    // Vérifier que l'utilisateur est propriétaire ou admin
    if (requestData.userId !== user.id && user.role !== "ADMIN") {
      return errorResponse("Accès non autorisé", 403);
    }

    return successResponse(requestData);
  } catch (error) {
    console.error("Erreur:", error);
    const message = error instanceof Error ? error.message : "Erreur";
    return errorResponse(message, 400);
  }
}

/* -------------------------------------------------------------------------- */
/*                               UPDATE SOURCING REQUEST                       */
/* -------------------------------------------------------------------------- */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const user = await getAuthUser(request);
    if (!user || user.role !== "ADMIN") {
      return errorResponse("Non autorisé", 403);
    }

    const body = await request.json();

    const updated = await prisma.sourcingRequest.update({
      where: { id },
      data: {
        status: body.status,
        adminNotes: body.adminNotes,
        response: body.response,
        respondedAt: body.status === "RESPONDED" || body.status === "QUOTED" ? new Date() : undefined,
        viewedAt: body.markAsViewed ? new Date() : undefined,
      }
    });

    return successResponse(updated, "Demande mise à jour");
  } catch (error) {
    console.error("Erreur:", error);
    const message = error instanceof Error ? error.message : "Erreur";
    return errorResponse(message, 400);
  }
}

/* -------------------------------------------------------------------------- */
/*                               DELETE SOURCING REQUEST                       */
/* -------------------------------------------------------------------------- */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const user = await getAuthUser(request);
    if (!user || user.role !== "ADMIN") {
      return errorResponse("Non autorisé", 403);
    }

    await prisma.sourcingRequest.delete({
      where: { id }
    });

    return successResponse(null, "Demande supprimée");
  } catch (error) {
    console.error("Erreur:", error);
    const message = error instanceof Error ? error.message : "Erreur";
    return errorResponse(message, 400);
  }
}