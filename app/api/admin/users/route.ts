// backend/app/api/admin/users/route.ts
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, type JwtPayload } from "@/lib/jwt";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/utils/api-response";
import { getPaginationParams } from "@/lib/utils/pagination";
import type { User } from "@prisma/client";

/* -------------------------------------------------------------------------- */
/*                        AUTH HELPER - GET USER                               */
/* -------------------------------------------------------------------------- */
async function getAuthUser(request: NextRequest): Promise<User | null> {
  try {
    // ✅ 1. PRIORITÉ : Authorization header
    const authHeader = request.headers.get("authorization");
    let token: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "");
    }

    // ✅ 2. FALLBACK : cookie (si jamais)
    if (!token) {
      token = request.cookies.get("accessToken")?.value;
    }

    if (!token) return null;

    const payload: JwtPayload = await verifyToken(token, "access");
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    return user ?? null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                               GET USERS                                     */
/* -------------------------------------------------------------------------- */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== "ADMIN") {
      return errorResponse("Unauthorized", 403);
    }

    // 🔹 GET /admin/users/:id
    if (id && id !== "users") {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) return errorResponse("User not found", 404);
      return successResponse(user);
    }

    // 🔹 GET /admin/users (paginated)
    const { searchParams } = url;
    const { page, limit } = getPaginationParams(searchParams);
    const search = searchParams.get("search") || undefined;

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.user.count({
        where: search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
      }),
    ]);

    return paginatedResponse(users, total, page, limit);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch users";
    return errorResponse(message, 400);
  }
}

/* -------------------------------------------------------------------------- */
/*                              CREATE USER                                    */
/* -------------------------------------------------------------------------- */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== "ADMIN") {
      return errorResponse("Unauthorized", 403);
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return errorResponse("Name, email and password are required", 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse("User with this email already exists", 400);
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role: role || "USER",
      },
    });

    return successResponse(user, "User created successfully");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create user";
    return errorResponse(message, 400);
  }
}

/* -------------------------------------------------------------------------- */
/*                              UPDATE USER                                    */
/* -------------------------------------------------------------------------- */
export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== "ADMIN") {
      return errorResponse("Unauthorized", 403);
    }

    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();
    if (!id || id === "users") {
      return errorResponse("User ID required", 400);
    }

    const body = await request.json();
    const { name, email, role, password } = body;

    const user = await prisma.user.update({
      where: { id },
      data: { name, email, role, password },
    });

    return successResponse(user, "User updated successfully");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update user";
    return errorResponse(message, 400);
  }
}

/* -------------------------------------------------------------------------- */
/*                             DELETE USER                                     */
/* -------------------------------------------------------------------------- */
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== "ADMIN") {
      return errorResponse("Unauthorized", 403);
    }

    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();
    if (!id || id === "users") {
      return errorResponse("User ID required", 400);
    }

    await prisma.user.delete({ where: { id } });
    return successResponse(null, "User deleted successfully");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete user";
    return errorResponse(message, 400);
  }
}
