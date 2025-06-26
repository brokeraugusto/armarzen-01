import { type NextRequest, NextResponse } from "next/server"

// Endpoint de exemplo para testar webhooks de alerta de estoque
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    console.log("📦 Webhook de Alerta de Estoque recebido:", payload)

    // Simular processamento
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      message: "Alerta de estoque processado com sucesso",
      received_at: new Date().toISOString(),
      event_type: payload.event,
      test_mode: payload.test || false,
    })
  } catch (error) {
    console.error("Erro no webhook de exemplo:", error)
    return NextResponse.json({ success: false, error: "Erro ao processar webhook" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "stock-alert",
    description: "Endpoint de exemplo para testar webhooks de alerta de estoque",
    method: "POST",
    example_payload: {
      event: "stock_alert",
      test: true,
      timestamp: new Date().toISOString(),
      data: {
        product: {
          id: "123",
          name: "Produto Exemplo",
          current_stock: 5,
          min_stock: 10,
        },
      },
    },
  })
}
