import prisma from "@/lib/prisma"
import type { AdsPlatform, AdsEventType, Prisma } from "@prisma/client"

export interface CreateAdsEventInput {
  platform: AdsPlatform
  eventType: AdsEventType
  productId?: string
  campaignId?: string
  adSetId?: string
  adId?: string
  cost?: number
  revenue?: number
  currency?: string
  deviceType?: string
  country?: string
  metadata?: Record<string, unknown>
  occurredAt: Date
}

export interface AdsFilters {
  platform?: AdsPlatform
  eventType?: AdsEventType
  campaignId?: string
  startDate?: Date
  endDate?: Date
}

export class AdsService {
  async createEvent(input: CreateAdsEventInput) {
    return prisma.adsEvent.create({
      data: {
        ...input,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    })
  }

  async bulkCreateEvents(events: CreateAdsEventInput[]) {
    return prisma.adsEvent.createMany({
      data: events.map((e) => ({
        ...e,
        metadata: e.metadata as Prisma.InputJsonValue,
      })),
    })
  }

  async list(filters: AdsFilters, page = 1, limit = 50) {
    const where: Prisma.AdsEventWhereInput = {}

    if (filters.platform) where.platform = filters.platform
    if (filters.eventType) where.eventType = filters.eventType
    if (filters.campaignId) where.campaignId = filters.campaignId
    if (filters.startDate || filters.endDate) {
      where.occurredAt = {}
      if (filters.startDate) where.occurredAt.gte = filters.startDate
      if (filters.endDate) where.occurredAt.lte = filters.endDate
    }

    const [events, total] = await Promise.all([
      prisma.adsEvent.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { occurredAt: "desc" },
        include: {
          product: {
            select: { id: true, title: true },
          },
        },
      }),
      prisma.adsEvent.count({ where }),
    ])

    return { events, total }
  }

  async getPerformance(filters: AdsFilters) {
    const where: Prisma.AdsEventWhereInput = {}

    if (filters.platform) where.platform = filters.platform
    if (filters.campaignId) where.campaignId = filters.campaignId
    if (filters.startDate || filters.endDate) {
      where.occurredAt = {}
      if (filters.startDate) where.occurredAt.gte = filters.startDate
      if (filters.endDate) where.occurredAt.lte = filters.endDate
    }

    const [impressions, clicks, conversions, totalSpend, totalRevenue, byPlatform, byCampaign] = await Promise.all([
      prisma.adsEvent.count({ where: { ...where, eventType: "IMPRESSION" } }),
      prisma.adsEvent.count({ where: { ...where, eventType: "CLICK" } }),
      prisma.adsEvent.count({ where: { ...where, eventType: "CONVERSION" } }),
      prisma.adsEvent.aggregate({
        where,
        _sum: { cost: true },
      }),
      prisma.adsEvent.aggregate({
        where: { ...where, eventType: "PURCHASE" },
        _sum: { revenue: true },
      }),
      prisma.adsEvent.groupBy({
        by: ["platform"],
        where,
        _count: { _all: true },
        _sum: { cost: true, revenue: true },
      }),
      prisma.adsEvent.groupBy({
        by: ["campaignId"],
        where,
        _count: { _all: true },
        _sum: { cost: true, revenue: true },
      }),
    ])

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0
    const spend = totalSpend._sum.cost || 0
    const revenue = totalRevenue._sum.revenue || 0
    const roas = spend > 0 ? revenue / spend : 0

    return {
      impressions,
      clicks,
      conversions,
      ctr,
      conversionRate,
      spend,
      revenue,
      roas,
      byPlatform: byPlatform.map((p) => ({
        platform: p.platform,
        count: p._count._all,
        spend: p._sum.cost || 0,
        revenue: p._sum.revenue || 0,
      })),
      byCampaign: byCampaign
        .filter((c) => c.campaignId)
        .map((c) => ({
          campaignId: c.campaignId,
          count: c._count._all,
          spend: c._sum.cost || 0,
          revenue: c._sum.revenue || 0,
        })),
    }
  }
}

export const adsService = new AdsService()
