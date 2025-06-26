"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { GlassButton } from "@/components/ui/glass-button"
import { GlassInput } from "@/components/ui/glass-input"
import { Label } from "@/components/ui/label"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Save, X, Palette } from "lucide-react"
import type { Category } from "@/lib/types"
import { GlassCard } from "@/components/ui/glass-card"

interface CategoryFormProps {
  category?: Category
  onSave: (category: Category) => void
  onCancel: () => void
  isLoading?: boolean
}

const colorOptions = [
  { name: "Azul", value: "#3B82F6" },
  { name: "Verde", value: "#10B981" },
  { name: "Roxo", value: "#8B5CF6" },
  { name: "Rosa", value: "#EC4899" },
  { name: "Amarelo", value: "#F59E0B" },
  { name: "Vermelho", value: "#EF4444" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Teal", value: "#14B8A6" },
]

const iconOptions = [
  // Eletrônicos e Tecnologia
  "📱",
  "💻",
  "🖥️",
  "⌚",
  "📷",
  "🎧",
  "🔌",
  "💡",
  "🔋",
  "📺",

  // Entretenimento e Mídia
  "🎮",
  "🎵",
  "🎬",
  "📚",
  "🎨",
  "🎯",
  "🎲",
  "🎪",
  "🎭",
  "🎤",

  // Roupas e Acessórios
  "👕",
  "👔",
  "👗",
  "👠",
  "👟",
  "🧢",
  "👜",
  "💍",
  "⌚",
  "🕶️",

  // Casa e Decoração
  "🏠",
  "🛋️",
  "🛏️",
  "🪑",
  "🚿",
  "🧴",
  "🕯️",
  "🖼️",
  "🪴",
  "🧹",

  // Alimentação e Bebidas
  "🍔",
  "🍕",
  "🍰",
  "☕",
  "🍷",
  "🥤",
  "🍎",
  "🥖",
  "🧀",
  "🍫",

  // Esportes e Fitness
  "⚽",
  "🏀",
  "🎾",
  "🏈",
  "🏐",
  "🏓",
  "🏸",
  "🥊",
  "🏋️",
  "🚴",

  // Saúde e Beleza
  "💊",
  "🩺",
  "💄",
  "🧴",
  "🧼",
  "🪥",
  "💅",
  "🧴",
  "🧽",
  "🪒",

  // Automóveis e Transporte
  "🚗",
  "🏍️",
  "🚲",
  "🛴",
  "⛽",
  "🔧",
  "🛞",
  "🚙",
  "🚕",
  "🚌",

  // Jardinagem e Plantas
  "🌱",
  "🌸",
  "🌺",
  "🌻",
  "🌿",
  "🪴",
  "🌳",
  "🌲",
  "🍃",
  "🌾",

  // Presentes e Festas
  "🎁",
  "🎈",
  "🎂",
  "🎉",
  "🎊",
  "🎀",
  "💝",
  "🛍️",
  "🎄",
  "🎃",

  // Escritório e Papelaria
  "📦",
  "📝",
  "✏️",
  "📊",
  "📋",
  "📌",
  "📎",
  "🗂️",
  "📁",
  "🖊️",

  // Ferramentas e Construção
  "🔧",
  "🔨",
  "⚒️",
  "🪚",
  "🔩",
  "⚙️",
  "🪛",
  "📏",
  "🔒",
  "🗝️",

  // Animais e Pets
  "🐶",
  "🐱",
  "🐹",
  "🐰",
  "🐦",
  "🐠",
  "🦎",
  "🐢",
  "🦔",
  "🐾",

  // Viagem e Turismo
  "✈️",
  "🧳",
  "🗺️",
  "📍",
  "🏖️",
  "⛰️",
  "🏕️",
  "🎒",
  "📸",
  "🧭",
]

export function CategoryForm({ category, onSave, onCancel, isLoading }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    color: "#3B82F6",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
        icon: category.icon || "",
        color: category.color || "#3B82F6",
      })
    }
  }, [category])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Nome da categoria é obrigatório"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Nome deve ter pelo menos 2 caracteres"
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Descrição deve ter no máximo 500 caracteres"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setSaving(true)
    try {
      const url = category ? `/api/categories/${category.id}` : "/api/categories"
      const method = category ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        setErrors({ submit: result.error || "Erro ao salvar categoria" })
        return
      }

      onSave(result)
    } catch (error) {
      setErrors({ submit: "Erro de conexão. Tente novamente." })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <GlassCard className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <Palette className="w-5 h-5 mr-2 text-blue-600" />
          {category ? "Editar Categoria" : "Nova Categoria"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <Alert variant="destructive" className="bg-red-500/10 backdrop-blur-sm border-red-500/20">
              <AlertDescription className="text-red-200">{errors.submit}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nome da Categoria *</Label>
            <GlassInput
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Ex: Eletrônicos, Roupas, Livros..."
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-sm text-red-400">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descrição opcional da categoria..."
              rows={3}
              className={`bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-slate-400 ${errors.description ? "border-red-500" : ""}`}
            />
            {errors.description && <p className="text-sm text-red-400">{errors.description}</p>}
            <p className="text-xs text-slate-300">{formData.description.length}/500 caracteres</p>
          </div>

          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="grid grid-cols-8 gap-2">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => handleInputChange("icon", icon)}
                  className={`p-2 text-xl border rounded-md hover:bg-white/20 transition-colors backdrop-blur-sm ${
                    formData.icon === icon ? "border-blue-400 bg-white/20" : "border-white/20 bg-white/5"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <GlassInput
              value={formData.icon}
              onChange={(e) => handleInputChange("icon", e.target.value)}
              placeholder="Ou digite um emoji personalizado"
              className="mt-2"
            />
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="grid grid-cols-4 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleInputChange("color", color.value)}
                  className={`p-3 rounded-md border-2 transition-all backdrop-blur-sm ${
                    formData.color === color.value ? "border-white/60 scale-105" : "border-white/20"
                  }`}
                  style={{ backgroundColor: color.value }}
                >
                  <span className="text-white text-xs font-medium">{color.name}</span>
                </button>
              ))}
            </div>
            <GlassInput
              type="color"
              value={formData.color}
              onChange={(e) => handleInputChange("color", e.target.value)}
              className="w-full h-10 mt-2"
            />
          </div>

          <div className="flex items-center space-x-4 pt-4">
            <GlassButton type="submit" disabled={saving || isLoading} variant="primary">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {category ? "Atualizar" : "Criar"} Categoria
                </>
              )}
            </GlassButton>
            <GlassButton type="button" variant="outline" onClick={onCancel} disabled={saving}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </GlassButton>
          </div>
        </form>
      </CardContent>
    </GlassCard>
  )
}
