import { type NextRequest, NextResponse } from "next/server"

// Endpoint de exemplo para testar webhooks de resumo diário
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    console.log("📊 Webhook de Resumo Diário recebido:", payload)

    // Simular processamento
    await new Promise((resolve) => setTimeout(resolve, 1200))

    return NextResponse.json({
      success: true,
      message: "Resumo diário processado com sucesso",
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
    endpoint: "daily-summary",
    description: "Endpoint de exemplo para testar webhooks de resumo diário",
    method: "POST",
    example_payload: {
      event: "daily_summary",
      test: true,
      timestamp: new Date().toISOString(),
      data: {
        summary: {
          date: new Date().toISOString().split("T")[0],
          total_sales: 2450.3,
          sales_count: 15,
          top_products: ["Produto A", "Produto B", "Produto C"],
        },
      },
    },
  })
}
