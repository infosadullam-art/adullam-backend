import { prisma } from "@/lib/prisma"
import type { Prisma, ProductVideo, ProductVideoStatus } from "@prisma/client"

export interface CreateVideoInput {
  productId: string
  videoUrl: string
  thumbnailUrl?: string
  duration?: number
  status?: ProductVideoStatus
  sortOrder?: number
}

export interface UpdateVideoInput extends Partial<CreateVideoInput> {}

export interface VideoFilters {
  productId?: string
  status?: ProductVideoStatus
}

export class VideoService {
  async create(input: CreateVideoInput) {
    return prisma.productVideo.create({
      data: {
        productId: input.productId,
        videoUrl: input.videoUrl,
        thumbnailUrl: input.thumbnailUrl,
        duration: input.duration,
        status: input.status ?? "DRAFT",
        sortOrder: input.sortOrder ?? 0,
      },
      include: {
        product: { select: { id: true, title: true, slug: true } },
      },
    })
  }

  async update(id: string, input: UpdateVideoInput) {
    return prisma.productVideo.update({
      where: { id },
      data: {
        videoUrl: input.videoUrl,
        thumbnailUrl: input.thumbnailUrl,
        duration: input.duration,
        status: input.status,
        sortOrder: input.sortOrder,
        productId: input.productId,
      },
      include: {
        product: { select: { id: true, title: true, slug: true } },
      },
    })
  }

  async delete(id: string) {
    return prisma.productVideo.delete({ where: { id } })
  }

  async getById(id: string) {
    return prisma.productVideo.findUnique({
      where: { id },
      include: { product: { select: { id: true, title: true, slug: true } } },
    })
  }

  async list(filters: VideoFilters, page = 1, limit = 20) {
    const where: Prisma.ProductVideoWhereInput = {}
    if (filters.status) where.status = filters.status
    if (filters.productId) where.productId = filters.productId

    const [videos, total] = await Promise.all([
      prisma.productVideo.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { product: { select: { id: true, title: true, slug: true } } },
      }),
      prisma.productVideo.count({ where }),
    ])

    return { videos, total }
  }

  async getStats() {
    const [total, byStatus] = await Promise.all([
      prisma.productVideo.count(),
      prisma.productVideo.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ])

    return {
      total,
      byStatus: byStatus.reduce(
        (acc, s) => ({ ...acc, [s.status]: s._count._all }),
        {} as Record<ProductVideoStatus, number>
      ),
    }
  }
}

export const videoService = new VideoService()
