import prisma from "@/lib/prisma"
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from "@/lib/auth"
import type { User, UserRole } from "@prisma/client"

export interface RegisterInput {
  email: string
  password: string
  name?: string
  phone?: string
  role?: UserRole
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResult {
  user: Omit<User, "password" | "refreshToken">
  tokens: AuthTokens
}

export class AuthService {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    })

    if (existingUser) {
      throw new Error("User with this email already exists")
    }

    const hashedPassword = await hashPassword(input.password)

    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name,
        phone: input.phone,
        role: input.role || "USER",
      },
    })

    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const refreshToken = await generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    })

    const { password, refreshToken: _, ...safeUser } = user

    return {
      user: safeUser,
      tokens: { accessToken, refreshToken },
    }
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    })

    if (!user) {
      throw new Error("Invalid credentials")
    }

    const isValid = await verifyPassword(input.password, user.password)
    if (!isValid) {
      throw new Error("Invalid credentials")
    }

    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const refreshToken = await generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    })

    const { password, refreshToken: _, ...safeUser } = user

    return {
      user: safeUser,
      tokens: { accessToken, refreshToken },
    }
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const payload = await verifyToken(refreshToken, "refresh")

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user || user.refreshToken !== refreshToken) {
      throw new Error("Invalid refresh token")
    }

    const newAccessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const newRefreshToken = await generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    })

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }
  }

  async logout(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    })
  }

  async getProfile(
    userId: string
  ): Promise<Omit<User, "password" | "refreshToken">> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error("User not found")
    }

    const { password, refreshToken, ...safeUser } = user
    return safeUser
  }
}

export const authService = new AuthService()
