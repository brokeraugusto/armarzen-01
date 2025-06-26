import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { products, options = {} } = body

    if (!products || !Array.isArray(products)) {
      return NextResponse.json({ error: "Lista de produtos é obrigatória" }, { status: 400 })
    }

    const results = {
      success: 0,
      errors: [] as string[],
      duplicates: [] as string[],
      warnings: [] as string[],
    }

    // Get existing categories for validation
    const { data: categories } = await supabase.from("categories").select("id, name").eq("is_active", true)

    const categoryMap = new Map(categories?.map((cat) => [cat.name.toLowerCase(), cat.id]) || [])

    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      const rowNumber = i + 1

      try {
        // Validate required fields
        if (!product.name?.trim()) {
          results.errors.push(`Linha ${rowNumber}: Nome é obrigatório`)
          continue
        }

        if (!product.price || product.price <= 0) {
          results.errors.push(`Linha ${rowNumber}: Preço deve ser maior que zero`)
          continue
        }

        if (product.cost_price === undefined || product.cost_price < 0) {
          results.errors.push(`Linha ${rowNumber}: Preço de custo deve ser maior ou igual a zero`)
          continue
        }

        if (product.price <= product.cost_price) {
          results.warnings.push(`Linha ${rowNumber}: Preço de venda menor ou igual ao custo`)
        }

        // Check for duplicates by barcode
        if (product.barcode?.trim()) {
          const { data: existing } = await supabase
            .from("products")
            .select("id, name")
            .eq("barcode", product.barcode.trim())
            .eq("is_active", true)
            .single()

          if (existing) {
            if (options.skipDuplicates) {
              results.duplicates.push(
                `Linha ${rowNumber}: Código de barras ${product.barcode} já existe (${existing.name}) - Ignorado`,
              )
              continue
            } else {
              results.duplicates.push(
                `Linha ${rowNumber}: Código de barras ${product.barcode} já existe (${existing.name})`,
              )
              continue
            }
          }
        }

        // Check for duplicates by SKU
        if (product.sku?.trim()) {
          const { data: existing } = await supabase
            .from("products")
            .select("id, name")
            .eq("sku", product.sku.trim())
            .eq("is_active", true)
            .single()

          if (existing) {
            if (options.skipDuplicates) {
              results.duplicates.push(`Linha ${rowNumber}: SKU ${product.sku} já existe (${existing.name}) - Ignorado`)
              continue
            } else {
              results.duplicates.push(`Linha ${rowNumber}: SKU ${product.sku} já existe (${existing.name})`)
              continue
            }
          }
        }

        // Resolve category
        let categoryId = null
        if (product.category_name?.trim()) {
          categoryId = categoryMap.get(product.category_name.toLowerCase())
          if (!categoryId) {
            results.warnings.push(`Linha ${rowNumber}: Categoria "${product.category_name}" não encontrada`)
          }
        }

        // Generate SKU if not provided
        let finalSku = product.sku?.trim()
        if (!finalSku) {
          const prefix = product.name.substring(0, 3).toUpperCase()
          const timestamp = Date.now().toString().slice(-6)
          finalSku = `${prefix}${timestamp}`
        }

        // Insert product
        const { error } = await supabase.from("products").insert([
          {
            name: product.name.trim(),
            description: product.description?.trim() || null,
            price: Number(product.price),
            cost_price: Number(product.cost_price),
            stock_quantity: Number(product.stock_quantity) || 0,
            min_stock_level: Number(product.min_stock_level) || 5,
            category_id: categoryId,
            image_url: product.image_url?.trim() || null,
            barcode: product.barcode?.trim() || null,
            sku: finalSku,
            supplier: product.supplier?.trim() || null,
            notes: product.notes?.trim() || null,
          },
        ])

        if (error) {
          results.errors.push(`Linha ${rowNumber}: ${error.message}`)
        } else {
          results.success++
        }
      } catch (error) {
        results.errors.push(`Linha ${rowNumber}: Erro interno`)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Internal server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
