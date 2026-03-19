import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/jwt"
import { z } from "zod"

// Schéma de validation pour une adresse
const addressSchema = z.object({
  type: z.string().default("livraison"),
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  company: z.string().optional(),
  address: z.string().min(1, "Adresse requise"),
  complement: z.string().optional(),
  city: z.string().min(1, "Ville requise"),
  postalCode: z.string().optional(),
  country: z.string().default("CI"),
  phone: z.string().min(1, "Téléphone requis"),
  isDefault: z.boolean().default(false)
})

// GET /api/user/addresses - Récupérer toutes les adresses
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

    const payload = await verifyToken(token, "access")

    // Récupérer les adresses
    const addresses = await prisma.address.findMany({
      where: { userId: payload.userId },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" }
      ]
    })

    return NextResponse.json({
      success: true,
      addresses
    })

  } catch (error) {
    console.error("GET /api/user/addresses error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch addresses" },
      { status: 401 }
    )
  }
}

// POST /api/user/addresses - Créer une nouvelle adresse
export async function POST(request: NextRequest) {
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

    const payload = await verifyToken(token, "access")
    const body = await request.json()

    // Valider les données
    const validation = addressSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid address data",
          errors: validation.error.errors 
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // Si c'est l'adresse par défaut, enlever le default des autres
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: payload.userId },
        data: { isDefault: false }
      })
    }

    // Créer l'adresse
    const address = await prisma.address.create({
      data: {
        ...data,
        userId: payload.userId
      }
    })

    return NextResponse.json({
      success: true,
      address,
      message: "Address created successfully"
    }, { status: 201 })

  } catch (error) {
    console.error("POST /api/user/addresses error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to create address" },
      { status: 400 }
    )
  }
}

// PUT /api/user/addresses/:id - Mettre à jour une adresse
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
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

    const payload = await verifyToken(token, "access")
    const body = await request.json()

    // Vérifier que l'adresse appartient à l'utilisateur
    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId: payload.userId
      }
    })

    if (!existingAddress) {
      return NextResponse.json(
        { success: false, message: "Address not found" },
        { status: 404 }
      )
    }

    // Valider les données
    const validation = addressSchema.partial().safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid address data",
          errors: validation.error.errors 
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // Si c'est l'adresse par défaut, enlever le default des autres
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { 
          userId: payload.userId,
          id: { not: id }
        },
        data: { isDefault: false }
      })
    }

    // Mettre à jour l'adresse
    const address = await prisma.address.update({
      where: { id },
      data
    })

    return NextResponse.json({
      success: true,
      address,
      message: "Address updated successfully"
    })

  } catch (error) {
    console.error("PUT /api/user/addresses error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update address" },
      { status: 400 }
    )
  }
}

// DELETE /api/user/addresses/:id - Supprimer une adresse
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
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

    const payload = await verifyToken(token, "access")

    // Vérifier que l'adresse appartient à l'utilisateur
    const address = await prisma.address.findFirst({
      where: {
        id,
        userId: payload.userId
      }
    })

    if (!address) {
      return NextResponse.json(
        { success: false, message: "Address not found" },
        { status: 404 }
      )
    }

    // Supprimer l'adresse
    await prisma.address.delete({
      where: { id }
    })

    // Si c'était l'adresse par défaut, définir une autre comme default
    if (address.isDefault) {
      const anotherAddress = await prisma.address.findFirst({
        where: { userId: payload.userId }
      })
      
      if (anotherAddress) {
        await prisma.address.update({
          where: { id: anotherAddress.id },
          data: { isDefault: true }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Address deleted successfully"
    })

  } catch (error) {
    console.error("DELETE /api/user/addresses error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to delete address" },
      { status: 400 }
    )
  }
}