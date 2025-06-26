import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase.from("categories").select("*").order("name")

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
    const { name, description, icon, color } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    // Check if category name already exists
    const { data: existing } = await supabase.from("categories").select("id").eq("name", name.trim()).single()

    if (existing) {
      return NextResponse.json({ error: "Categoria com este nome já existe" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("categories")
      .insert([
        {
          name: name.trim(),
          description: description?.trim() || null,
          icon: icon || "📦",
          color: color || "#3B82F6",
        },
      ])
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
