import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { productId, productName, currentStock, minStock } = await request.json()

    // Preparar mensagem para WhatsApp
    const message =
      `🚨 *ALERTA DE ESTOQUE BAIXO*\n\n` +
      `📦 Produto: ${productName}\n` +
      `📊 Estoque atual: ${currentStock}\n` +
      `⚠️ Estoque mínimo: ${minStock}\n\n` +
      `É necessário repor o estoque urgentemente!`

    // Enviar para n8n webhook
    const webhookUrl = process.env.N8N_STOCK_ALERT_WEBHOOK

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.N8N_WEBHOOK_TOKEN}`,
        },
        body: JSON.stringify({
          event: "stock_alert",
          productId,
          productName,
          currentStock,
          minStock,
          message,
          urgencyLevel: currentStock === 0 ? "critical" : currentStock <= minStock * 0.5 ? "high" : "medium",
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Stock alert webhook error:", error)
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
  }
}
