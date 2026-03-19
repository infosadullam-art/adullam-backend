// app/api/sourcing/needs/route.ts
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
} from "@/lib/utils/api-response";
import { verifyToken, type JwtPayload } from "@/lib/jwt";
import type { User } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

async function getAuthUser(request: NextRequest): Promise<User | null> {
  try {
    const token = request.cookies.get("accessToken")?.value;
    if (!token) return null;
    const payload: JwtPayload = await verifyToken(token, "access");
    if (!payload?.userId) return null;
    return await prisma.user.findUnique({ where: { id: payload.userId } });
  } catch {
    return null;
  }
}

// ✅ Gère à la fois JSON et FormData
async function parseBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  
  if (contentType.includes("multipart/form-data")) {
    return await request.formData();
  } else {
    return await request.json();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return errorResponse("Non autorisé", 401);

    const body = await parseBody(request);
    
    // Extraction des données (que ce soit JSON ou FormData)
    let title, productType, description, quantity, quantityUnit;
    let budgetMin, budgetMax, deadline, priority;
    let fullName, email, phone, company;
    let files: File[] = [];

    if (body instanceof FormData) {
      // Cas FormData (avec fichiers)
      title = body.get("title") as string;
      productType = body.get("productType") as string;
      description = body.get("description") as string;
      quantity = parseInt(body.get("quantity") as string);
      quantityUnit = body.get("quantityUnit") as string || "pièces";
      budgetMin = body.get("budgetMin") ? parseFloat(body.get("budgetMin") as string) : null;
      budgetMax = body.get("budgetMax") ? parseFloat(body.get("budgetMax") as string) : null;
      deadline = body.get("deadline") ? new Date(body.get("deadline") as string) : null;
      priority = body.get("priority") as string || "MOYENNE";
      fullName = body.get("fullName") as string;
      email = body.get("email") as string;
      phone = body.get("phone") as string || null;
      company = body.get("company") as string || null;
      
      // Récupérer les fichiers
      files = body.getAll("documents") as File[];
    } else {
      // Cas JSON (sans fichiers)
      title = body.title;
      productType = body.productType;
      description = body.description;
      quantity = parseInt(body.quantity);
      quantityUnit = body.quantityUnit || "pièces";
      budgetMin = body.budgetMin ? parseFloat(body.budgetMin) : null;
      budgetMax = body.budgetMax ? parseFloat(body.budgetMax) : null;
      deadline = body.deadline ? new Date(body.deadline) : null;
      priority = body.priority || "MOYENNE";
      fullName = body.fullName;
      email = body.email;
      phone = body.phone || null;
      company = body.company || null;
    }

    if (!title || !productType || !description || !quantity) {
      return errorResponse("Champs requis manquants", 400);
    }

    // Upload des fichiers si présents
    const documents = [];
    if (files.length > 0) {
      const uploadDir = path.join(process.cwd(), "public/uploads/sourcing");
      await mkdir(uploadDir, { recursive: true });

      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = `${uuidv4()}-${file.name}`;
        const filePath = path.join(uploadDir, fileName);
        await writeFile(filePath, buffer);

        documents.push({
          fileName: file.name,
          url: `/uploads/sourcing/${fileName}`,
          size: file.size,
          type: file.type
        });
      }
    }

    // Création du besoin
    const need = await prisma.sourcingRequest.create({
      data: {
        productName: title,
        productType,
        description,
        quantity,
        quantityUnit,
        budgetMin,
        budgetMax,
        deadline,
        status: "PENDING",
        userId: user.id,
        fullName: fullName || user.name || "",
        email: email || user.email || "",
        phone: phone || user.phone || null,
        company: company || null,
        documents: documents.length > 0 ? JSON.stringify(documents) : null,
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } }
      }
    });

    return successResponse(need, "Besoin créé avec succès", 201);
  } catch (error) {
    console.error("❌ Erreur création:", error);
    return errorResponse("Erreur création", 400);
  }
}