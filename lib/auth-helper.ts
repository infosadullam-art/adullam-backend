// lib/auth-helper.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './jwt'
import prisma from './prisma'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string
    email: string
    role: string
  }
}

export async function getAuthenticatedUser(req: NextRequest) {
  const token = req.cookies.get('accessToken')?.value ||
    req.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) return null

  try {
    const payload = await verifyToken(token, 'access')
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, name: true }
    })

    return user
  } catch {
    return null
  }
}

export async function requireAuth(
  req: NextRequest,
  requiredRole?: 'ADMIN' | 'USER'
) {
  const user = await getAuthenticatedUser(req)

  if (!user) {
    return {
      error: NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }
  }

  if (requiredRole === 'ADMIN' && user.role !== 'ADMIN') {
    return {
      error: NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }
  }

  return { user }
}