import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)

  const format = searchParams.get("format") || "csv"
  const period = searchParams.get("period") || "month"
  const type = searchParams.get("type") || "sales"

  try {
    let data: any[] = []
    let filename = ""

    switch (type) {
      case "sales":
        const { data: salesData } = await supabase
          .from("sales")
          .select(`
            *,
            sale_items(
              *,
              product:products(name)
            )
          `)
          .order("created_at", { ascending: false })

        data = salesData || []
        filename = `vendas_${period}_${new Date().toISOString().split("T")[0]}`
        break

      case "products":
        const { data: productsData } = await supabase
          .from("products")
          .select(`
            *,
            category:categories(name)
          `)
          .eq("is_active", true)
          .order("name")

        data = productsData || []
        filename = `produtos_${new Date().toISOString().split("T")[0]}`
        break

      case "stock":
        const { data: stockData } = await supabase
          .from("products")
          .select(`
            name,
            stock_quantity,
            min_stock_level,
            price,
            cost_price,
            category:categories(name)
          `)
          .eq("is_active", true)
          .order("name")

        data = stockData || []
        filename = `estoque_${new Date().toISOString().split("T")[0]}`
        break
    }

    if (format === "csv") {
      const csv = convertToCSV(data, type)
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Erro ao exportar dados" }, { status: 500 })
  }
}

function convertToCSV(data: any[], type: string): string {
  if (data.length === 0) return ""

  let headers: string[] = []
  let rows: string[][] = []

  switch (type) {
    case "sales":
      headers = ["Número", "Data", "Total", "Método Pagamento", "Status", "Cliente Email", "Cliente Telefone"]
      rows = data.map((sale) => [
        sale.sale_number,
        new Date(sale.created_at).toLocaleString("pt-BR"),
        sale.total_amount.toFixed(2),
        sale.payment_method,
        sale.payment_status,
        sale.customer_email || "",
        sale.customer_phone || "",
      ])
      break

    case "products":
      headers = ["Nome", "Categoria", "Preço", "Custo", "Estoque", "Estoque Mínimo", "Código de Barras"]
      rows = data.map((product) => [
        product.name,
        product.category?.name || "",
        product.price.toFixed(2),
        product.cost_price.toFixed(2),
        product.stock_quantity.toString(),
        product.min_stock_level.toString(),
        product.barcode || "",
      ])
      break

    case "stock":
      headers = ["Produto", "Categoria", "Estoque Atual", "Estoque Mínimo", "Preço", "Custo", "Status"]
      rows = data.map((item) => [
        item.name,
        item.category?.name || "",
        item.stock_quantity.toString(),
        item.min_stock_level.toString(),
        item.price.toFixed(2),
        item.cost_price.toFixed(2),
        item.stock_quantity <= item.min_stock_level ? "Baixo" : "Normal",
      ])
      break
  }

  const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

  return csvContent
}
