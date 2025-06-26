import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const format = searchParams.get("format") || "json"
  const includeInactive = searchParams.get("includeInactive") === "true"

  try {
    let query = supabase
      .from("products")
      .select(`
        *,
        category:categories(name)
      `)
      .order("name")

    if (!includeInactive) {
      query = query.eq("is_active", true)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (format === "csv") {
      // Convert to CSV
      const headers = [
        "ID",
        "Nome",
        "Descrição",
        "Preço",
        "Preço de Custo",
        "Estoque",
        "Estoque Mínimo",
        "Categoria",
        "Código de Barras",
        "SKU",
        "Fornecedor",
        "URL da Imagem",
        "Notas",
        "Ativo",
        "Criado em",
        "Atualizado em",
      ]

      const csvRows = [
        headers.join(","),
        ...data.map((product) =>
          [
            product.id,
            `"${product.name.replace(/"/g, '""')}"`,
            `"${(product.description || "").replace(/"/g, '""')}"`,
            product.price,
            product.cost_price,
            product.stock_quantity,
            product.min_stock_level,
            `"${product.category?.name || ""}"`,
            `"${product.barcode || ""}"`,
            `"${product.sku || ""}"`,
            `"${product.supplier || ""}"`,
            `"${product.image_url || ""}"`,
            `"${(product.notes || "").replace(/"/g, '""')}"`,
            product.is_active ? "Sim" : "Não",
            product.created_at,
            product.updated_at,
          ].join(","),
        ),
      ]

      const csvContent = csvRows.join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="produtos_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    // Return JSON by default
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error exporting products:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
