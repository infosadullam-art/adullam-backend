// services/job.service.ts
import prisma from "@/lib/prisma"
import { queues, type QueueName } from "@/lib/queue"
import type { JobType, JobStatus, Prisma } from "@prisma/client"

export interface JobFilters {
  type?: JobType
  status?: JobStatus
}

export class JobService {
  /**
   * Crée un log de job
   */
  async createLog(type: JobType, payload?: Record<string, unknown>) {
    return prisma.jobLog.create({
      data: {
        type,
        payload: payload as Prisma.InputJsonValue,
        startedAt: new Date(), // timestamp de création
      },
    })
  }

  /**
   * Met à jour un log de job existant
   */
  async updateLog(
    id: string,
    data: {
      status?: JobStatus
      progress?: number
      result?: Record<string, unknown>
      errorMessage?: string
      startedAt?: Date
      completedAt?: Date
    },
  ) {
    return prisma.jobLog.update({
      where: { id },
      data: {
        ...data,
        result: data.result as Prisma.InputJsonValue,
      },
    })
  }

  /**
   * Liste des jobs avec filtres et pagination
   */
  async list(filters: JobFilters, page = 1, limit = 50) {
    const where: Prisma.JobLogWhereInput = {}

    if (filters.type) where.type = filters.type
    if (filters.status) where.status = filters.status

    const [jobs, total] = await Promise.all([
      prisma.jobLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.jobLog.count({ where }),
    ])

    return { jobs, total, page, limit }
  }

  /**
   * Récupère un job par son ID
   */
  async getById(id: string) {
    return prisma.jobLog.findUnique({ where: { id } })
  }

  /**
   * Déclenche un job sur une queue BullMQ
   */
  async triggerJob(queueName: QueueName, jobName: string, payload?: Record<string, unknown>) {
    const queue = queues[queueName]
    if (!queue) throw new Error(`Queue ${queueName} not found`)

    console.log(`Triggering job "${jobName}" on queue "${queueName}" with payload:`, payload)

    const job = await queue.add(jobName, payload || {})
    return { jobId: job.id, queueName, jobName }
  }

  /**
   * Récupère les statistiques de toutes les queues
   */
  async getQueueStats() {
    const stats: Record<string, unknown> = {}

    for (const [name, queue] of Object.entries(queues)) {
      try {
        const [waiting, active, completed, failed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
        ])
        stats[name] = { waiting, active, completed, failed, timestamp: new Date().toISOString() }
      } catch (err) {
        console.error(`Queue "${name}" unreachable:`, err)
        stats[name] = { error: "Queue unreachable" }
      }
    }

    return stats
  }

  /**
   * Récupère les statistiques globales des jobs et des queues
   */
  async getStats() {
    const [total, byType, byStatus, running, failed] = await Promise.all([
      prisma.jobLog.count(),
      prisma.jobLog.groupBy({
        by: ["type"],
        _count: { _all: true },
      }),
      prisma.jobLog.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.jobLog.count({ where: { status: "RUNNING" } }),
      prisma.jobLog.count({ where: { status: "FAILED" } }),
    ])

    const queueStats = await this.getQueueStats()

    return {
      total,
      running,
      failed,
      byType: byType.reduce((acc, t) => ({ ...acc, [t.type]: t._count._all }), {}),
      byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s.status]: s._count._all }), {}),
      queues: queueStats,
      timestamp: new Date().toISOString(),
    }
  }
}

export const jobService = new JobService()
