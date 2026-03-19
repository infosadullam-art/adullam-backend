import { NextResponse } from "next/server"
import { authService } from "@/services/auth.service"
import { getAuthUser } from "@/lib/auth"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = request.cookies
    let token = cookieStore.get("accessToken")?.value

    // 🔹 Vérifier l'Authorization header
    if (!token) {
      const authHeader = request.headers.get("authorization")
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1]
      }
    }

    // 🔹 Vérifier que l'utilisateur existe
    const user = token ? await getAuthUser(token) : null

    if (user) {
      // 🔹 Déconnexion côté serveur (supprimer refreshToken DB)
      await authService.logout(user.id)
    }

    // 🔹 Créer la réponse avec suppression des cookies côté client
    const response = NextResponse.json({ success: true, message: "Logged out successfully" })
    response.cookies.set("accessToken", "", { path: "/", maxAge: 0, httpOnly: true })
    response.cookies.set("refreshToken", "", { path: "/", maxAge: 0, httpOnly: true })

    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : "Logout failed"
    return NextResponse.json({ success: false, message }, { status: 400 })
  }
}
