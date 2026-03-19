import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { SecurityService } from "@/lib/security"
import { verificationStore } from "@/lib/verification-store"
import { emailSchema, phoneSchema } from "@/lib/validation"
import { sendEmail } from "@/lib/email"

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001"

const requestSchema = z.object({
  identifier: z.string(),
  method: z.enum(["email", "phone"])
})

export async function POST(req: NextRequest) {
  const headers = {
    "Access-Control-Allow-Origin": FRONTEND_URL,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token",
  }

  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown"
    
    if (!SecurityService.checkRateLimit(`send-code:${ip}`, 3, 3600000)) {
      return NextResponse.json(
        { success: false, error: "Trop de demandes. Réessayez plus tard." },
        { status: 429, headers }
      )
    }

    const body = await req.json()
    const validation = requestSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Données invalides" },
        { status: 400, headers }
      )
    }

    const { identifier, method } = validation.data

    let validatedIdentifier: string
    try {
      if (method === "email") {
        validatedIdentifier = emailSchema.parse(identifier)
      } else {
        validatedIdentifier = phoneSchema.parse(identifier)
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: `${method === "email" ? "Email" : "Téléphone"} invalide` },
        { status: 400, headers }
      )
    }

    const existingUser = await prisma.user.findFirst({
      where: method === "email" 
        ? { email: validatedIdentifier }
        : { phone: validatedIdentifier }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Un compte existe déjà avec cet identifiant" },
        { status: 409, headers }
      )
    }

    const code = SecurityService.generateVerificationCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    verificationStore.set(validatedIdentifier, {
      code,
      method,
      expiresAt,
      attempts: 0
    })

    let sent = false
    
    if (method === "email") {
      sent = await sendEmail(validatedIdentifier, code)
    } else {
      console.log(`📱 SMS simulé pour ${validatedIdentifier}: ${code}`)
      sent = true
    }
    
    if (!sent) {
      return NextResponse.json(
        { success: false, error: "Erreur lors de l'envoi du code" },
        { status: 500, headers }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: `Code envoyé à ${validatedIdentifier}`
    }, { headers })
    
  } catch (error) {
    console.error("❌ Erreur:", error)
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500, headers }
    )
  }
}

export async function OPTIONS() {
  console.log("✅ OPTIONS called with headers:", {
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token"
  })
  
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