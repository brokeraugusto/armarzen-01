"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Package, Plus, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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
    } catch (error) {
      console.error("Error processing stock movement:", error)
      alert("Erro ao processar movimentação de estoque")
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando estoque...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Package className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold">Controle de Estoque</h1>
              </div>
            </div>

            <Dialog open={showMovementForm} onOpenChange={setShowMovementForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Movimentação
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Movimentação de Estoque</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleStockMovement} className="space-y-4">
                  <div>
                    <Label htmlFor="product">Produto *</Label>
                    <Select
                      value={movementForm.product_id}
                      onValueChange={(value) => setMovementForm({ ...movementForm, product_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} (Estoque: {product.stock_quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="movement_type">Tipo de Movimentação *</Label>
                    <Select
                      value={movementForm.movement_type}
                      onValueChange={(value: "in" | "out" | "adjustment") =>
                        setMovementForm({ ...movementForm, movement_type: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">Entrada</SelectItem>
                        <SelectItem value="out">Saída</SelectItem>
                        <SelectItem value="adjustment">Ajuste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quantity">
                      {movementForm.movement_type === "adjustment" ? "Nova Quantidade" : "Quantidade"} *
                    </Label>
                    <Input
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
                    <Label htmlFor="reason">Motivo *</Label>
                    <Textarea
                      id="reason"
                      value={movementForm.reason}
                      onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                      placeholder="Descreva o motivo da movimentação..."
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowMovementForm(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Registrar Movimentação</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Alertas de Estoque */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {lowStockProducts.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-800">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Estoque Baixo ({lowStockProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {lowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-2 bg-white rounded">
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-gray-600">
                          Atual: {product.stock_quantity} | Mín: {product.min_stock_level}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => openStockAdjustment(product)}>
                        Repor
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {outOfStockProducts.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center text-red-800">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Sem Estoque ({outOfStockProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {outOfStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-2 bg-white rounded">
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-red-600">Produto esgotado</p>
                      </div>
                      <Button size="sm" onClick={() => openStockAdjustment(product)}>
                        Repor
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabela de Produtos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Produtos em Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Estoque Atual</TableHead>
                  <TableHead>Estoque Mínimo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 relative bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={product.image_url || `/placeholder.svg?height=40&width=40`}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-600">R$ {product.price.toFixed(2)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.category?.name || "Sem categoria"}</TableCell>
                    <TableCell>
                      <span
                        className={`font-bold ${
                          product.stock_quantity === 0
                            ? "text-red-600"
                            : product.stock_quantity <= product.min_stock_level
                              ? "text-orange-600"
                              : "text-green-600"
                        }`}
                      >
                        {product.stock_quantity}
                      </span>
                    </TableCell>
                    <TableCell>{product.min_stock_level}</TableCell>
                    <TableCell>
                      {product.stock_quantity === 0 ? (
                        <Badge variant="destructive">Esgotado</Badge>
                      ) : product.stock_quantity <= product.min_stock_level ? (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          Baixo
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Normal
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openStockAdjustment(product)}>
                        Ajustar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Histórico de Movimentações */}
        <Card>
          <CardHeader>
            <CardTitle>Últimas Movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{new Date(movement.created_at).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 relative bg-gray-100 rounded overflow-hidden">
                          <Image
                            src={movement.product?.image_url || `/placeholder.svg?height=32&width=32`}
                            alt={movement.product?.name || "Produto"}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span>{movement.product?.name || "Produto não encontrado"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {movement.movement_type === "in" ? (
                          <>
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Entrada
                            </Badge>
                          </>
                        ) : movement.movement_type === "out" ? (
                          <>
                            <TrendingDown className="w-4 h-4 text-red-600" />
                            <Badge variant="destructive">Saída</Badge>
                          </>
                        ) : (
                          <>
                            <Package className="w-4 h-4 text-blue-600" />
                            <Badge variant="secondary">Ajuste</Badge>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-medium ${
                          movement.movement_type === "in"
                            ? "text-green-600"
                            : movement.movement_type === "out"
                              ? "text-red-600"
                              : "text-blue-600"
                        }`}
                      >
                        {movement.movement_type === "in" ? "+" : movement.movement_type === "out" ? "-" : ""}
                        {movement.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{movement.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {movements.length === 0 && (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Nenhuma movimentação registrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
