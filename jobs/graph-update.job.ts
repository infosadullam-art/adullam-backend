import { Worker, type Job } from "@/lib/queue"
import prisma from "@/lib/prisma"
import redis from "@/lib/redis"

interface GraphUpdateJobData {
  productId?: string
}

export async function graphUpdate(job: Job<GraphUpdateJobData>) {
  const { productId } = job.data

  const jobLog = await prisma.jobLog.create({
    data: {
      type: "GRAPH_UPDATE",
      status: "RUNNING",
      payload: { productId },
      startedAt: new Date(),
    },
  })

  try {
    // Get products to update
    const products = productId
      ? [await prisma.product.findUnique({ where: { id: productId } })]
      : await prisma.product.findMany({
          where: { status: "ACTIVE" },
          take: 500,
        })

    let nodesCreated = 0
    let edgesCreated = 0

    for (const product of products) {
      if (!product) continue

      // Create or update product node
      await prisma.graphNode.upsert({
        where: { type_entityId: { type: "PRODUCT", entityId: product.id } },
        create: {
          type: "PRODUCT",
          entityId: product.id,
          properties: {
            title: product.title,
            categoryId: product.categoryId,
            tags: product.tags,
            price: product.price,
          },
          embedding: [], // In production, generate embeddings
        },
        update: {
          properties: {
            title: product.title,
            categoryId: product.categoryId,
            tags: product.tags,
            price: product.price,
          },
        },
      })
      nodesCreated++

      // Create category edge if exists
      if (product.categoryId) {
        const productNode = await prisma.graphNode.findUnique({
          where: { type_entityId: { type: "PRODUCT", entityId: product.id } },
        })

        let categoryNode = await prisma.graphNode.findUnique({
          where: { type_entityId: { type: "CATEGORY", entityId: product.categoryId } },
        })

        if (!categoryNode) {
          categoryNode = await prisma.graphNode.create({
            data: {
              type: "CATEGORY",
              entityId: product.categoryId,
              properties: {},
              embedding: [],
            },
          })
          nodesCreated++
        }

        if (productNode && categoryNode) {
          await prisma.graphEdge.upsert({
            where: {
              fromNodeId_toNodeId_type: {
                fromNodeId: productNode.id,
                toNodeId: categoryNode.id,
                type: "BELONGS_TO",
              },
            },
            create: {
              fromNodeId: productNode.id,
              toNodeId: categoryNode.id,
              type: "BELONGS_TO",
              weight: 1,
            },
            update: {},
          })
          edgesCreated++
        }
      }

      await job.updateProgress(Math.round(((products.indexOf(product) + 1) / products.length) * 100))
    }

    await prisma.jobLog.update({
      where: { id: jobLog.id },
      data: {
        status: "COMPLETED",
        progress: 100,
        result: { nodesCreated, edgesCreated },
        completedAt: new Date(),
      },
    })

    return { nodesCreated, edgesCreated }
  } catch (error) {
    await prisma.jobLog.update({
      where: { id: jobLog.id },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      },
    })
    throw error
  }
}

export const graphUpdateWorker = new Worker("graphUpdate", graphUpdate, {
  connection: redis,
  concurrency: 2,
})
