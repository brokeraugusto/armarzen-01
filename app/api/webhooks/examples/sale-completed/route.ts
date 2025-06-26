import { type NextRequest, NextResponse } from "next/server"

// Endpoint de exemplo para testar webhooks de venda concluída
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    console.log("💰 Webhook de Venda Concluída recebido:", payload)

    // Simular processamento
    await new Promise((resolve) => setTimeout(resolve, 800))

    return NextResponse.json({
      success: true,
      message: "Venda processada com sucesso",
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
    endpoint: "sale-completed",
    description: "Endpoint de exemplo para testar webhooks de venda concluída",
    method: "POST",
    example_payload: {
      event: "sale",
      test: true,
      timestamp: new Date().toISOString(),
      data: {
        sale: {
          id: "456",
          total: 150.75,
          items_count: 3,
          payment_method: "credit_card",
        },
      },
    },
  })
}
