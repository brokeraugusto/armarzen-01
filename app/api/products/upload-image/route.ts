import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const productId = formData.get("productId") as string

    if (!file) {
      return NextResponse.json({ error: "Arquivo é obrigatório" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Tipo de arquivo não suportado. Use JPEG, PNG ou WebP",
        },
        { status: 400 },
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: "Arquivo muito grande. Tamanho máximo: 5MB",
        },
        { status: 400 },
      )
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop()
    const fileName = `product_${productId || Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from("product-images").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Error uploading file:", error)
      return NextResponse.json({ error: "Erro ao fazer upload da imagem" }, { status: 400 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(fileName)

    // Update product if productId is provided
    if (productId) {
      const { error: updateError } = await supabase
        .from("products")
        .update({
          image_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId)

      if (updateError) {
        console.error("Error updating product:", updateError)
        // Don't fail the upload, just log the error
      }
    }

    return NextResponse.json({
      url: publicUrl,
      fileName: data.path,
      message: "Imagem enviada com sucesso",
    })
  } catch (error) {
    console.error("Internal server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
