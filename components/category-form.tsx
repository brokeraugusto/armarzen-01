"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Save, X, Palette } from "lucide-react"
import type { Category } from "@/lib/types"

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

const iconOptions = ["📱", "💻", "🎮", "📚", "👕", "🍔", "🏠", "🚗", "⚽", "🎵", "🎨", "🔧", "💊", "🌱", "🎁", "📦"]

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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center text-slate-700">
          <Palette className="w-5 h-5 mr-2 text-blue-600" />
          {category ? "Editar Categoria" : "Nova Categoria"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <Alert variant="destructive">
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nome da Categoria *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Ex: Eletrônicos, Roupas, Livros..."
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descrição opcional da categoria..."
              rows={3}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
            <p className="text-xs text-slate-500">{formData.description.length}/500 caracteres</p>
          </div>

          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="grid grid-cols-8 gap-2">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => handleInputChange("icon", icon)}
                  className={`p-2 text-xl border rounded-md hover:bg-blue-50 transition-colors ${
                    formData.icon === icon ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <Input
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
                  className={`p-3 rounded-md border-2 transition-all ${
                    formData.color === color.value ? "border-gray-400 scale-105" : "border-gray-200"
                  }`}
                  style={{ backgroundColor: color.value }}
                >
                  <span className="text-white text-xs font-medium">{color.name}</span>
                </button>
              ))}
            </div>
            <Input
              type="color"
              value={formData.color}
              onChange={(e) => handleInputChange("color", e.target.value)}
              className="w-full h-10 mt-2"
            />
          </div>

          <div className="flex items-center space-x-4 pt-4">
            <Button type="submit" disabled={saving || isLoading} className="bg-blue-600 hover:bg-blue-700">
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
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
