// app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server"
import { productService } from "@/services/product.service"
import { orderService } from "@/services/order.service"
import { importService } from "@/services/import.service"
import { interactionService } from "@/services/interaction.service"
import { jobService } from "@/services/job.service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined

    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined

    console.log("🟢 Dashboard API: Fetching stats...")

    // On récupère toutes les stats en parallèle
    const [
      productStats,
      orderStats,
      importStats,
      interactionStats,
      jobStats,
    ] = await Promise.all([
      productService.getStats().catch(err => {
        console.error("productService.getStats failed:", err)
        return { total: 0, byStatus: {} }
      }),
      orderService.getStats(startDate, endDate).catch(err => {
        console.error("orderService.getStats failed:", err)
        return {
          totalOrders: 0,
          totalRevenue: 0,
          avgOrderValue: 0,
          byStatus: {},
          recentOrders: [],
        }
      }),
      importService.getImportStats().catch(err => {
        console.error("importService.getImportStats failed:", err)
        return {
          totalBatches: 0,
          totalProducts: 0,
          duplicates: 0,
          fakes: 0,
          recentBatches: [],
        }
      }),
      interactionService.getStats(startDate, endDate).catch(err => {
        console.error("interactionService.getStats failed:", err)
        return { total: 0, uniqueUsers: 0, byType: {} }
      }),
      jobService.getStats().catch(err => {
        console.error("jobService.getStats failed:", err)
        return { total: 0, running: 0, failed: 0 }
      }),
    ])

    // ✅ Retour au frontend avec le format attendu
    return NextResponse.json(
      {
        success: true, // 🔹 obligatoire pour le frontend
        data: {
          products: productStats,
          orders: orderStats,
          imports: importStats,
          interactions: interactionStats,
          jobs: jobStats,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Dashboard API Critical Error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to get dashboard data" },
      { status: 500 }
    )
  }
}
