import type { NextRequest } from "next/server";
import { orderService } from "@/services/order.service";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { requireAuth, requireAdmin } from "@/lib/auth";

/**
 * GET /api/orders/[id]
 * - Récupère une commande par ID
 * - Accessible par l'utilisateur propriétaire ou un admin
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Récupère le token depuis le cookie
    const token = request.cookies.get("accessToken")?.value;
    const user = await requireAuth(token);
    const { id } = await params;

    const order = await orderService.getById(id);

    if (!order) {
      return errorResponse("Order not found", 404);
    }

    // Vérifie l'accès
    if (user.role !== "ADMIN" && order.userId !== user.id) {
      return errorResponse("Forbidden", 403);
    }

    return successResponse(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get order";
    return errorResponse(message, 400);
  }
}

/**
 * PATCH /api/orders/[id]
 * - Met à jour le statut d'une commande
 * - Accessible uniquement par un admin
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Récupère le token depuis le cookie
    const token = request.cookies.get("accessToken")?.value;
    const adminUser = await requireAdmin(token);
    const { id } = await params;

    const body = await request.json();
    const order = await orderService.updateStatus(id, body, adminUser.id);

    return successResponse(order, "Order updated");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update order";
    return errorResponse(message, 400);
  }
}
