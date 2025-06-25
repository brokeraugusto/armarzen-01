import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  const supabase = createServerClient()

  try {
    const today = new Date().toISOString().split("T")[0]
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]

    // Today's metrics
    const { data: todaySales } = await supabase
      .from("sales")
      .select("total_amount")
      .gte("created_at", today)
      .eq("payment_status", "approved")

    // Month's metrics
    const { data: monthSales } = await supabase
      .from("sales")
      .select("total_amount")
      .gte("created_at", monthStart)
      .eq("payment_status", "approved")

    // Low stock products
    const { data: lowStockProducts } = await supabase
      .from("products")
      .select("id")
      .filter("stock_quantity", "lte", "min_stock_level")
      .eq("is_active", true)

    // Pending payments
    const { data: pendingPayments } = await supabase.from("sales").select("id").eq("payment_status", "pending")

    const todayRevenue = todaySales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0
    const monthRevenue = monthSales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0

    const metrics = {
      todayRevenue,
      todaySales: todaySales?.length || 0,
      monthRevenue,
      monthProfit: monthRevenue * 0.3, // Simplified calculation
      lowStockItems: lowStockProducts?.length || 0,
      pendingPayments: pendingPayments?.length || 0,
    }

    return NextResponse.json(metrics)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
