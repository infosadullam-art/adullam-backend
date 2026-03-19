// services/order.service.ts

import prisma from "@/lib/prisma"
import { generateOrderNumber } from "@/lib/utils/slug"
import { notificationQueue } from "@/lib/queue"
import type { OrderStatus, PaymentStatus, PaymentMethod, Prisma } from "@prisma/client"

// 🔥 NOUVEAUX TYPES pour les variantes et la logistique
export interface OrderItemInput {
  productId: string
  quantity: number
  // Variantes (N'IMPORTE QUEL attribut)
  attributes?: Record<string, any>  // Stocke couleur, taille, pointure, etc.
  variantKey?: string               // Identifiant unique de la combinaison
  // Prix
  unitPrice: number
  totalPrice: number
  // Poids et logistique
  weight?: number
  totalWeight?: number
  shippingMode?: string
  shippingCost?: number
  portePorteCost?: number
  image?: string
  productName?: string
}

export interface CreateOrderInput {
  userId: string
  // Items avec toutes leurs variantes
  items: OrderItemInput[]
  // Informations de livraison
  shippingInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    city: string
    postalCode?: string
    country: string
    notes?: string
  }
  billingAddress?: Record<string, unknown>
  paymentMethod: PaymentMethod | string
  // Totaux (pour validation)
  subtotal: number
  shippingTotal: number
  portePorteTotal: number
  totalAmount: number
  // Mode d'expédition par défaut
  defaultShippingMode?: string
  // Métadonnées
  metadata?: Record<string, any>
  notes?: string
}

export interface UpdateOrderInput {
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  trackingNumber?: string
  trackingUrl?: string
  estimatedDelivery?: Date
  notes?: string
  cancelledAt?: Date
  cancellationReason?: string
}

export interface OrderFilters {
  userId?: string
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  startDate?: Date
  endDate?: Date
  search?: string // Recherche par numéro de commande ou nom
}

export class OrderService {
  // ============================================================
  // CRÉER UNE COMMANDE (avec variantes et logistique)
  // ============================================================
  async create(input: CreateOrderInput) {
    // Validation des stocks si nécessaire
    if (process.env.CHECK_STOCK === "true") {
      await this.validateStock(input.items)
    }

    // Créer la commande dans une transaction
    const order = await prisma.$transaction(async (tx) => {
      // Créer la commande principale
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: input.userId,
          
          // Totaux
          subtotal: input.subtotal,
          shippingCost: input.shippingTotal,
          portePorteTotal: input.portePorteTotal,
          total: input.totalAmount,
          
          // Informations de livraison (en JSON)
          shippingInfo: input.shippingInfo as Prisma.InputJsonValue,
          billingAddress: input.billingAddress as Prisma.InputJsonValue,
          
          // Paiement
          paymentMethod: input.paymentMethod as PaymentMethod,
          
          // Mode d'expédition par défaut
          defaultShippingMode: input.defaultShippingMode || "bateau",
          
          // Métadonnées
          metadata: (input.metadata || {}) as Prisma.InputJsonValue,
          
          // Notes
          notes: input.notes,
          
          // Statut initial
          status: "PENDING",
          paymentStatus: "PENDING",
          
          // Historique des statuts
          statusHistory: {
            create: {
              status: "PENDING",
              note: "Commande créée",
            },
          },
          
          // Créer les items avec toutes leurs variantes
          items: {
            create: input.items.map((item) => ({
              productId: item.productId,
              productName: item.productName || "",
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              
              // 🔥 TOUTES LES VARIANTES EN JSON
              attributes: (item.attributes || {}) as Prisma.InputJsonValue,
              
              // Résumé lisible pour l'affichage
              variantSummary: this.generateVariantSummary(item.attributes || {}),
              
              // Identifiant unique de la combinaison
              variantKey: item.variantKey,
              
              // Poids et logistique
              weight: item.weight || 0.5,
              totalWeight: item.totalWeight || (item.weight || 0.5) * item.quantity,
              shippingMode: item.shippingMode,
              shippingCost: item.shippingCost,
              portePorteCost: item.portePorteCost,
              
              // Image
              image: item.image,
            })),
          },
        },
        include: {
          items: true,
          statusHistory: true,
        },
      })

