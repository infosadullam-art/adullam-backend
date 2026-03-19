import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { createReadStream } from "fs";
import { Readable } from "stream";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Attendre la résolution des paramètres
    const resolvedParams = await params;
    
    // Reconstruire le chemin complet
    const filePath = path.join(process.cwd(), "public", "uploads", ...resolvedParams.path);
    
    console.log("📁 Tentative d'accès au fichier:", filePath);
    console.log("📁 Répertoire de travail:", process.cwd());

    // Vérifier si le fichier existe
    try {
      await fs.access(filePath);
      console.log("✅ Fichier trouvé!");
    } catch {
      console.error("❌ Fichier non trouvé:", filePath);
      
      // Essayer de lister le contenu du dossier
      try {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "sourcing");
        const files = await fs.readdir(uploadDir);
        console.log("📁 Fichiers disponibles:", files);
      } catch (e) {
        console.error("❌ Impossible de lister le dossier:", e);
      }
      
      return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });
    }
    
    // Lire le fichier
    const fileBuffer = await fs.readFile(filePath);
    
    // Déterminer le type MIME
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const fileName = path.basename(filePath);
    
    // Retourner le fichier
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
    
  } catch (error) {
    console.error("❌ Erreur serveur détaillée:", error);
    
    // Retourner plus de détails pour le debug
    return NextResponse.json({ 
      error: "Erreur serveur",
      details: error instanceof Error ? error.message : "Erreur inconnue",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}