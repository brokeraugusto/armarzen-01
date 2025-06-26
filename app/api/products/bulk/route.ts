import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { action, productIds, categoryId, priceAdjustment, stockAdjustment } = body

    if (!action || !productIds || !Array.isArray(productIds)) {
      return NextResponse.json({ error: "Ação e IDs dos produtos são obrigatórios" }, { status: 400 })
    }

    switch (action) {
      case "delete":
        // Soft delete multiple products
        const { error: deleteError } = await supabase
          .from("products")
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .in("id", productIds)

        if (deleteError) {
          return NextResponse.json({ error: deleteError.message }, { status: 400 })
        }

        return NextResponse.json({
          message: `${productIds.length} produto(s) desativado(s) com sucesso`,
        })

      case "activate":
        const { error: activateError } = await supabase
          .from("products")
          .update({
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .in("id", productIds)

        if (activateError) {
          return NextResponse.json({ error: activateError.message }, { status: 400 })
        }

        return NextResponse.json({
          message: `${productIds.length} produto(s) ativado(s) com sucesso`,
        })

      case "updateCategory":
        if (!categoryId) {
          return NextResponse.json({ error: "ID da categoria é obrigatório" }, { status: 400 })
        }

        const { error: categoryError } = await supabase
          .from("products")
          .update({
            category_id: categoryId,
            updated_at: new Date().toISOString(),
          })
          .in("id", productIds)

        if (categoryError) {
          return NextResponse.json({ error: categoryError.message }, { status: 400 })
        }

        return NextResponse.json({
          message: `Categoria atualizada para ${productIds.length} produto(s)`,
        })

      case "adjustPrice":
        if (!priceAdjustment || (!priceAdjustment.percentage && !priceAdjustment.fixed)) {
          return NextResponse.json({ error: "Ajuste de preço é obrigatório" }, { status: 400 })
        }

        // Get current products
        const { data: products, error: fetchError } = await supabase
          .from("products")
          .select("id, price")
          .in("id", productIds)

        if (fetchError) {
          return NextResponse.json({ error: fetchError.message }, { status: 400 })
        }

        // Update prices
        for (const product of products) {
          let newPrice = product.price

          if (priceAdjustment.percentage) {
            newPrice = product.price * (1 + priceAdjustment.percentage / 100)
          } else if (priceAdjustment.fixed) {
            newPrice = product.price + priceAdjustment.fixed
          }

          if (newPrice <= 0) {
            return NextResponse.json({ error: "Preço não pode ser zero ou negativo" }, { status: 400 })
          }

          await supabase
            .from("products")
            .update({
              price: newPrice,
              updated_at: new Date().toISOString(),
            })
            .eq("id", product.id)
        }

        return NextResponse.json({
          message: `Preços atualizados para ${productIds.length} produto(s)`,
        })

      case "adjustStock":
        if (!stockAdjustment || stockAdjustment.quantity === undefined) {
          return NextResponse.json({ error: "Ajuste de estoque é obrigatório" }, { status: 400 })
        }

        // Get current products
        const { data: stockProducts, error: stockFetchError } = await supabase
          .from("products")
          .select("id, stock_quantity, name")
          .in("id", productIds)

        if (stockFetchError) {
          return NextResponse.json({ error: stockFetchError.message }, { status: 400 })
        }

        // Update stock
        for (const product of stockProducts) {
          let newStock = product.stock_quantity

          if (stockAdjustment.type === "set") {
            newStock = stockAdjustment.quantity
          } else if (stockAdjustment.type === "add") {
            newStock = product.stock_quantity + stockAdjustment.quantity
          } else if (stockAdjustment.type === "subtract") {
            newStock = product.stock_quantity - stockAdjustment.quantity
          }

          if (newStock < 0) {
            return NextResponse.json(
              {
                error: `Estoque não pode ser negativo para o produto: ${product.name}`,
              },
              { status: 400 },
            )
          }

          await supabase
            .from("products")
            .update({
              stock_quantity: newStock,
              updated_at: new Date().toISOString(),
            })
            .eq("id", product.id)

          // Log stock movement
          const stockDifference = newStock - product.stock_quantity
          if (stockDifference !== 0) {
            await supabase.from("stock_movements").insert([
              {
                product_id: product.id,
                movement_type: stockDifference > 0 ? "in" : "out",
                quantity: Math.abs(stockDifference),
                reason: "Ajuste em massa",
                reference_id: product.id,
              },
            ])
          }
        }

        return NextResponse.json({
          message: `Estoque atualizado para ${productIds.length} produto(s)`,
        })

      default:
        return NextResponse.json({ error: "Ação não suportada" }, { status: 400 })
    }
  } catch (error) {
    console.error("Internal server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
