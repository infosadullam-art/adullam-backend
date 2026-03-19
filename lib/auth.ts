import prisma from "@/lib/prisma"
import { hash, compare } from "bcryptjs"
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken as verifyJwtToken,
  type JwtPayload,
} from "@/lib/jwt"
import type { User } from "@prisma/client"
import { NextRequest } from "next/server"

/* -------------------------------------------------------------------------- */
/*                             PASSWORD HELPERS                               */
/* -------------------------------------------------------------------------- */

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await compare(password, hashedPassword)
}

/* -------------------------------------------------------------------------- */
/*                               TOKEN HELPERS                                */
/* -------------------------------------------------------------------------- */

export { generateAccessToken, generateRefreshToken }

// ✅ AJOUTEZ CETTE FONCTION ICI
export async function verifyRefreshToken(token: string): Promise<JwtPayload> {
  return await verifyJwtToken(token, "refresh")
}

/**
 * Vérifie un token JWT et garantit un JwtPayload valide
 */
export async function verifyToken(
  token: string,
  type: "access" | "refresh"
): Promise<JwtPayload> {
  return await verifyJwtToken(token, type)
}

/* -------------------------------------------------------------------------- */
/*                                AUTH USER                                   */
/* -------------------------------------------------------------------------- */

/**
 * Récupère l'utilisateur connecté à partir du token
 */
export async function getAuthUser(token: string): Promise<User | null> {
  try {
    const payload = await verifyToken(token, "access")

    return await prisma.user.findUnique({
      where: { id: payload.userId },
    })
  } catch {
    return null
  }
}

/* -------------------------------------------------------------------------- */
/*                               REQUIRE HELPERS                               */
/* -------------------------------------------------------------------------- */

/**
 * Vérifie que l'utilisateur est connecté via le token dans le header ou cookie
 */
export async function requireAuth(token?: string): Promise<User> {
  if (!token) throw new Error("Unauthorized")
  const user = await getAuthUser(token)
  if (!user) throw new Error("Unauthorized")
  return user
}

/**
 * Vérifie que l'utilisateur est ADMIN
 */
export async function requireAdmin(token?: string): Promise<User> {
  const user = await requireAuth(token)
  if (user.role !== "ADMIN") throw new Error("Forbidden")
  return user
}

/* -------------------------------------------------------------------------- */
/*                        ✅ USER FROM REQUEST (AJOUT)                         */
/* -------------------------------------------------------------------------- */

/**
 * Récupère l'utilisateur depuis une requête Next (Header ou Cookie)
 * 👉 utilisé par les routes API (For You, etc.)
 */
export async function getUserFromRequest(
  req: NextRequest
): Promise<User | null> {
  let token: string | undefined

  // 1️⃣ Authorization: Bearer xxx
  const authHeader = req.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7)
  }

  // 2️⃣ Cookie accessToken (fallback)
  if (!token) {
    token = req.cookies.get("accessToken")?.value
  }

  if (!token) return null

  return await getAuthUser(token)
}