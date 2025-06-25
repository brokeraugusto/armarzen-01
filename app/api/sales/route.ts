import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { generateSaleNumber } from "@/lib/utils"

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const limit = searchParams.get("limit")

  try {
    let query = supabase
      .from("sales")
      .select(`
        *,
        items:sale_items(
          *,
          product:products(*)
        )
      `)
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("payment_status", status)
    }

    if (limit) {
      query = query.limit(Number(limit))
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { items, payment_method, customer_email, customer_phone, notes } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Itens são obrigatórios" }, { status: 400 })
    }

    if (!payment_method) {
      return NextResponse.json({ error: "Método de pagamento é obrigatório" }, { status: 400 })
    }

    // Calculate totals
    const total_amount = items.reduce((sum: number, item: any) => sum + item.quantity * item.unit_price, 0)
    const sale_number = generateSaleNumber()

    // Create sale
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert([
        {
          sale_number,
          total_amount,
          payment_method,
          customer_email: customer_email || null,
          customer_phone: customer_phone || null,
          notes: notes || null,
          payment_status: payment_method === "cash" ? "approved" : "pending",
        },
      ])
      .select()
      .single()

    if (saleError) {
      return NextResponse.json({ error: saleError.message }, { status: 400 })
    }

    // Create sale items
    const saleItems = items.map((item: any) => ({
      sale_id: sale.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      unit_cost: item.unit_cost || 0,
      total_price: item.quantity * item.unit_price,
      total_cost: item.quantity * (item.unit_cost || 0),
    }))

    const { error: itemsError } = await supabase.from("sale_items").insert(saleItems)

    if (itemsError) {
      // Rollback sale if items creation fails
      await supabase.from("sales").delete().eq("id", sale.id)
      return NextResponse.json({ error: itemsError.message }, { status: 400 })
    }

    // Update completed_at if payment is approved
    if (sale.payment_status === "approved") {
      await supabase.from("sales").update({ completed_at: new Date().toISOString() }).eq("id", sale.id)
    }

    return NextResponse.json(sale)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
