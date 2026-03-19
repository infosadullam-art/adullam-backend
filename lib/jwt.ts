import { SignJWT, jwtVerify } from "jose"
import type { UserRole } from "@prisma/client"

/* -------------------------------------------------------------------------- */
/*                                   CONFIG                                   */
/* -------------------------------------------------------------------------- */

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "DEV_SECRET_CHANGE_ME"
)

const ACCESS_TOKEN_EXPIRES_IN = "15m"
const REFRESH_TOKEN_EXPIRES_IN = "7d"

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export type JwtPayload = {
  userId: string
  email: string
  role: UserRole
  type: "access" | "refresh"
}

/* -------------------------------------------------------------------------- */
/*                               TOKEN GENERATION                              */
/* -------------------------------------------------------------------------- */

export async function generateAccessToken(input: {
  userId: string
  email: string
  role: UserRole
}): Promise<string> {
  return await new SignJWT({
    userId: input.userId,
    email: input.email,
    role: input.role,
    type: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES_IN)
    .sign(JWT_SECRET)
}

export async function generateRefreshToken(input: {
  userId: string
  email: string
  role: UserRole
}): Promise<string> {
  return await new SignJWT({
    userId: input.userId,
    email: input.email,
    role: input.role,
    type: "refresh",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRES_IN)
    .sign(JWT_SECRET)
}

/* -------------------------------------------------------------------------- */
/*                              TOKEN VERIFICATION                             */
/* -------------------------------------------------------------------------- */

export async function verifyToken(
  token: string,
  expectedType: "access" | "refresh"
): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET)

  if (
    typeof payload !== "object" ||
    payload === null ||
    payload.type !== expectedType ||
    typeof payload.userId !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.role !== "string"
  ) {
    throw new Error(`Invalid ${expectedType} token`)
  }

  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role as UserRole,
    type: expectedType,
  }
}
