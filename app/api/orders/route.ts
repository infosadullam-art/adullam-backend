// app/api/orders/route.ts

import type { NextRequest } from "next/server";
import { orderService } from "@/services/order.service";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/utils/api-response";
import { getPaginationParams } from "@/lib/utils/pagination";
import { prisma } from "@/lib/prisma";
import { verifyToken, type JwtPayload } from "@/lib/jwt";
import type { OrderStatus, PaymentStatus, User } from "@prisma/client";

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
/*                               LIST ORDERS                                   */
/* -------------------------------------------------------------------------- */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);

    // ✅ CORRECTION: Gestion des filtres
    const filters: any = {};
    
    // Si admin, peut filtrer par userId, sinon force userId = user.id
    if (user.role === "ADMIN") {
      if (searchParams.get("userId")) {
        filters.userId = searchParams.get("userId")!;
      }
    } else {
      filters.userId = user.id;
    }
    
    if (searchParams.get("status")) {
      filters.status = searchParams.get("status") as OrderStatus;
    }
    
    if (searchParams.get("paymentStatus")) {
      filters.paymentStatus = searchParams.get("paymentStatus") as PaymentStatus;
    }
    
    if (searchParams.get("startDate")) {
      filters.startDate = new Date(searchParams.get("startDate")!);
    }
    
    if (searchParams.get("endDate")) {
      filters.endDate = new Date(searchParams.get("endDate")!);
    }

    const { orders, total } = await orderService.list(filters, page, limit);
    return paginatedResponse(orders, total, page, limit);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list orders";
    return errorResponse(message, 400);
  }
}

/* -------------------------------------------------------------------------- */
/*                               CREATE ORDER                                  */
/* -------------------------------------------------------------------------- */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await request.json();

    // Validation des données requises
    if (!body.items || !body.items.length) {
      return errorResponse("Le panier est vide", 400);
    }

    if (!body.shippingInfo) {
      return errorResponse("Les informations de livraison sont requises", 400);
    }

    if (!body.paymentMethod) {
      return errorResponse("Le mode de paiement est requis", 400);
    }

    // Calcul des totaux (sécurité: on recalcule côté serveur)
    const subtotal = body.items.reduce(
      (sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1),
      0
    );

    const shippingTotal = body.totals?.totalShipping || 0;
    const portePorteTotal = body.totals?.totalPortePorte || 0;
    const grandTotal = body.totals?.grandTotal || (subtotal + shippingTotal + portePorteTotal);

    // 🔥 GÉNÉRATION D'UNE DESCRIPTION HUMAINE DES VARIANTES
    const generateVariantDescription = (attributes: Record<string, any> = {}, item: any = {}): string => {
      if (attributes && Object.keys(attributes).length > 0) {
        const attributeLabels: Record<string, string> = {
          color: "Couleur",
          colour: "Couleur",
          couleur: "Couleur",
          size: "Taille",
          taille: "Taille",
          pointure: "Pointure",
          material: "Matière",
          matière: "Matière",
          capacity: "Capacité",
          capacité: "Capacité",
        };

        return Object.entries(attributes)
          .map(([key, value]) => {
            const label = attributeLabels[key.toLowerCase()] || key;
            return `${label}: ${value}`;
          })
          .join(", ");
      }
      
      // Fallback sur les champs simples
      return [item.color, item.eurSize, item.size, item.material]
        .filter(Boolean)
        .join(" - ");
    };

    // Préparer les items pour la création
    const itemsData = body.items.map((item: any) => {
      const attributes = item.attributes || {};
      const itemPrice = item.price || 0;
      const itemQuantity = item.quantity || 1;
      
      return {
        productId: item.id,
        productName: item.name || "Produit",
        quantity: itemQuantity,
        unitPrice: itemPrice,
        totalPrice: itemPrice * itemQuantity,
        variantSummary: generateVariantDescription(attributes, item),
        attributes: {
          ...(item.attributes || {}),
          ...(item.color && { color: item.color }),
          ...(item.eurSize && { eurSize: item.eurSize }),
          ...(item.size && { size: item.size }),
          ...(item.material && { material: item.material }),
          ...(item.capacity && { capacity: item.capacity }),
        },
        variantKey: item.variantKey || `var-${Date.now()}-${Math.random()}`,
        weight: item.weight || 0.5,
        totalWeight: (item.weight || 0.5) * itemQuantity,
        shippingMode: item.shippingMode || "standard",
        shippingCost: item.shippingCost || 0,
        portePorteCost: item.portePorteCost || 0,
        image: item.image || "",
        categoryId: item.categoryId || null,
      };
    });

    // Création de la commande
    const order = await orderService.create({
      userId: user.id,
      items: itemsData,
      shippingInfo: {
        firstName: body.shippingInfo.firstName || "",
        lastName: body.shippingInfo.lastName || "",
        email: body.shippingInfo.email || user.email || "",
        phone: body.shippingInfo.phone || "",
        address: body.shippingInfo.address || "",
        city: body.shippingInfo.city || "",
        postalCode: body.shippingInfo.postalCode || "",
        country: body.country || "CI",
        notes: body.shippingInfo.notes || "",
      },
      paymentMethod: body.paymentMethod,
      subtotal,
      shippingTotal,
      portePorteTotal,
      totalAmount: grandTotal,
      defaultShippingMode: body.defaultShippingMode || "standard",
      metadata: {
        userAgent: request.headers.get("user-agent") || "unknown",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        deviceType: body.deviceType || "web",
        locale: body.locale || "fr",
        currency: body.currency || "XOF",
      },
    });

    // Génération d'une référence lisible
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const day = String(new Date().getDate()).padStart(2, "0");
    const orderNumber = `${year}${month}${day}-${order.id.slice(-6)}`;

    return successResponse(
      {
        orderId: order.id,
        reference: orderNumber,
        total: grandTotal,
        paymentMethod: body.paymentMethod,
        itemsCount: body.items.length,
        variantCount: body.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0),
      },
      "Commande créée avec succès"
    );
  } catch (error) {
    console.error("❌ Erreur création commande:", error);
    const message = error instanceof Error ? error.message : "Failed to create order";
    return errorResponse(message, 400);
  }
}

