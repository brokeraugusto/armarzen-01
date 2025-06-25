import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const formData = await request.formData()
    const file = formData.get("logo") as File

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Apenas imagens são permitidas" }, { status: 400 })
    }

    // Validar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Arquivo muito grande. Máximo 2MB" }, { status: 400 })
    }

    // Upload para Supabase Storage
    const fileName = `logo-${Date.now()}.${file.name.split(".").pop()}`
    const { data: uploadData, error: uploadError } = await supabase.storage.from("assets").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: "Erro ao fazer upload da imagem" }, { status: 500 })
    }

    // Obter URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from("assets").getPublicUrl(fileName)

    // Salvar URL nas configurações
    const { error: settingsError } = await supabase.from("settings").upsert(
      {
        key: "store_logo",
        value: publicUrl,
        description: "Logo da loja",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    )

    if (settingsError) {
      console.error("Settings error:", settingsError)
      return NextResponse.json({ error: "Erro ao salvar configuração" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      logoUrl: publicUrl,
    })
  } catch (error) {
    console.error("Logo upload error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = createServerClient()

  try {
    // Resetar para logo padrão
    const { error } = await supabase.from("settings").upsert(
      {
        key: "store_logo",
        value: "/images/armarzen-logo.png",
        description: "Logo da loja",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logo reset error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
