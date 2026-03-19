import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse("No token provided", 401);
    }

    const token = authHeader.split(" ")[1];
    const payload = await verifyToken(token);

    if (!payload) {
      return errorResponse("Invalid token", 401);
    }

    return successResponse(payload, "Token is valid");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Token verification failed";
    return errorResponse(message, 401);
  }
}
