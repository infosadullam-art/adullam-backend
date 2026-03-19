// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyRefreshToken, generateAccessToken } from "@/lib/auth"
import prisma from "@/lib/prisma"

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001"

export async function POST(request: NextRequest) {
  const headers = {
    "Access-Control-Allow-Origin": FRONTEND_URL,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token",
  }

  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get("refreshToken")?.value

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: "No refresh token" },
        { status: 401, headers }
      )
    }

    const payload = await verifyRefreshToken(refreshToken)
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    })

    if (!user || user.refreshToken !== refreshToken) {
      return NextResponse.json(
        { success: false, message: "Invalid refresh token" },
        { status: 401, headers }
      )
    }

    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    const response = NextResponse.json({
      success: true,
      accessToken
    }, { headers })

    response.cookies.set({
      name: "accessToken",
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    })

    return response
  } catch (error) {
    console.error("Refresh error:", error)
    return NextResponse.json(
      { success: false, message: "Invalid refresh token" },
      { status: 401, headers }
    )
  }
}

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