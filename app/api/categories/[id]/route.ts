import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase.from("categories").select("*").eq("id", params.id).single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { name, description, icon, color, is_active } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    // Check if category name already exists (excluding current category)
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("name", name.trim())
      .neq("id", params.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: "Categoria com este nome já existe" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("categories")
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || "📦",
        color: color || "#3B82F6",
        is_active: is_active !== undefined ? is_active : true,
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    // Check if category has products
    const { data: products } = await supabase.from("products").select("id").eq("category_id", params.id).limit(1)

    if (products && products.length > 0) {
      return NextResponse.json({ error: "Não é possível excluir categoria que possui produtos" }, { status: 400 })
    }

    // Soft delete - mark as inactive
    const { data, error } = await supabase
      .from("categories")
      .update({ is_active: false })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
