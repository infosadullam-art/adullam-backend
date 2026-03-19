import { prisma } from "@/lib/prisma";
import type { SourcingRequestStatus, Prisma } from "@prisma/client";

export interface SourcingFilters {
  status?: SourcingRequestStatus;
  userId?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface CreateSourcingInput {
  productName: string;
  productType: string;
  description: string;
  quantity: number;
  quantityUnit: string;
  budgetMin?: number;
  budgetMax?: number;
  deadline?: Date;
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  documents?: any[];
}

export interface UpdateSourcingInput {
  status?: SourcingRequestStatus;
  adminNotes?: string;
  response?: string;
  responseFile?: any;
  viewedAt?: Date;
  respondedAt?: Date;
}

class SourcingService {
  async create(data: CreateSourcingInput) {
    const request = await prisma.sourcingRequest.create({
      data: {
        productName: data.productName,
        productType: data.productType,
        description: data.description,
        quantity: data.quantity,
        quantityUnit: data.quantityUnit,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        deadline: data.deadline,
        userId: data.userId,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        company: data.company,
        documents: data.documents ? JSON.parse(JSON.stringify(data.documents)) : null,
        status: "PENDING"
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    return request;
  }

  async list(filters: SourcingFilters = {}, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const where: Prisma.SourcingRequestWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.search) {
      where.OR = [
        { productName: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { fullName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } }
      ];
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [requests, total] = await Promise.all([
      prisma.sourcingRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.sourcingRequest.count({ where })
    ]);

    return { requests, total };
  }

  async getById(id: string) {
    return await prisma.sourcingRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true
          }
        }
      }
    });
  }

  async update(id: string, data: UpdateSourcingInput) {
    return await prisma.sourcingRequest.update({
      where: { id },
      data: {
        status: data.status,
        adminNotes: data.adminNotes,
        response: data.response,
        responseFile: data.responseFile ? JSON.parse(JSON.stringify(data.responseFile)) : undefined,
        viewedAt: data.viewedAt,
        respondedAt: data.respondedAt,
        updatedAt: new Date()
      }
    });
  }

  async delete(id: string) {
    await prisma.sourcingRequest.delete({
      where: { id }
    });
    return { success: true };
  }

  async getStats() {
    const [
      total,
      pending,
      inReview,
      quoted,
      responded,
      closed
    ] = await Promise.all([
      prisma.sourcingRequest.count(),
      prisma.sourcingRequest.count({ where: { status: "PENDING" } }),
      prisma.sourcingRequest.count({ where: { status: "IN_REVIEW" } }),
      prisma.sourcingRequest.count({ where: { status: "QUOTED" } }),
      prisma.sourcingRequest.count({ where: { status: "RESPONDED" } }),
      prisma.sourcingRequest.count({ where: { status: "CLOSED" } })
    ]);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonth = await prisma.sourcingRequest.count({
      where: {
        createdAt: { gte: startOfMonth }
      }
    });

    return { total, pending, inReview, quoted, responded, closed, thisMonth };
  }
}

export const sourcingService = new SourcingService();