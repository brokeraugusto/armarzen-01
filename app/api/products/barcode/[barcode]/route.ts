import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { barcode: string } }) {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(*)
      `)
      .eq("barcode", params.barcode)
      .eq("is_active", true)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching product by barcode:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
