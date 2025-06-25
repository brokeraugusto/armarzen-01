import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { saleId, saleNumber, totalAmount, itemCount } = await request.json()

    // Preparar mensagem para WhatsApp
    const message =
      `✅ *NOVA VENDA REALIZADA*\n\n` +
      `🧾 Pedido: ${saleNumber}\n` +
      `💰 Valor: R$ ${totalAmount.toFixed(2)}\n` +
      `📦 Itens: ${itemCount}\n` +
      `🕐 Horário: ${new Date().toLocaleString("pt-BR")}\n\n` +
      `Venda processada com sucesso! 🎉`

    // Enviar para n8n webhook
    const webhookUrl = process.env.N8N_SALE_WEBHOOK

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.N8N_WEBHOOK_TOKEN}`,
        },
        body: JSON.stringify({
          event: "sale_completed",
          saleId,
          saleNumber,
          totalAmount,
          itemCount,
          message,
          timestamp: new Date().toISOString(),
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Sale webhook error:", error)
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
  }
}