      // Mise à jour des stocks (optionnel)
      if (process.env.UPDATE_STOCK === "true") {
        for (const item of input.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
              purchaseCount: { increment: item.quantity },
            },
          })
        }
      }

      return newOrder
    })

    // Queue notification (optionnel)
    if (process.env.ENABLE_NOTIFICATIONS === "true") {
      await notificationQueue.add("orderConfirmation", {
        userId: input.userId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
      })
    }

    return order
  }

  // ============================================================
  // METTRE À JOUR LE STATUT
  // ============================================================
  async updateStatus(id: string, input: UpdateOrderInput, changedBy?: string) {
    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) throw new Error("Order not found")

    const updateData: Prisma.OrderUpdateInput = {}

    if (input.status) {
      updateData.status = input.status
      updateData.statusHistory = {
        create: {
          status: input.status,
          note: input.notes || `Statut mis à jour vers ${input.status}`,
          changedBy,
        },
      }

      if (input.status === "DELIVERED") {
        updateData.deliveredAt = new Date()
      }
      
      if (input.status === "CANCELLED") {
        updateData.cancelledAt = input.cancelledAt || new Date()
        updateData.cancellationReason = input.cancellationReason
      }
    }

    if (input.paymentStatus) updateData.paymentStatus = input.paymentStatus
    if (input.trackingNumber) updateData.trackingNumber = input.trackingNumber
    if (input.trackingUrl) updateData.trackingUrl = input.trackingUrl
    if (input.estimatedDelivery) updateData.estimatedDelivery = input.estimatedDelivery
    if (input.notes && !input.status) updateData.notes = input.notes

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    // Queue notification for status change
    if (input.status && process.env.ENABLE_NOTIFICATIONS === "true") {
      await notificationQueue.add("orderStatusUpdate", {
        userId: order.userId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: input.status,
      })
    }

    return updatedOrder
  }

  // ============================================================
  // RÉCUPÉRER UNE COMMANDE PAR ID
  // ============================================================
  async getById(id: string, options?: any) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,  // ✅ CORRIGÉ : Utilise 'name' au lieu de firstName/lastName
            phone: true,
          },
        },
      },
      ...options,
    })
  }

  // ============================================================
  // RÉCUPÉRER UNE COMMANDE PAR NUMÉRO
  // ============================================================
  async getByOrderNumber(orderNumber: string) {
    return prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,  // ✅ CORRIGÉ
            phone: true,
          },
        },
      },
    })
  }

  // ============================================================
  // LISTER LES COMMANDES AVEC FILTRES
  // ============================================================
  async list(filters: OrderFilters, page = 1, limit = 20) {
    const where: Prisma.OrderWhereInput = {}

    if (filters.userId) where.userId = filters.userId
    if (filters.status) where.status = filters.status
    if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus
    
    // Filtre par date
    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) where.createdAt.gte = filters.startDate
      if (filters.endDate) where.createdAt.lte = filters.endDate
    }

    // Recherche par numéro de commande ou nom de produit
    if (filters.search) {
      where.OR = [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { items: { some: { productName: { contains: filters.search, mode: 'insensitive' } } } },
      ]
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,  // ✅ CORRIGÉ
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ])

    return { orders, total }
  }

  // ============================================================
  // STATISTIQUES DES COMMANDES
  // ============================================================
  async getStats(startDate?: Date, endDate?: Date) {
    const where: Prisma.OrderWhereInput = {}
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const [totalOrders, totalRevenue, byStatus, byPaymentStatus, avgOrderValue, recentOrders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where: { ...where, paymentStatus: "PAID" },
        _sum: { total: true },
      }),
      prisma.order.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
      }),
      prisma.order.groupBy({
        by: ["paymentStatus"],
        where,
        _count: { _all: true },
      }),
      prisma.order.aggregate({
        where,
        _avg: { total: true },
      }),
      prisma.order.findMany({
        where,
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          user: {
            select: {
              name: true,  // ✅ CORRIGÉ : Utilise 'name' au lieu de firstName/lastName
            },
          },
        },
      }),
    ])

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      avgOrderValue: avgOrderValue._avg.total || 0,
      byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s.status]: s._count._all }), {}),
      byPaymentStatus: byPaymentStatus.reduce((acc, s) => ({ ...acc, [s.paymentStatus]: s._count._all }), {}),
      recentOrders,
    }
  }

  // ============================================================
  // VALIDATION DES STOCKS
  // ============================================================
  private async validateStock(items: OrderItemInput[]) {
    const productIds = items.map((i) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    })

    if (products.length !== productIds.length) {
      throw new Error("Un ou plusieurs produits n'existent pas")
    }

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)!
      if (product.stock < item.quantity) {
        throw new Error(`Stock insuffisant pour ${product.title}`)
      }
    }
  }

  // ============================================================
  // GÉNÉRER UN RÉSUMÉ DES VARIANTES
  // ============================================================
  private generateVariantSummary(attributes: Record<string, any>): string {
    if (!attributes || Object.keys(attributes).length === 0) return ""
    
    const attributeLabels: Record<string, string> = {
      color: "Couleur",
      colour: "Couleur",
      couleur: "Couleur",
      size: "Taille",
      taille: "Taille",
      pointure: "Pointure",
      material: "Matière",
      matière: "Matière",
      matiere: "Matière",
      capacity: "Capacité",
      capacité: "Capacité",
      storage: "Stockage",
      ram: "RAM",
      processor: "Processeur",
      voltage: "Tension",
      puissance: "Puissance",
      power: "Puissance",
      length: "Longueur",
      longueur: "Longueur",
      width: "Largeur",
      largeur: "Largeur",
      height: "Hauteur",
      hauteur: "Hauteur",
      weight: "Poids",
      poids: "Poids",
      style: "Style",
      pattern: "Motif",
      fit: "Coupe",
      type: "Type",
      model: "Modèle",
      prise: "Prise",
      plug: "Prise",
    }

    return Object.entries(attributes)
      .map(([key, value]) => {
        const label = attributeLabels[key.toLowerCase()] || key
        return `${label}: ${value}`
      })
      .join(", ")
  }
}

export const orderService = new OrderService()