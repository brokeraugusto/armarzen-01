import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const { items, customerInfo, paymentData } = await request.json()

    // Validar dados de entrada
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Itens do carrinho são obrigatórios" }, { status: 400 })
    }

    // Calcular total
    const totalAmount = items.reduce((sum: number, item: any) => {
      const itemTotal = Number(item.product.price) * Number(item.quantity)
      return sum + itemTotal
    }, 0)

    if (totalAmount <= 0) {
      return NextResponse.json({ error: "Valor total inválido" }, { status: 400 })
    }

    // Gerar número da venda
    const timestamp = Date.now()
    const saleNumber = `PDV-${timestamp}`

    // Simular processamento do pagamento
    const paymentResult = await processPayment({
      amount: totalAmount,
      paymentMethod: paymentData?.method || "credit_card",
      customerInfo: customerInfo || {},
    })

    if (!paymentResult.success) {
      return NextResponse.json(
        {
          error: "Falha no pagamento",
          details: paymentResult.error,
        },
        { status: 400 },
      )
    }

    // Criar venda
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert([
        {
          sale_number: saleNumber,
          total_amount: totalAmount,
          payment_method: paymentData?.method || "credit_card",
          payment_status: "approved",
          mercadopago_payment_id: paymentResult.paymentId,
          customer_email: customerInfo?.email || null,
          customer_phone: customerInfo?.phone || null,
          completed_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (saleError) {
      console.error("Sale creation error:", saleError)
      return NextResponse.json({ error: "Erro ao criar venda: " + saleError.message }, { status: 400 })
    }

    // Criar itens da venda
    const saleItems = items.map((item: any) => ({
      sale_id: sale.id,
      product_id: item.product.id,
      quantity: Number(item.quantity),
      unit_price: Number(item.product.price),
      unit_cost: Number(item.product.cost_price || 0),
      total_price: Number(item.product.price) * Number(item.quantity),
      total_cost: Number(item.product.cost_price || 0) * Number(item.quantity),
    }))

    const { error: itemsError } = await supabase.from("sale_items").insert(saleItems)

    if (itemsError) {
      console.error("Sale items error:", itemsError)
      return NextResponse.json({ error: "Erro ao criar itens da venda: " + itemsError.message }, { status: 400 })
    }

    // Atualizar estoque
    for (const item of items) {
      try {
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("stock_quantity, min_stock_level, name")
          .eq("id", item.product.id)
          .single()

        if (productError) {
          console.error("Product fetch error:", productError)
          continue
        }

        const newStock = Math.max(0, product.stock_quantity - Number(item.quantity))

        const { error: updateError } = await supabase
          .from("products")
          .update({
            stock_quantity: newStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.product.id)

        if (updateError) {
          console.error("Stock update error:", updateError)
          continue
        }

        // Registrar movimentação de estoque
        await supabase.from("stock_movements").insert([
          {
            product_id: item.product.id,
            movement_type: "out",
            quantity: Number(item.quantity),
            reason: `Venda ${saleNumber}`,
            reference_id: sale.id,
          },
        ])

        // Verificar se precisa de alerta de estoque baixo
        if (newStock <= product.min_stock_level) {
          await triggerStockAlert(product, newStock).catch(console.error)
        }
      } catch (error) {
        console.error("Error processing item:", item.product.id, error)
      }
    }

    // Disparar webhook de venda concluída
    await triggerSaleWebhook(sale, saleItems).catch(console.error)

    return NextResponse.json({
      success: true,
      sale,
      saleNumber,
      paymentId: paymentResult.paymentId,
    })
  } catch (error) {
    console.error("Payment processing error:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

// Simulação do processamento de pagamento
async function processPayment(paymentData: any) {
  try {
    // Simular delay de processamento
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Validar dados básicos
    if (!paymentData.amount || paymentData.amount <= 0) {
      return {
        success: false,
        error: "Valor inválido",
      }
    }

    // Simular falha ocasional (2% de chance)
    if (Math.random() < 0.02) {
      return {
        success: false,
        error: "Cartão recusado pela operadora",
      }
    }

    return {
      success: true,
      paymentId: `MP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
  } catch (error) {
    return {
      success: false,
      error: "Erro no processamento do pagamento",
    }
  }
}

// Disparar alerta de estoque baixo
async function triggerStockAlert(product: any, currentStock: number) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/webhooks/stock-alert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        productName: product.name,
        currentStock,
        minStock: product.min_stock_level,
      }),
    })

    if (!response.ok) {
      console.error("Stock alert webhook failed:", response.status, response.statusText)
    }
  } catch (error) {
    console.error("Failed to trigger stock alert:", error)
  }
}

// Disparar webhook de venda
async function triggerSaleWebhook(sale: any, items: any[]) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/webhooks/sale-completed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        saleId: sale.id,
        saleNumber: sale.sale_number,
        totalAmount: sale.total_amount,
        itemCount: items.length,
      }),
    })

    if (!response.ok) {
      console.error("Sale webhook failed:", response.status, response.statusText)
    }
  } catch (error) {
    console.error("Failed to trigger sale webhook:", error)
  }
}
