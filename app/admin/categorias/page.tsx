"use client"

import { useState, useEffect } from "react"
import { CardContent, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Search, Edit, Trash2, Loader2, Package, ArrowLeft, Palette, AlertTriangle } from "lucide-react"
import Link from "next/link"
import type { Category } from "@/lib/types"
import { CategoryForm } from "@/components/category-form"
import { supabase } from "@/lib/supabase"
import { GlassCard } from "@/components/ui/glass-card"
import { GlassButton } from "@/components/ui/glass-button"
import { GlassInput } from "@/components/ui/glass-input"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    const filtered = categories.filter(
      (category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    setFilteredCategories(filtered)
  }, [categories, searchTerm])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").eq("is_active", true).order("name")

      if (error) throw error

      setCategories(data || [])
    } catch (error) {
      setError("Erro ao carregar categorias")
      console.error("Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCategory = async (categoryData: Category) => {
    try {
      setSuccess(editingCategory ? "Categoria atualizada com sucesso!" : "Categoria criada com sucesso!")
      setError("")
      setShowForm(false)
      setEditingCategory(null)
      await fetchCategories()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      setError("Erro ao salvar categoria")
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setShowForm(true)
  }

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return

    try {
      const response = await fetch(`/api/categories/${deletingCategory.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error)
      }

      setSuccess("Categoria removida com sucesso!")
      setError("")
      setDeletingCategory(null)
      await fetchCategories()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000)
    } catch (error: any) {
      setError(error.message || "Erro ao remover categoria")
      setDeletingCategory(null)
    }
  }

  const handleBulkDelete = async () => {
    try {
      const categoryIds = Array.from(selectedCategories)

      // Check if any category has products
      const { data: productsCheck } = await supabase
        .from("products")
        .select("category_id")
        .in("category_id", categoryIds)
        .eq("is_active", true)
        .limit(1)

      if (productsCheck && productsCheck.length > 0) {
        setError("Não é possível excluir categorias que possuem produtos")
        setTimeout(() => setError(""), 3000)
        return
      }

      const { error } = await supabase.from("categories").update({ is_active: false }).in("id", categoryIds)

      if (error) throw error

      await fetchCategories()
      setSelectedCategories(new Set())
      setShowBulkDeleteDialog(false)
      setSuccess(`${categoryIds.length} categoria(s) removida(s) com sucesso!`)
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Error bulk deleting categories:", error)
      setError("Erro ao remover categorias")
      setTimeout(() => setError(""), 3000)
    }
  }

  const handleSelectCategory = (categoryId: string, checked: boolean) => {
    const newSelected = new Set(selectedCategories)
    if (checked) {
      newSelected.add(categoryId)
    } else {
      newSelected.delete(categoryId)
    }
    setSelectedCategories(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCategories(new Set(filteredCategories.map((c) => c.id)))
    } else {
      setSelectedCategories(new Set())
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingCategory(null)
  }

  const selectedCategoriesArray = Array.from(selectedCategories)
  const isAllSelected = filteredCategories.length > 0 && selectedCategoriesArray.length === filteredCategories.length
  const isIndeterminate =
    selectedCategoriesArray.length > 0 && selectedCategoriesArray.length < filteredCategories.length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-200">Carregando categorias...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <GlassButton variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </GlassButton>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Gerenciar Categorias</h1>
                <p className="text-slate-300">Organize seus produtos por categorias</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {selectedCategoriesArray.length > 0 && (
                <GlassButton variant="destructive" onClick={() => setShowBulkDeleteDialog(true)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir {selectedCategoriesArray.length} selecionada(s)
                </GlassButton>
              )}
              <GlassButton onClick={() => setShowForm(true)} variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Nova Categoria
              </GlassButton>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-500/10 backdrop-blur-sm border-red-500/20">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-500/10 backdrop-blur-sm border-green-500/20">
            <AlertDescription className="text-green-200">{success}</AlertDescription>
          </Alert>
        )}

        {/* Search and Stats */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <GlassInput
                placeholder="Buscar categorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {selectedCategoriesArray.length > 0 && (
              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {selectedCategoriesArray.length} selecionada(s)
              </Badge>
            )}
            <Badge variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <Package className="w-3 h-3 mr-1" />
              {categories.length} {categories.length === 1 ? "categoria" : "categorias"}
            </Badge>
          </div>
        </div>

        {/* Selection Controls */}
        {filteredCategories.length > 0 && (
          <GlassCard className="p-4 mb-6">
            <div className="flex items-center space-x-4">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate
                }}
              />
              <span className="text-slate-300">{isAllSelected ? "Desmarcar todas" : "Selecionar todas"}</span>
            </div>
          </GlassCard>
        )}

        {/* Categories Grid */}
        {filteredCategories.length === 0 ? (
          <GlassCard>
            <CardContent className="p-12 text-center">
              <Palette className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-200 mb-2">
                {searchTerm ? "Nenhuma categoria encontrada" : "Nenhuma categoria cadastrada"}
              </h3>
              <p className="text-slate-300 mb-4">
                {searchTerm
                  ? "Tente ajustar os termos de busca"
                  : "Comece criando sua primeira categoria para organizar os produtos"}
              </p>
              {!searchTerm && (
                <GlassButton onClick={() => setShowForm(true)} variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Categoria
                </GlassButton>
              )}
            </CardContent>
          </GlassCard>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories.map((category) => (
              <GlassCard key={category.id} className="hover:bg-white/15 transition-all duration-300 relative">
                <div className="absolute top-3 left-3 z-10">
                  <Checkbox
                    checked={selectedCategories.has(category.id)}
                    onCheckedChange={(checked) => handleSelectCategory(category.id, checked as boolean)}
                    className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                </div>
                <CardHeader className="pb-3 pt-12">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {category.icon && <span className="text-2xl">{category.icon}</span>}
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                    </div>
                    <div className="flex items-center space-x-1">
                      <GlassButton variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
                        <Edit className="w-3 h-3" />
                      </GlassButton>
                      <GlassButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingCategory(category)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </GlassButton>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <h3 className="font-semibold text-white mb-1">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-slate-300 line-clamp-2 mb-2">{category.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Criada em {new Date(category.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Category Form Dialog */}
      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Atualize as informações da categoria"
                : "Preencha os dados para criar uma nova categoria"}
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            category={editingCategory || undefined}
            onSave={handleSaveCategory}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Single Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent className="bg-slate-900/95 backdrop-blur-md border-slate-700/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-200">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Tem certeza que deseja remover a categoria "{deletingCategory?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800/50 text-slate-200 border-slate-600/50 hover:bg-slate-700/50">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-red-600 hover:bg-red-700">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent className="bg-slate-900/95 backdrop-blur-md border-slate-700/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-200">Confirmar Exclusão em Massa</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Tem certeza que deseja excluir {selectedCategoriesArray.length} categoria(s) selecionada(s)? Esta ação não
              pode ser desfeita e só será possível se as categorias não possuírem produtos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800/50 text-slate-200 border-slate-600/50 hover:bg-slate-700/50">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Excluir {selectedCategoriesArray.length} categoria(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
