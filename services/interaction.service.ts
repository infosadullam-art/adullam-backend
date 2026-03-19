import prisma from "@/lib/prisma"
import type { InteractionType, InteractionContext, Prisma } from "@prisma/client"

export interface CreateInteractionInput {
  userId: string
  productId?: string
  type: InteractionType
  context: InteractionContext
  sessionId?: string
  deviceType?: string
  referrer?: string
  searchQuery?: string
  duration?: number
  metadata?: Record<string, unknown>
}

export class InteractionService {
  async create(input: CreateInteractionInput) {
    const interaction = await prisma.interaction.create({
      data: {
        ...input,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    })

    // Update product view count if it's a view interaction
    if (input.type === "VIEW" && input.productId) {
      await prisma.product.update({
        where: { id: input.productId },
        data: { viewCount: { increment: 1 } },
      })
    }

    return interaction
  }

  async getUserInteractions(userId: string, type?: InteractionType, page = 1, limit = 50) {
    const where: Prisma.InteractionWhereInput = { userId }
    if (type) where.type = type

    const [interactions, total] = await Promise.all([
      prisma.interaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: { id: true, title: true, images: true, price: true },
          },
        },
      }),
      prisma.interaction.count({ where }),
    ])

    return { interactions, total }
  }

  async getProductInteractions(productId: string, page = 1, limit = 50) {
    const [interactions, total] = await Promise.all([
      prisma.interaction.findMany({
        where: { productId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.interaction.count({ where: { productId } }),
    ])

    return { interactions, total }
  }

  async getStats(startDate?: Date, endDate?: Date) {
    const where: Prisma.InteractionWhereInput = {}
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const [total, byType, byContext, uniqueUsers] = await Promise.all([
      prisma.interaction.count({ where }),
      prisma.interaction.groupBy({
        by: ["type"],
        where,
        _count: { _all: true },
      }),
      prisma.interaction.groupBy({
        by: ["context"],
        where,
        _count: { _all: true },
      }),
      prisma.interaction.groupBy({
        by: ["userId"],
        where,
      }),
    ])

    return {
      total,
      uniqueUsers: uniqueUsers.length,
      byType: byType.reduce((acc, t) => ({ ...acc, [t.type]: t._count._all }), {}),
      byContext: byContext.reduce((acc, c) => ({ ...acc, [c.context]: c._count._all }), {}),
    }
  }
}

export const interactionService = new InteractionService()
