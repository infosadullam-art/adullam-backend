import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { verificationStore } from "@/lib/verification-store"
import { verificationCodeSchema } from "@/lib/validation"

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001"

const requestSchema = z.object({
  identifier: z.string(),
  code: verificationCodeSchema
})

export async function POST(req: NextRequest) {
  console.log("🚀 [VERIFY-CODE] Appel reçu")
  
  const headers = {
    "Access-Control-Allow-Origin": FRONTEND_URL,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }

  try {
    const body = await req.json()
    console.log("📦 [VERIFY-CODE] Body reçu:", body)

    const validation = requestSchema.safeParse(body)
    
    if (!validation.success) {
      console.log("❌ [VERIFY-CODE] Validation échouée:", validation.error)
      return NextResponse.json(
        { success: false, error: "Code invalide" },
        { status: 400, headers }
      )
    }

    const { identifier, code } = validation.data
    console.log(`🔍 [VERIFY-CODE] Vérification pour: ${identifier}`)
    console.log(`🔐 [VERIFY-CODE] Code reçu: ${code}`)

    // Récupérer la vérification
    const verification = verificationStore.get(identifier)
    console.log("📦 [VERIFY-CODE] Store contient:", verification ? {
      code: verification.code,
      attempts: verification.attempts,
      expiresAt: verification.expiresAt,
      verified: verification.verified
    } : "RIEN")

    if (!verification) {
      console.log("❌ [VERIFY-CODE] Aucun code trouvé pour:", identifier)
      return NextResponse.json(
        { success: false, error: "Code de vérification introuvable" },
        { status: 400, headers }
      )
    }

    // Vérifier les tentatives (max 3)
    if (verification.attempts >= 3) {
      console.log("❌ [VERIFY-CODE] Trop de tentatives:", verification.attempts)
      verificationStore.delete(identifier)
      return NextResponse.json(
        { success: false, error: "Trop de tentatives. Recommencez." },
        { status: 429, headers }
      )
    }

    // Vérifier l'expiration (10 minutes)
    const now = new Date()
    console.log("⏰ [VERIFY-CODE] Date actuelle:", now.toISOString())
    console.log("⏰ [VERIFY-CODE] Expiration:", verification.expiresAt.toISOString())
    
    if (now > verification.expiresAt) {
      console.log("❌ [VERIFY-CODE] Code expiré")
      verificationStore.delete(identifier)
      return NextResponse.json(
        { success: false, error: "Code expiré. Demandez un nouveau code." },
        { status: 400, headers }
      )
    }

    // Vérifier le code
    console.log(`🔐 [VERIFY-CODE] Code stocké: ${verification.code}, Code reçu: ${code}`)
    
    if (verification.code !== code) {
      console.log("❌ [VERIFY-CODE] Code incorrect")
      verification.attempts++
      verificationStore.set(identifier, verification)
      console.log(`⚠️ [VERIFY-CODE] Tentative ${verification.attempts}/3`)
      
      return NextResponse.json(
        { success: false, error: "Code incorrect" },
        { status: 400, headers }
      )
    }

    console.log("✅ [VERIFY-CODE] Code valide !")
    
    // Code valide - marquer comme vérifié
    verification.verified = true
    verification.verifiedAt = new Date()
    verificationStore.set(identifier, verification)
    
    console.log("✨ [VERIFY-CODE] Code marqué comme vérifié")

    return NextResponse.json({
      success: true,
      message: "Code vérifié avec succès"
    }, { headers })
    
  } catch (error) {
    console.error("❌ [VERIFY-CODE] Erreur:", error)
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500, headers }
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