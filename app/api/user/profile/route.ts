import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/jwt"
import { hashPassword } from "@/lib/auth"

// GET /api/user/profile - Récupérer le profil de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    // Récupérer le token
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.startsWith("Bearer ") 
      ? authHeader.split(" ")[1] 
      : request.cookies.get("accessToken")?.value

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Vérifier le token
    const payload = await verifyToken(token, "access")

    // Récupérer l'utilisateur avec ses infos
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        addresses: {
          orderBy: { isDefault: "desc" }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user
    })

  } catch (error) {
    console.error("GET /api/user/profile error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch profile" },
      { status: 401 }
    )
  }
}

// PUT /api/user/profile - Mettre à jour le profil
export async function PUT(request: NextRequest) {
  try {
    // Récupérer le token
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.startsWith("Bearer ") 
      ? authHeader.split(" ")[1] 
      : request.cookies.get("accessToken")?.value

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Vérifier le token
    const payload = await verifyToken(token, "access")

    // Récupérer les données du body
    const body = await request.json()
    const { name, phone, currentPassword, newPassword } = body

    // Préparer les données à mettre à jour
    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone

    // Si changement de mot de passe
    if (currentPassword && newPassword) {
      // Vérifier l'ancien mot de passe
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { password: true }
      })

      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        )
      }

      const { verifyPassword } = await import("@/lib/auth")
      const isValid = await verifyPassword(currentPassword, user.password)
      
      if (!isValid) {
        return NextResponse.json(
          { success: false, message: "Current password is incorrect" },
          { status: 400 }
        )
      }

      // Hasher le nouveau mot de passe
      const { hashPassword } = await import("@/lib/auth")
      updateData.password = await hashPassword(newPassword)
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully"
    })

  } catch (error) {
    console.error("PUT /api/user/profile error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update profile" },
      { status: 400 }
    )
  }
}