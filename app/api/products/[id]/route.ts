import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(*),
        stock_movements(
          id,
          movement_type,
          quantity,
          reason,
          created_at,
          reference_id
        )
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
      is_active,
    } = body

    // Get current product data
    const { data: currentProduct, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("id", params.id)
      .single()

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
      }
      return NextResponse.json({ error: fetchError.message }, { status: 400 })
    }

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

    // Check if barcode already exists (excluding current product)
    if (barcode?.trim() && barcode !== currentProduct.barcode) {
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("barcode", barcode.trim())
        .eq("is_active", true)
        .neq("id", params.id)
        .single()

      if (existing) {
        return NextResponse.json({ error: "Código de barras já existe" }, { status: 400 })
      }
    }

    // Check if SKU already exists (excluding current product)
    if (sku?.trim() && sku !== currentProduct.sku) {
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("sku", sku.trim())
        .eq("is_active", true)
        .neq("id", params.id)
        .single()

      if (existing) {
        return NextResponse.json({ error: "SKU já existe" }, { status: 400 })
      }
    }

    const { data, error } = await supabase
      .from("products")
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        price: Number(price),
        cost_price: Number(cost_price),
        stock_quantity: Number(stock_quantity),
        min_stock_level: Number(min_stock_level) || 5,
        category_id: category_id || null,
        image_url: image_url?.trim() || null,
        barcode: barcode?.trim() || null,
        sku: sku?.trim() || currentProduct.sku,
        supplier: supplier?.trim() || null,
        notes: notes?.trim() || null,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select(`
        *,
        category:categories(*)
      `)
      .single()

    if (error) {
      console.error("Error updating product:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Log stock movement if quantity changed
    const stockDifference = Number(stock_quantity) - currentProduct.stock_quantity
    if (stockDifference !== 0) {
      await supabase.from("stock_movements").insert([
        {
          product_id: params.id,
          movement_type: stockDifference > 0 ? "in" : "out",
          quantity: Math.abs(stockDifference),
          reason: "Ajuste manual",
          reference_id: params.id,
        },
      ])
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Internal server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    // Check if product exists
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("id, name")
      .eq("id", params.id)
      .single()

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
      }
      return NextResponse.json({ error: fetchError.message }, { status: 400 })
    }

    // Check if product is used in any sales
    const { data: salesWithProduct } = await supabase
      .from("sale_items")
      .select("id")
      .eq("product_id", params.id)
      .limit(1)

    if (salesWithProduct && salesWithProduct.length > 0) {
      // Soft delete - just mark as inactive
      const { error } = await supabase
        .from("products")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({
        message: "Produto desativado com sucesso (produto possui histórico de vendas)",
        type: "soft_delete",
      })
    } else {
      // Hard delete - completely remove from database
      const { error } = await supabase.from("products").delete().eq("id", params.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({
        message: "Produto excluído permanentemente",
        type: "hard_delete",
      })
    }
  } catch (error) {
    console.error("Internal server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
