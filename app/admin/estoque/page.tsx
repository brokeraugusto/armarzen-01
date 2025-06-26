"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/lib/types"
import { GlassButton } from "@/components/ui/glass-button"
import { GlassCard } from "@/components/ui/glass-card"
import { GlassInput } from "@/components/ui/glass-input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Package, Plus, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Icons } from "@/components/icons"

interface StockMovement {
  id: string
  product_id: string
  movement_type: "in" | "out" | "adjustment"
  quantity: number
  reason: string
  created_at: string
  product?: Product
}

export default function EstoqueAdmin() {
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [showMovementForm, setShowMovementForm] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const [movementForm, setMovementForm] = useState({
    product_id: "",
    movement_type: "in" as "in" | "out" | "adjustment",
    quantity: 0,
    reason: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productsResponse, movementsResponse] = await Promise.all([
        supabase
          .from("products")
          .select(`
          *,
          category:categories(*)
        `)
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("stock_movements")
          .select(`
          *,
          product:products(name, image_url)
        `)
          .order("created_at", { ascending: false })
          .limit(50),
      ])

      setProducts(productsResponse.data || [])
      setMovements(movementsResponse.data || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Erro ao carregar dados do estoque")
      setTimeout(() => setError(""), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleStockMovement = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Registrar movimentação
      const { error: movementError } = await supabase.from("stock_movements").insert([movementForm])

      if (movementError) throw movementError

      // Atualizar estoque do produto
      const product = products.find((p) => p.id === movementForm.product_id)
      if (!product) throw new Error("Produto não encontrado")

      let newStock = product.stock_quantity

      switch (movementForm.movement_type) {
        case "in":
          newStock += movementForm.quantity
          break
        case "out":
          newStock -= movementForm.quantity
          break
        case "adjustment":
          newStock = movementForm.quantity
          break
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({
          stock_quantity: Math.max(0, newStock),
          updated_at: new Date().toISOString(),
        })
        .eq("id", movementForm.product_id)

      if (updateError) throw updateError

      // Resetar formulário e recarregar dados
      setMovementForm({
        product_id: "",
        movement_type: "in",
        quantity: 0,
        reason: "",
      })
      setShowMovementForm(false)
      await fetchData()
      setSuccess("Movimentação registrada com sucesso!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Error processing stock movement:", error)
      setError("Erro ao processar movimentação de estoque")
      setTimeout(() => setError(""), 3000)
    }
  }

  const lowStockProducts = products.filter((p) => p.stock_quantity <= p.min_stock_level)
  const outOfStockProducts = products.filter((p) => p.stock_quantity === 0)

  const openStockAdjustment = (product: Product) => {
    setSelectedProduct(product)
    setMovementForm({
      product_id: product.id,
      movement_type: "adjustment",
      quantity: product.stock_quantity,
      reason: "Ajuste de estoque",
    })
    setShowMovementForm(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <Icons.loader className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-300">Carregando estoque...</p>
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
                  <h1 className="text-2xl font-bold text-slate-200">Controle de Estoque</h1>
                </div>
              </div>

              <Dialog open={showMovementForm} onOpenChange={setShowMovementForm}>
                <DialogTrigger asChild>
                  <GlassButton>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Movimentação
                  </GlassButton>
                </DialogTrigger>
                <DialogContent className="bg-slate-900/95 backdrop-blur-md border-slate-700/50">
                  <DialogHeader>
                    <DialogTitle className="text-slate-200">Movimentação de Estoque</DialogTitle>
                  </DialogHeader>

                  <form onSubmit={handleStockMovement} className="space-y-4">
                    <div>
                      <Label htmlFor="product" className="text-slate-300">
                        Produto *
                      </Label>
                      <Select
                        value={movementForm.product_id}
                        onValueChange={(value) => setMovementForm({ ...movementForm, product_id: value })}
                        required
                      >
                        <SelectTrigger className="bg-slate-800/30 backdrop-blur-md border-slate-600/40 text-slate-100">
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900/95 backdrop-blur-md border-slate-700/50">
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id} className="text-slate-200">
                              {product.name} (Estoque: {product.stock_quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="movement_type" className="text-slate-300">
                        Tipo de Movimentação *
                      </Label>
                      <Select
                        value={movementForm.movement_type}
                        onValueChange={(value: "in" | "out" | "adjustment") =>
                          setMovementForm({ ...movementForm, movement_type: value })
                        }
                        required
                      >
                        <SelectTrigger className="bg-slate-800/30 backdrop-blur-md border-slate-600/40 text-slate-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900/95 backdrop-blur-md border-slate-700/50">
                          <SelectItem value="in" className="text-slate-200">
                            Entrada
                          </SelectItem>
                          <SelectItem value="out" className="text-slate-200">
                            Saída
                          </SelectItem>
                          <SelectItem value="adjustment" className="text-slate-200">
                            Ajuste
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="quantity" className="text-slate-300">
                        {movementForm.movement_type === "adjustment" ? "Nova Quantidade" : "Quantidade"} *
                      </Label>
                      <GlassInput
                        id="quantity"
                        type="number"
                        min="0"
                        value={movementForm.quantity}
                        onChange={(e) =>
                          setMovementForm({ ...movementForm, quantity: Number.parseInt(e.target.value) || 0 })
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="reason" className="text-slate-300">
                        Motivo *
                      </Label>
                      <Textarea
                        id="reason"
                        value={movementForm.reason}
                        onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                        placeholder="Descreva o motivo da movimentação..."
                        className="bg-slate-800/30 backdrop-blur-md border-slate-600/40 text-slate-100 placeholder:text-slate-400"
                        required
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <GlassButton type="button" variant="outline" onClick={() => setShowMovementForm(false)}>
                        Cancelar
                      </GlassButton>
                      <GlassButton type="submit">Registrar Movimentação</GlassButton>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
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

        {/* Alertas de Estoque */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {lowStockProducts.length > 0 && (
            <GlassCard className="border-orange-500/30 p-4">
              <div className="flex items-center mb-3">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-400" />
                <h3 className="font-semibold text-orange-300">Estoque Baixo ({lowStockProducts.length})</h3>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {lowStockProducts.map((product) => (
                  <GlassCard key={product.id} variant="subtle" className="p-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-slate-200">{product.name}</p>
                        <p className="text-xs text-slate-400">
                          Atual: {product.stock_quantity} | Mín: {product.min_stock_level}
                        </p>
                      </div>
                      <GlassButton size="sm" onClick={() => openStockAdjustment(product)}>
                        Repor
                      </GlassButton>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </GlassCard>
          )}

          {outOfStockProducts.length > 0 && (
            <GlassCard className="border-red-500/30 p-4">
              <div className="flex items-center mb-3">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
                <h3 className="font-semibold text-red-300">Sem Estoque ({outOfStockProducts.length})</h3>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {outOfStockProducts.map((product) => (
                  <GlassCard key={product.id} variant="subtle" className="p-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-slate-200">{product.name}</p>
                        <p className="text-xs text-red-400">Produto esgotado</p>
                      </div>
                      <GlassButton size="sm" onClick={() => openStockAdjustment(product)}>
                        Repor
                      </GlassButton>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </GlassCard>
          )}
        </div>

        {/* Tabela de Produtos */}
        <GlassCard className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">Produtos em Estoque</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700/50">
                    <TableHead className="text-slate-300">Produto</TableHead>
                    <TableHead className="text-slate-300">Categoria</TableHead>
                    <TableHead className="text-slate-300">Estoque Atual</TableHead>
                    <TableHead className="text-slate-300">Estoque Mínimo</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} className="border-slate-700/30 hover:bg-slate-800/20">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 relative bg-slate-800/30 rounded-lg overflow-hidden">
                            <Image
                              src={product.image_url || `/placeholder.svg?height=40&width=40`}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-slate-200">{product.name}</p>
                            <p className="text-sm text-slate-400">R$ {product.price.toFixed(2)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">{product.category?.name || "Sem categoria"}</TableCell>
                      <TableCell>
                        <span
                          className={`font-bold ${
                            product.stock_quantity === 0
                              ? "text-red-400"
                              : product.stock_quantity <= product.min_stock_level
                                ? "text-orange-400"
                                : "text-green-400"
                          }`}
                        >
                          {product.stock_quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-300">{product.min_stock_level}</TableCell>
                      <TableCell>
                        {product.stock_quantity === 0 ? (
                          <Badge variant="destructive">Esgotado</Badge>
                        ) : product.stock_quantity <= product.min_stock_level ? (
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Baixo</Badge>
                        ) : (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Normal</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <GlassButton size="sm" variant="outline" onClick={() => openStockAdjustment(product)}>
                          Ajustar
                        </GlassButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </GlassCard>

        {/* Histórico de Movimentações */}
        <GlassCard>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">Últimas Movimentações</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700/50">
                    <TableHead className="text-slate-300">Data</TableHead>
                    <TableHead className="text-slate-300">Produto</TableHead>
                    <TableHead className="text-slate-300">Tipo</TableHead>
                    <TableHead className="text-slate-300">Quantidade</TableHead>
                    <TableHead className="text-slate-300">Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id} className="border-slate-700/30 hover:bg-slate-800/20">
                      <TableCell className="text-slate-300">
                        {new Date(movement.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 relative bg-slate-800/30 rounded overflow-hidden">
                            <Image
                              src={movement.product?.image_url || `/placeholder.svg?height=32&width=32`}
                              alt={movement.product?.name || "Produto"}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span className="text-slate-300">{movement.product?.name || "Produto não encontrado"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {movement.movement_type === "in" ? (
                            <>
                              <TrendingUp className="w-4 h-4 text-green-400" />
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Entrada</Badge>
                            </>
                          ) : movement.movement_type === "out" ? (
                            <>
                              <TrendingDown className="w-4 h-4 text-red-400" />
                              <Badge variant="destructive">Saída</Badge>
                            </>
                          ) : (
                            <>
                              <Package className="w-4 h-4 text-blue-400" />
                              <Badge variant="secondary">Ajuste</Badge>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-medium ${
                            movement.movement_type === "in"
                              ? "text-green-400"
                              : movement.movement_type === "out"
                                ? "text-red-400"
                                : "text-blue-400"
                          }`}
                        >
                          {movement.movement_type === "in" ? "+" : movement.movement_type === "out" ? "-" : ""}
                          {movement.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-slate-300">{movement.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {movements.length === 0 && (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                  <p className="text-slate-400">Nenhuma movimentação registrada</p>
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
