import { NextResponse } from "next/server";
import { Pipeline } from "@/importer/core/pipeline";
import type { ImportSource } from "@/importer/config/types";

export const maxDuration = 300; // 5 minutes max for serverless

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      query,
      source = "ALIBABA",
      maxPages = 3,
      dryRun = false,
    } = body as {
      query: string;
      source?: ImportSource;
      maxPages?: number;
      dryRun?: boolean;
    };

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return NextResponse.json(
        { error: "A valid search query is required (min 2 characters)" },
        { status: 400 }
      );
    }

    const pipeline = new Pipeline();
    const stats = await pipeline.run({
      source,
      searchQuery: query.trim(),
      maxPages: Math.min(maxPages, 10),
      dryRun,
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalFetched: stats.totalFetched,
        totalEnriched: stats.totalEnriched,
        totalParsed: stats.totalParsed,
        totalValidated: stats.totalValidated,
        totalCleaned: stats.totalCleaned,
        totalRejected: stats.totalRejected,
        rejectionReasons: stats.rejectionReasons,
        duration: stats.duration,
      },
    });
  } catch (error) {
    console.error("[API] Pipeline error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Pipeline execution failed" },
      { status: 500 }
    );
  }
}
