"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Product, Category } from "@/lib/types"
import { GlassButton } from "@/components/ui/glass-button"
import { GlassCard } from "@/components/ui/glass-card"
import { GlassInput } from "@/components/ui/glass-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Plus,
  Edit,
  Trash2,
  Package,
  ArrowLeft,
  Loader2,
  Search,
  Download,
  Upload,
  Eye,
  RefreshCw,
  ScanLine,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface ProductsResponse {
  data: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function ProdutosAdmin() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [activeFilter, setActiveFilter] = useState("all")
  const [lowStockFilter, setLowStockFilter] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [showBulkActionDialog, setShowBulkActionDialog] = useState(false)
  const [bulkAction, setBulkAction] = useState("")
  const [bulkCategoryId, setBulkCategoryId] = useState("")
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    cost_price: 0,
    stock_quantity: 0,
    min_stock_level: 5,
    category_id: "",
    barcode: "",
    sku: "",
    image_url: "",
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      // Build query parameters
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      })

      if (searchTerm) params.append("search", searchTerm)
      if (categoryFilter !== "all") params.append("category", categoryFilter)
      if (activeFilter !== "all") params.append("active", activeFilter)
      if (lowStockFilter) params.append("lowStock", "true")

      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch(`/api/products?${params.toString()}`),
        supabase.from("categories").select("*").eq("is_active", true).order("name"),
      ])

      if (productsResponse.ok) {
        const productsData: ProductsResponse = await productsResponse.json()
        setProducts(productsData.data)
        setPagination(productsData.pagination)
      }

      if (categoriesResponse.data) {
        setCategories(categoriesResponse.data)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, searchTerm, categoryFilter, activeFilter, lowStockFilter, sortBy, sortOrder])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products"
      const method = editingProduct ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error)
      }

      setSuccess(editingProduct ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!")
      await fetchData()
      resetForm()
      setShowForm(false)
      setTimeout(() => setSuccess(""), 3000)
    } catch (error: any) {
      console.error("Error saving product:", error)
      setError(error.message || "Erro ao salvar produto")
      setTimeout(() => setError(""), 3000)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price,
      cost_price: product.cost_price,
      stock_quantity: product.stock_quantity,
      min_stock_level: product.min_stock_level,
      category_id: product.category_id || "",
      barcode: product.barcode || "",
      sku: product.sku || "",
      image_url: product.image_url || "",
    })
    setShowForm(true)
  }

  const handleView = async (product: Product) => {
    try {
      const response = await fetch(`/api/products/${product.id}`)
      if (response.ok) {
        const detailedProduct = await response.json()
        setViewingProduct(detailedProduct)
        setShowViewDialog(true)
      }
    } catch (error) {
      console.error("Error fetching product details:", error)
    }
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`Tem certeza que deseja excluir "${product.name}"?`)) return

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error)
      }

      await fetchData()
      setSuccess(result.message)
      setTimeout(() => setSuccess(""), 3000)
    } catch (error: any) {
      console.error("Error deleting product:", error)
      setError(error.message || "Erro ao excluir produto")
      setTimeout(() => setError(""), 3000)
    }
  }

  const handleBulkAction = async () => {
    try {
      const productIds = Array.from(selectedProducts)
      const payload: any = { action: bulkAction, productIds }

      if (bulkAction === "updateCategory") {
        payload.categoryId = bulkCategoryId
      }

      const response = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error)
      }

      await fetchData()
      setSelectedProducts(new Set())
      setShowBulkActionDialog(false)
      setBulkAction("")
      setBulkCategoryId("")
      setSuccess(result.message)
      setTimeout(() => setSuccess(""), 3000)
    } catch (error: any) {
      console.error("Error performing bulk action:", error)
      setError(error.message || "Erro ao executar ação em massa")
      setTimeout(() => setError(""), 3000)
    }
  }

  const handleSelectProduct = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts)
    if (checked) {
      newSelected.add(productId)
    } else {
      newSelected.delete(productId)
    }
    setSelectedProducts(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(products.map((p) => p.id)))
    } else {
      setSelectedProducts(new Set())
    }
  }

  const handleExport = async (format: "json" | "csv" = "csv") => {
    try {
      const response = await fetch(`/api/products/export?format=${format}`)

      if (format === "csv") {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `produtos_${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `produtos_${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }

      setSuccess("Exportação realizada com sucesso!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Error exporting products:", error)
      setError("Erro ao exportar produtos")
      setTimeout(() => setError(""), 3000)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      cost_price: 0,
      stock_quantity: 0,
      min_stock_level: 5,
      category_id: "",
      barcode: "",
      sku: "",
      image_url: "",
    })
    setEditingProduct(null)
  }

  const calculateProfitMargin = (price: number, cost: number) => {
    if (cost === 0) return 0
    return ((price - cost) / price) * 100
  }

  const selectedProductsArray = Array.from(selectedProducts)
  const isAllSelected = products.length > 0 && selectedProductsArray.length === products.length
  const isIndeterminate = selectedProductsArray.length > 0 && selectedProductsArray.length < products.length

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-300">Carregando produtos...</p>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-700/30">
        <GlassCard variant="elevated" className="rounded-none border-x-0 border-t-0">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/admin">
                  <GlassButton variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </GlassButton>
                </Link>
                <div className="flex items-center space-x-2">
                  <Package className="w-6 h-6 text-blue-400" />
                  <h1 className="text-2xl font-bold text-slate-200">Gestão de Produtos</h1>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <GlassButton variant="outline" onClick={() => handleExport("csv")}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </GlassButton>

                <GlassButton variant="outline" onClick={() => setShowImportDialog(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </GlassButton>

                {selectedProductsArray.length > 0 && (
                  <GlassButton variant="outline" onClick={() => setShowBulkActionDialog(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Ações ({selectedProductsArray.length})
                  </GlassButton>
                )}

                <Dialog open={showForm} onOpenChange={setShowForm}>
                  <DialogTrigger asChild>
                    <GlassButton onClick={() => resetForm()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Produto
                    </GlassButton>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-md border-slate-700/50">
                    <DialogHeader>
                      <DialogTitle className="text-slate-200">
                        {editingProduct ? "Editar Produto" : "Novo Produto"}
                      </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name" className="text-slate-300">
                            Nome do Produto *
                          </Label>
                          <GlassInput
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="category" className="text-slate-300">
                            Categoria
                          </Label>
                          <Select
                            value={formData.category_id}
                            onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                          >
                            <SelectTrigger className="bg-slate-800/30 backdrop-blur-md border-slate-600/40 text-slate-100">
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900/95 backdrop-blur-md border-slate-700/50">
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id} className="text-slate-200">
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description" className="text-slate-300">
                          Descrição
                        </Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="bg-slate-800/30 backdrop-blur-md border-slate-600/40 text-slate-100 placeholder:text-slate-400"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="price" className="text-slate-300">
                            Preço de Venda (R$) *
                          </Label>
                          <GlassInput
                            id="price"
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) =>
                              setFormData({ ...formData, price: Number.parseFloat(e.target.value) || 0 })
                            }
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="cost_price" className="text-slate-300">
                            Preço de Custo (R$) *
                          </Label>
                          <GlassInput
                            id="cost_price"
                            type="number"
                            step="0.01"
                            value={formData.cost_price}
                            onChange={(e) =>
                              setFormData({ ...formData, cost_price: Number.parseFloat(e.target.value) || 0 })
                            }
                            required
                          />
                        </div>

                        <div>
                          <Label className="text-slate-300">Margem de Lucro</Label>
                          <div className="flex items-center h-9 px-3 bg-slate-800/20 backdrop-blur-md rounded-lg border border-slate-600/40">
                            <span
                              className={`font-medium ${
                                calculateProfitMargin(formData.price, formData.cost_price) > 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {calculateProfitMargin(formData.price, formData.cost_price).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="stock_quantity" className="text-slate-300">
                            Quantidade em Estoque *
                          </Label>
                          <GlassInput
                            id="stock_quantity"
                            type="number"
                            value={formData.stock_quantity}
                            onChange={(e) =>
                              setFormData({ ...formData, stock_quantity: Number.parseInt(e.target.value) || 0 })
                            }
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="min_stock_level" className="text-slate-300">
                            Estoque Mínimo *
                          </Label>
                          <GlassInput
                            id="min_stock_level"
                            type="number"
                            value={formData.min_stock_level}
                            onChange={(e) =>
                              setFormData({ ...formData, min_stock_level: Number.parseInt(e.target.value) || 0 })
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="barcode" className="text-slate-300">
                            Código de Barras
                          </Label>
                          <GlassInput
                            id="barcode"
                            value={formData.barcode}
                            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="sku" className="text-slate-300">
                            SKU
                          </Label>
                          <GlassInput
                            id="sku"
                            value={formData.sku}
                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="image_url" className="text-slate-300">
                            URL da Imagem
                          </Label>
                          <GlassInput
                            id="image_url"
                            type="url"
                            value={formData.image_url}
                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <GlassButton type="button" variant="outline" onClick={() => setShowForm(false)}>
                          Cancelar
                        </GlassButton>
                        <GlassButton type="submit">{editingProduct ? "Atualizar" : "Criar"} Produto</GlassButton>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </GlassCard>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/30 backdrop-blur-md">
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-500/10 border-green-500/30 backdrop-blur-md">
            <AlertDescription className="text-green-400">{success}</AlertDescription>
          </Alert>
        )}

        {/* Filtros Avançados */}
        <GlassCard className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-slate-300 mb-2 block">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <GlassInput
                  placeholder="Nome, descrição, código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300 mb-2 block">Categoria</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-slate-800/30 backdrop-blur-md border-slate-600/40 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/95 backdrop-blur-md border-slate-700/50">
                  <SelectItem value="all" className="text-slate-200">
                    Todas
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id} className="text-slate-200">
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300 mb-2 block">Status</Label>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="bg-slate-800/30 backdrop-blur-md border-slate-600/40 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/95 backdrop-blur-md border-slate-700/50">
                  <SelectItem value="all" className="text-slate-200">
                    Todos
                  </SelectItem>
                  <SelectItem value="true" className="text-slate-200">
                    Ativos
                  </SelectItem>
                  <SelectItem value="false" className="text-slate-200">
                    Inativos
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lowStock"
                  checked={lowStockFilter}
                  onCheckedChange={setLowStockFilter}
                  className="border-slate-600 data-[state=checked]:bg-blue-600"
                />
                <Label htmlFor="lowStock" className="text-slate-300">
                  Estoque baixo
                </Label>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700/30">
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <span>Total: {pagination.total} produtos</span>
              {selectedProductsArray.length > 0 && (
                <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {selectedProductsArray.length} selecionado(s)
                </Badge>
              )}
            </div>

            <GlassButton variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </GlassButton>
          </div>
        </GlassCard>

        {/* Tabela de Produtos */}
        <GlassCard>
          <div className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700/50">
                    <TableHead className="text-slate-300 w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        ref={(el) => {
                          if (el) el.indeterminate = isIndeterminate
                        }}
                      />
                    </TableHead>
                    <TableHead className="text-slate-300">Imagem</TableHead>
                    <TableHead
                      className="text-slate-300 cursor-pointer"
                      onClick={() => {
                        setSortBy("name")
                        setSortOrder(sortBy === "name" && sortOrder === "asc" ? "desc" : "asc")
                      }}
                    >
                      Nome {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="text-slate-300">Categoria</TableHead>
                    <TableHead
                      className="text-slate-300 cursor-pointer"
                      onClick={() => {
                        setSortBy("price")
                        setSortOrder(sortBy === "price" && sortOrder === "asc" ? "desc" : "asc")
                      }}
                    >
                      Preço {sortBy === "price" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="text-slate-300">Custo</TableHead>
                    <TableHead className="text-slate-300">Margem</TableHead>
                    <TableHead
                      className="text-slate-300 cursor-pointer"
                      onClick={() => {
                        setSortBy("stock_quantity")
                        setSortOrder(sortBy === "stock_quantity" && sortOrder === "asc" ? "desc" : "asc")
                      }}
                    >
                      Estoque {sortBy === "stock_quantity" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} className="border-slate-700/30 hover:bg-slate-800/20">
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                          className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="w-12 h-12 relative bg-slate-800/30 rounded-lg overflow-hidden">
                          <Image
                            src={product.image_url || `/placeholder.svg?height=48&width=48`}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-200">{product.name}</p>
                          <div className="flex gap-2 text-xs text-slate-400 mt-1">
                            {product.barcode && (
                              <span className="flex items-center gap-1">
                                <ScanLine className="w-3 h-3" />
                                {product.barcode}
                              </span>
                            )}
                            {product.sku && <span>SKU: {product.sku}</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">{product.category?.name || "Sem categoria"}</TableCell>
                      <TableCell className="font-medium text-green-400">R$ {product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-slate-300">R$ {product.cost_price.toFixed(2)}</TableCell>
                      <TableCell>
                        <span
                          className={`font-medium ${
                            calculateProfitMargin(product.price, product.cost_price) > 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {calculateProfitMargin(product.price, product.cost_price).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-300">{product.stock_quantity}</span>
                          {product.stock_quantity <= product.min_stock_level && (
                            <Badge variant="destructive" className="text-xs">
                              Baixo
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={product.is_active ? "default" : "secondary"}
                          className={product.is_active ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
                        >
                          {product.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <GlassButton size="sm" variant="outline" onClick={() => handleView(product)}>
                            <Eye className="w-4 h-4" />
                          </GlassButton>
                          <GlassButton size="sm" variant="outline" onClick={() => handleEdit(product)}>
                            <Edit className="w-4 h-4" />
                          </GlassButton>
                          <GlassButton size="sm" variant="destructive" onClick={() => handleDelete(product)}>
                            <Trash2 className="w-4 h-4" />
                          </GlassButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {products.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto text-slate-500 mb-4" />
                  <p className="text-slate-400 text-lg mb-2">
                    {searchTerm || categoryFilter !== "all" || activeFilter !== "all" || lowStockFilter
                      ? "Nenhum produto encontrado com os filtros aplicados"
                      : "Nenhum produto cadastrado"}
                  </p>
                  <p className="text-slate-500 text-sm">
                    {searchTerm || categoryFilter !== "all" || activeFilter !== "all" || lowStockFilter
                      ? "Tente ajustar os filtros ou limpar a busca"
                      : "Comece criando seu primeiro produto"}
                  </p>
                </div>
              )}
            </div>

            {/* Paginação */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-700/30">
                <div className="text-sm text-slate-400">
                  Página {pagination.page} de {pagination.totalPages} ({pagination.total} produtos)
                </div>
                <div className="flex space-x-2">
                  <GlassButton
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Anterior
                  </GlassButton>
                  <GlassButton
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Próxima
                  </GlassButton>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Product View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl bg-slate-900/95 backdrop-blur-md border-slate-700/50">
          <DialogHeader>
            <DialogTitle className="text-slate-200">Detalhes do Produto</DialogTitle>
          </DialogHeader>

          {viewingProduct && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="w-full h-48 relative bg-slate-800/30 rounded-lg overflow-hidden mb-4">
                    <Image
                      src={viewingProduct.image_url || `/placeholder.svg?height=192&width=192`}
                      alt={viewingProduct.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-slate-400 text-sm">Nome</Label>
                      <p className="text-slate-200 font-medium">{viewingProduct.name}</p>
                    </div>

                    {viewingProduct.description && (
                      <div>
                        <Label className="text-slate-400 text-sm">Descrição</Label>
                        <p className="text-slate-300">{viewingProduct.description}</p>
                      </div>
                    )}

                    <div>
                      <Label className="text-slate-400 text-sm">Categoria</Label>
                      <p className="text-slate-300">{viewingProduct.category?.name || "Sem categoria"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-400 text-sm">Preço de Venda</Label>
                      <p className="text-green-400 font-bold text-lg">R$ {viewingProduct.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm">Preço de Custo</Label>
                      <p className="text-slate-300 font-medium">R$ {viewingProduct.cost_price.toFixed(2)}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-400 text-sm">Margem de Lucro</Label>
                    <p
                      className={`font-bold text-lg ${
                        calculateProfitMargin(viewingProduct.price, viewingProduct.cost_price) > 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {calculateProfitMargin(viewingProduct.price, viewingProduct.cost_price).toFixed(1)}%
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-400 text-sm">Estoque Atual</Label>
                      <p className="text-slate-200 font-medium">{viewingProduct.stock_quantity}</p>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm">Estoque Mínimo</Label>
                      <p className="text-slate-300">{viewingProduct.min_stock_level}</p>
                    </div>
                  </div>

                  {viewingProduct.barcode && (
                    <div>
                      <Label className="text-slate-400 text-sm">Código de Barras</Label>
                      <p className="text-slate-300 font-mono">{viewingProduct.barcode}</p>
                    </div>
                  )}

                  {viewingProduct.sku && (
                    <div>
                      <Label className="text-slate-400 text-sm">SKU</Label>
                      <p className="text-slate-300 font-mono">{viewingProduct.sku}</p>
                    </div>
                  )}

                  <div>
                    <Label className="text-slate-400 text-sm">Status</Label>
                    <Badge
                      variant={viewingProduct.is_active ? "default" : "secondary"}
                      className={viewingProduct.is_active ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
                    >
                      {viewingProduct.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <p>Criado em: {new Date(viewingProduct.created_at).toLocaleString("pt-BR")}</p>
                    <p>Atualizado em: {new Date(viewingProduct.updated_at).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
              </div>

              {viewingProduct.stock_movements && viewingProduct.stock_movements.length > 0 && (
                <div>
                  <Label className="text-slate-400 text-sm mb-3 block">Histórico de Movimentações</Label>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {viewingProduct.stock_movements.slice(0, 5).map((movement: any) => (
                      <div
                        key={movement.id}
                        className="flex justify-between items-center text-sm bg-slate-800/20 p-2 rounded"
                      >
                        <span className="text-slate-300">
                          {movement.movement_type === "in" ? "Entrada" : "Saída"}: {movement.quantity}
                        </span>
                        <span className="text-slate-400">{movement.reason}</span>
                        <span className="text-slate-500 text-xs">
                          {new Date(movement.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Dialog */}
      <Dialog open={showBulkActionDialog} onOpenChange={setShowBulkActionDialog}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-md border-slate-700/50">
          <DialogHeader>
            <DialogTitle className="text-slate-200">Ações em Massa</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 mb-2 block">Selecione uma ação</Label>
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="bg-slate-800/30 backdrop-blur-md border-slate-600/40 text-slate-100">
                  <SelectValue placeholder="Escolha uma ação" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/95 backdrop-blur-md border-slate-700/50">
                  <SelectItem value="delete" className="text-slate-200">
                    Desativar produtos
                  </SelectItem>
                  <SelectItem value="activate" className="text-slate-200">
                    Ativar produtos
                  </SelectItem>
                  <SelectItem value="updateCategory" className="text-slate-200">
                    Alterar categoria
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bulkAction === "updateCategory" && (
              <div>
                <Label className="text-slate-300 mb-2 block">Nova categoria</Label>
                <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                  <SelectTrigger className="bg-slate-800/30 backdrop-blur-md border-slate-600/40 text-slate-100">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900/95 backdrop-blur-md border-slate-700/50">
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="text-slate-200">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <GlassButton variant="outline" onClick={() => setShowBulkActionDialog(false)}>
                Cancelar
              </GlassButton>
              <GlassButton
                onClick={handleBulkAction}
                disabled={!bulkAction || (bulkAction === "updateCategory" && !bulkCategoryId)}
              >
                Executar Ação
              </GlassButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl bg-slate-900/95 backdrop-blur-md border-slate-700/50">
          <DialogHeader>
            <DialogTitle className="text-slate-200">Importar Produtos</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="bg-blue-500/10 border-blue-500/30 backdrop-blur-md">
              <AlertDescription className="text-blue-400">
                <strong>Formato esperado (CSV):</strong>
                <br />
                name,description,price,cost_price,stock_quantity,min_stock_level,category_id,barcode,sku,image_url
              </AlertDescription>
            </Alert>

            <div>
              <Label className="text-slate-300 mb-2 block">Arquivo CSV</Label>
              <input
                type="file"
                accept=".csv"
                className="w-full p-2 bg-slate-800/30 backdrop-blur-md border border-slate-600/40 rounded-lg text-slate-100"
                onChange={(e) => {
                  // Handle file upload logic here
                  console.log("File selected:", e.target.files?.[0])
                }}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <GlassButton variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancelar
              </GlassButton>
              <GlassButton>Importar</GlassButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
