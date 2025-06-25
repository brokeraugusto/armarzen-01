import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const search = searchParams.get("search")
  const active = searchParams.get("active")

  try {
    let query = supabase
      .from("products")
      .select(`
        *,
        category:categories(*)
      `)
      .order("name")

    if (category) {
      query = query.eq("category_id", category)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,barcode.ilike.%${search}%`)
    }

    if (active !== null) {
      query = query.eq("is_active", active !== "false")
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
    const { name, description, price, cost_price, stock_quantity, min_stock_level, category_id, image_url, barcode } =
      body

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    if (!price || price < 0) {
      return NextResponse.json({ error: "Preço deve ser maior que zero" }, { status: 400 })
    }

    if (!cost_price || cost_price < 0) {
      return NextResponse.json({ error: "Preço de custo deve ser maior que zero" }, { status: 400 })
    }

    // Check if barcode already exists
    if (barcode) {
      const { data: existing } = await supabase.from("products").select("id").eq("barcode", barcode).single()

      if (existing) {
        return NextResponse.json({ error: "Código de barras já existe" }, { status: 400 })
      }
    }

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          name: name.trim(),
          description: description?.trim() || null,
          price: Number(price),
          cost_price: Number(cost_price),
          stock_quantity: Number(stock_quantity) || 0,
          min_stock_level: Number(min_stock_level) || 5,
          category_id: category_id || null,
          image_url: image_url || null,
          barcode: barcode || null,
        },
      ])
      .select(`
        *,
        category:categories(*)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
