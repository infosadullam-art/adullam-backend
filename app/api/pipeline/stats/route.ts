import { NextResponse } from "next/server";
import { DbService } from "@/importer/db/db-service";

export async function GET() {
  try {
    const db = new DbService();
    const stats = await db.getPipelineStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("[API] Stats error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
