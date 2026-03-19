import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import type { UserRole } from "@prisma/client"

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001"

export async function GET(request: NextRequest) {
  try {
    // 1️⃣ Lire le header Authorization
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        {
          status: 401,
          headers: {
            "Access-Control-Allow-Origin": FRONTEND_URL,
            "Access-Control-Allow-Credentials": "true",
          },
        }
      )
    }

    // 2️⃣ Extraire le token
    const token = authHeader.split(" ")[1]

    // 3️⃣ Vérifier le JWT access
    const payload = await verifyToken(token, "access")

    // 4️⃣ Retourner les infos user sans stocker de token côté client
    return NextResponse.json(
      {
        success: true,
        user: {
          id: payload.userId,
          email: payload.email,
          role: payload.role as UserRole,
        },
        // 🔹 facultatif : on peut renvoyer un nouveau accessToken si besoin (rotation côté backend)
      },
      {
        headers: {
          "Access-Control-Allow-Origin": FRONTEND_URL,
          "Access-Control-Allow-Credentials": "true",
        },
      }
    )
  } catch (err: any) {
    // 🔹 Token invalide ou expiré : réponse 401
    return NextResponse.json(
      { success: false, message: err.message || "Unauthorized" },
      {
        status: 401,
        headers: {
          "Access-Control-Allow-Origin": FRONTEND_URL,
          "Access-Control-Allow-Credentials": "true",
        },
      }
    )
  }
}

/**
 * OPTIONS pour CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": FRONTEND_URL,
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  })
}
