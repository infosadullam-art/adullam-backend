import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyPassword, generateAccessToken, generateRefreshToken } from "@/lib/auth"

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001"

export async function POST(request: NextRequest) {
  // Headers CORS pour la réponse
  const headers = {
    "Access-Control-Allow-Origin": FRONTEND_URL,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token",
  }

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password required" }, 
        { status: 400, headers }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" }, 
        { status: 401, headers }
      )
    }

    console.log("DB password hash:", user.password)
    console.log("Password entered:", password)

    const isValid = await verifyPassword(password, user.password)

    console.log("Password valid:", isValid)

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid password" }, 
        { status: 401, headers }
      )
    }

    // Génération des tokens
    const accessToken = await generateAccessToken({ userId: user.id, email: user.email, role: user.role })
    const refreshToken = await generateRefreshToken({ userId: user.id, email: user.email, role: user.role })

    // Stocker le refresh token dans User
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    })

    // Renvoie réponse + cookies
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role },
      accessToken,
    }, { headers })

    // Cookie accessToken
    response.cookies.set({
      name: "accessToken",
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    })

    // Cookie refreshToken
    response.cookies.set({
      name: "refreshToken",
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/refresh",
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (e) {
    console.error("LOGIN ERROR:", e)
    return NextResponse.json(
      { success: false, message: "Internal server error" }, 
      { status: 500, headers }
    )
  }
}

// Ajouter la méthode OPTIONS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": FRONTEND_URL,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
    },
  })
}