import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)

  const category = searchParams.get("category")
  const search = searchParams.get("search")
  const active = searchParams.get("active")
  const lowStock = searchParams.get("lowStock")
  const page = Number.parseInt(searchParams.get("page") || "1")
  const limit = Number.parseInt(searchParams.get("limit") || "50")
  const sortBy = searchParams.get("sortBy") || "name"
  const sortOrder = searchParams.get("sortOrder") || "asc"

  try {
    let query = supabase.from("products").select(
      `
        *,
        category:categories(*)
      `,
      { count: "exact" },
    )

    // Apply filters
    if (category && category !== "all") {
      query = query.eq("category_id", category)
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,barcode.ilike.%${search}%,sku.ilike.%${search}%`,
      )
    }

    if (active !== null && active !== "all") {
      query = query.eq("is_active", active !== "false")
    }

    if (lowStock === "true") {
      query = query.filter("stock_quantity", "lte", "min_stock_level")
    }

    // Apply sorting
    const validSortFields = ["name", "price", "cost_price", "stock_quantity", "created_at", "updated_at"]
    const sortField = validSortFields.includes(sortBy) ? sortBy : "name"
    query = query.order(sortField, { ascending: sortOrder === "asc" })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching products:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Internal server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const {
      name,
      description,
      price,
      cost_price,
      stock_quantity,
      min_stock_level,
      category_id,
      image_url,
      barcode,
      sku,
      supplier,
      notes,
    } = body

    // Enhanced validation
    const errors: string[] = []

    if (!name?.trim()) {
      errors.push("Nome é obrigatório")
    }

    if (!price || price <= 0) {
      errors.push("Preço deve ser maior que zero")
    }

    if (cost_price === undefined || cost_price < 0) {
      errors.push("Preço de custo deve ser maior ou igual a zero")
    }

    if (price && cost_price && price <= cost_price) {
      errors.push("Preço de venda deve ser maior que o preço de custo")
    }

    if (stock_quantity < 0) {
      errors.push("Quantidade em estoque não pode ser negativa")
    }

    if (min_stock_level < 0) {
      errors.push("Estoque mínimo não pode ser negativo")
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(", ") }, { status: 400 })
    }

    // Check if barcode already exists
    if (barcode?.trim()) {
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("barcode", barcode.trim())
        .eq("is_active", true)
        .single()

      if (existing) {
        return NextResponse.json({ error: "Código de barras já existe" }, { status: 400 })
      }
    }

    // Check if SKU already exists
    if (sku?.trim()) {
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("sku", sku.trim())
        .eq("is_active", true)
        .single()

      if (existing) {
        return NextResponse.json({ error: "SKU já existe" }, { status: 400 })
      }
    }

    // Generate SKU if not provided
    let finalSku = sku?.trim()
    if (!finalSku) {
      const prefix = name.substring(0, 3).toUpperCase()
      const timestamp = Date.now().toString().slice(-6)
      finalSku = `${prefix}${timestamp}`
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
          image_url: image_url?.trim() || null,
          barcode: barcode?.trim() || null,
          sku: finalSku,
          supplier: supplier?.trim() || null,
          notes: notes?.trim() || null,
        },
      ])
      .select(`
        *,
        category:categories(*)
      `)
      .single()

    if (error) {
      console.error("Error creating product:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Log stock movement
    if (Number(stock_quantity) > 0) {
      await supabase.from("stock_movements").insert([
        {
          product_id: data.id,
          movement_type: "in",
          quantity: Number(stock_quantity),
          reason: "Produto criado",
          reference_id: data.id,
        },
      ])
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Internal server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
