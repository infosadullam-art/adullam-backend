import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken, type JwtPayload } from "@/lib/jwt"
import type { User } from "@prisma/client"

export async function getAuthUser(request: NextRequest): Promise<User | null> {
  try {
    const token = request.cookies.get("accessToken")?.value
    if (!token) return null

    const payload: JwtPayload = await verifyToken(token, "access")
    if (!payload?.userId) return null

    return await prisma.user.findUnique({
      where: { id: payload.userId },
    })
  } catch {
    return null
  }
}