/* -------------------------------------------------------------------------- */
/*                         METTRE À JOUR STATUT                                */
/* -------------------------------------------------------------------------- */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return errorResponse("Unauthorized", 401);

    // Seul l'admin peut modifier les statuts
    if (user.role !== "ADMIN") {
      return errorResponse("Accès interdit", 403);
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("id");
    const body = await request.json();

    if (!orderId) {
      return errorResponse("ID de commande requis", 400);
    }

    const updatedOrder = await orderService.update(orderId, {
      status: body.status,
      paymentStatus: body.paymentStatus,
      trackingNumber: body.trackingNumber,
      trackingUrl: body.trackingUrl,
      estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : undefined,
    });

    return successResponse(updatedOrder, "Commande mise à jour");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update order";
    return errorResponse(message, 400);
  }
}

/* -------------------------------------------------------------------------- */
/*                         ANNULER UNE COMMANDE                                */
/* -------------------------------------------------------------------------- */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("id");

    if (!orderId) {
      return errorResponse("ID de commande requis", 400);
    }

    // ✅ CORRECTION: Récupérer le body pour DELETE
    const body = await request.json().catch(() => ({}));

    // Vérifier que la commande appartient à l'utilisateur ou est admin
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return errorResponse("Commande non trouvée", 404);
    }

    if (order.userId !== user.id && user.role !== "ADMIN") {
      return errorResponse("Accès interdit", 403);
    }

    // Seules les commandes en statut PENDING peuvent être annulées
    if (order.status !== "PENDING") {
      return errorResponse("Seules les commandes en attente peuvent être annulées", 400);
    }

    const cancelledOrder = await orderService.update(orderId, {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancellationReason: body.reason || "Annulé par l'utilisateur",
    });

    return successResponse(cancelledOrder, "Commande annulée");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to cancel order";
    return errorResponse(message, 400);
  }
}