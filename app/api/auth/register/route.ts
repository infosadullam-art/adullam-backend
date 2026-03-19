// backend/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/services/auth.service"
import { successResponse, errorResponse } from "@/lib/utils/api-response"

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001"

export async function POST(request: NextRequest) {
  const headers = {
    "Access-Control-Allow-Origin": FRONTEND_URL,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }

  try {
    const body = await request.json()
    console.log("📦 [REGISTER] Body reçu:", body)
    
    const { email, password, name, phone } = body

    if (!email || !password) {
      console.log("❌ [REGISTER] Email ou password manquant")
      return NextResponse.json(
        { 
          success: false, 
          error: "Email and password are required",
          message: "Email and password are required"
        },
        { status: 400, headers }
      )
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase().trim() } 
    })
    
    if (existingUser) {
      console.log("❌ [REGISTER] Utilisateur existe déjà:", email)
      return NextResponse.json(
        { 
          success: false, 
          error: "Cet email est déjà utilisé",
          message: "Cet email est déjà utilisé"
        },
        { status: 409, headers }
      )
    }

    const result = await authService.register({ 
      email: email.toLowerCase().trim(), 
      password, 
      name, 
      phone 
    })

    console.log("✅ [REGISTER] Succès pour:", email)

    const cookieStore = await cookies()

    cookieStore.set({
      name: "accessToken",
      value: result.tokens.accessToken,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60,
    })

    cookieStore.set({
      name: "refreshToken",
      value: result.tokens.refreshToken,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60,
    })

    return NextResponse.json({
      success: true,
      user: result.user,
      accessToken: result.tokens.accessToken,
      message: "Registration successful"
    }, { headers })
    
  } catch (error) {
    console.error("❌ [REGISTER] Erreur:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Registration failed",
        message: error instanceof Error ? error.message : "Registration failed"
      },
      { status: 400, headers }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": FRONTEND_URL,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
    },
  })
}