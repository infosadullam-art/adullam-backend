import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const { provider } = params
  
  // Rediriger vers la page de connexion avec un message
  // En attendant d'implémenter OAuth
  return NextResponse.redirect(
    new URL(`/account?mode=login&error=${provider}`, request.url)
  )
}