import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const stats = await prisma.$transaction([
      prisma.graphNode.count(),
      prisma.graphEdge.count(),
      prisma.forYouScore.count(),
      prisma.interaction.count()
    ])

    return NextResponse.json({
      status: 'healthy',
      graph: {
        nodes: stats[0],
        edges: stats[1],
        forYouScores: stats[2],
        interactions: stats[3]
      }
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: String(error) },
      { status: 500 }
    )
  }
}