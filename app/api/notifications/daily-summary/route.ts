import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const today = new Date().toISOString().split("T")[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    // Buscar vendas do dia
    const { data: todaySales } = await supabase
      .from("sales")
      .select(`
        *,
        sale_items(quantity)
      `)
      .gte("created_at", today)
      .eq("payment_status", "approved")

    // Buscar vendas de ontem para comparação
    const { data: yesterdaySales } = await supabase
      .from("sales")
      .select("total_amount")
      .gte("created_at", yesterday)
      .lt("created_at", today)
      .eq("payment_status", "approved")

    // Calcular métricas
    const todayRevenue = todaySales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0
    const todayCount = todaySales?.length || 0
    const todayItems =
      todaySales?.reduce((sum, sale) => {
        return sum + (sale.sale_items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0)
      }, 0) || 0

    const yesterdayRevenue = yesterdaySales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0
    const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0

    // Buscar produtos com estoque baixo
    const { data: lowStockProducts } = await supabase
      .from("products")
      .select("name, stock_quantity, min_stock_level")
      .filter("stock_quantity", "lte", "min_stock_level")
      .eq("is_active", true)

    // Preparar mensagem
    const message = formatDailySummaryMessage({
      todayRevenue,
      todayCount,
      todayItems,
      revenueChange,
      lowStockProducts: lowStockProducts || [],
    })

    // Enviar para webhook
    const webhookUrl = process.env.N8N_DAILY_SUMMARY_WEBHOOK

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.N8N_WEBHOOK_TOKEN}`,
        },
        body: JSON.stringify({
          event: "daily_summary",
          date: today,
          metrics: {
            revenue: todayRevenue,
            salesCount: todayCount,
            itemsSold: todayItems,
            revenueChange,
          },
          lowStockProducts,
          message,
        }),
      })
    }

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error("Daily summary error:", error)
    return NextResponse.json({ error: "Erro ao gerar resumo diário" }, { status: 500 })
  }
}

function formatDailySummaryMessage(data: any): string {
  const { todayRevenue, todayCount, todayItems, revenueChange, lowStockProducts } = data

  const changeEmoji = revenueChange > 0 ? "📈" : revenueChange < 0 ? "📉" : "➡️"
  const changeText = revenueChange > 0 ? `+${revenueChange.toFixed(1)}%` : `${revenueChange.toFixed(1)}%`

  let message =
    `📊 *RESUMO DIÁRIO - ${new Date().toLocaleDateString("pt-BR")}*\n\n` +
    `💰 Faturamento: R$ ${todayRevenue.toFixed(2)}\n` +
    `🛒 Vendas realizadas: ${todayCount}\n` +
    `📦 Itens vendidos: ${todayItems}\n` +
    `${changeEmoji} Variação: ${changeText} vs ontem\n\n`

  if (lowStockProducts.length > 0) {
    message += `⚠️ *PRODUTOS COM ESTOQUE BAIXO (${lowStockProducts.length}):*\n`
    lowStockProducts.slice(0, 5).forEach((product: any) => {
      message += `• ${product.name}: ${product.stock_quantity} unidades\n`
    })
    if (lowStockProducts.length > 5) {
      message += `• +${lowStockProducts.length - 5} outros produtos...\n`
    }
  } else {
    message += `✅ Todos os produtos com estoque adequado\n`
  }

  message += `\n🕐 Relatório gerado às ${new Date().toLocaleTimeString("pt-BR")}`

  return message
}
