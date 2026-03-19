import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const data = {
    products: { total: 10, byStatus: { ACTIVE: 5 } },
    orders: { totalOrders: 20, totalRevenue: 5000, avgOrderValue: 250, byStatus: { PENDING: 2 }, recentOrders: [] },
    imports: { totalBatches: 0, totalProducts: 0, duplicates: 0, fakes: 0, recentBatches: [] },
    interactions: { total: 0, uniqueUsers: 0, byType: {} },
    jobs: { total: 0, running: 0, failed: 0 }
  };

  return NextResponse.json(
    { success: true, data },
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3001", // autorise ton front
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}
