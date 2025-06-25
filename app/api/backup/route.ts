import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const { type = "full" } = await request.json()

    const backupData: any = {
      timestamp: new Date().toISOString(),
      type,
      version: "1.0",
    }

    if (type === "full" || type === "products") {
      const { data: products } = await supabase.from("products").select("*").eq("is_active", true)
      backupData.products = products
    }

    if (type === "full" || type === "categories") {
      const { data: categories } = await supabase.from("categories").select("*").eq("is_active", true)
      backupData.categories = categories
    }

    if (type === "full" || type === "sales") {
      const { data: sales } = await supabase
        .from("sales")
        .select(`
          *,
          sale_items(*)
        `)
        .order("created_at", { ascending: false })
        .limit(1000)
      backupData.sales = sales
    }

    if (type === "full" || type === "settings") {
      const { data: settings } = await supabase.from("settings").select("*")
      backupData.settings = settings
    }

    const filename = `armarzen_backup_${type}_${new Date().toISOString().split("T")[0]}.json`

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Backup error:", error)
    return NextResponse.json({ error: "Erro ao gerar backup" }, { status: 500 })
  }
}
