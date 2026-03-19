import prisma from "@/lib/prisma"
import type { NotificationChannel, NotificationStatus, NotificationType, Prisma } from "@prisma/client"

export interface CreateNotificationInput {
  userId: string
  type: NotificationType
  channel: NotificationChannel
  title: string
  message: string
  data?: Record<string, unknown>
}

export interface NotificationFilters {
  userId?: string
  type?: NotificationType
  channel?: NotificationChannel
  status?: NotificationStatus
}

export class NotificationService {
  async create(input: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        ...input,
        data: input.data as Prisma.InputJsonValue,
      },
    })
  }

  async markAsSent(id: string) {
    return prisma.notification.update({
      where: { id },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    })
  }

  async markAsDelivered(id: string) {
    return prisma.notification.update({
      where: { id },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
      },
    })
  }

  async markAsFailed(id: string, reason: string) {
    const notification = await prisma.notification.findUnique({ where: { id } })
    if (!notification) throw new Error("Notification not found")

    return prisma.notification.update({
      where: { id },
      data: {
        status: "FAILED",
        failReason: reason,
        retryCount: notification.retryCount + 1,
      },
    })
  }

  async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: {
        status: "READ",
        readAt: new Date(),
      },
    })
  }

  async list(filters: NotificationFilters, page = 1, limit = 50) {
    const where: Prisma.NotificationWhereInput = {}

    if (filters.userId) where.userId = filters.userId
    if (filters.type) where.type = filters.type
    if (filters.channel) where.channel = filters.channel
    if (filters.status) where.status = filters.status

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
    ])

    return { notifications, total }
  }

  async getStats() {
    const [total, byChannel, byStatus, byType, failedCount] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.groupBy({
        by: ["channel"],
        _count: { _all: true },
      }),
      prisma.notification.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.notification.groupBy({
        by: ["type"],
        _count: { _all: true },
      }),
      prisma.notification.count({ where: { status: "FAILED" } }),
    ])

    return {
      total,
      failedCount,
      byChannel: byChannel.reduce((acc, c) => ({ ...acc, [c.channel]: c._count._all }), {}),
      byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s.status]: s._count._all }), {}),
      byType: byType.reduce((acc, t) => ({ ...acc, [t.type]: t._count._all }), {}),
    }
  }
}

export const notificationService = new NotificationService()
