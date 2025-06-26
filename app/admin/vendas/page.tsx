"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Sale, SaleItem } from "@/lib/types"
import { GlassButton } from "@/components/ui/glass-button"
import { GlassCard } from "@/components/ui/glass-card"
import { GlassInput } from "@/components/ui/glass-input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Eye, Search, Download, Loader2, ShoppingCart } from "lucide-react"
import Link from "next/link"

interface SaleWithItems extends Sale {
  sale_items: (SaleItem & {
    product: {
      name: string
      image_url?: string
    }
  })[]
}

export default function VendasAdmin() {
  const [sales, setSales] = useState<SaleWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSale, setSelectedSale] = useState<SaleWithItems | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          sale_items(
            *,
            product:products(name, image_url)
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      setSales(data || [])
    } catch (error) {
      console.error("Error fetching sales:", error)
      setError("Erro ao carregar vendas")
      setTimeout(() => setError(""), 3000)
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = sales.filter(
    (sale) =>
      sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer_phone?.includes(searchTerm),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Aprovado</Badge>
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "credit_card":
        return "Cartão de Crédito"
      case "debit_card":
        return "Cartão de Débito"
      case "pix":
        return "PIX"
      case "cash":
        return "Dinheiro"
      default:
        return method
    }
  }

  const viewSaleDetails = (sale: SaleWithItems) => {
    setSelectedSale(sale)
    setShowDetails(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-300">Carregando vendas...</p>
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
                <h1 className="text-2xl font-bold text-slate-200">Histórico de Vendas</h1>
              </div>

              <GlassButton variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/30 backdrop-blur-md">
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {/* Filtros */}
        <GlassCard className="p-4 mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <GlassInput
              type="text"
              placeholder="Buscar por número, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </GlassCard>

        {/* Tabela de Vendas */}
        <GlassCard>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">Vendas ({filteredSales.length})</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700/50">
                    <TableHead className="text-slate-300">Número</TableHead>
                    <TableHead className="text-slate-300">Data</TableHead>
                    <TableHead className="text-slate-300">Cliente</TableHead>
                    <TableHead className="text-slate-300">Valor</TableHead>
                    <TableHead className="text-slate-300">Pagamento</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id} className="border-slate-700/30 hover:bg-slate-800/20">
                      <TableCell className="font-medium text-slate-200">{sale.sale_number}</TableCell>
                      <TableCell className="text-slate-300">
                        {new Date(sale.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <div>
                          {sale.customer_email && <p className="text-sm text-slate-300">{sale.customer_email}</p>}
                          {sale.customer_phone && <p className="text-sm text-slate-400">{sale.customer_phone}</p>}
                          {!sale.customer_email && !sale.customer_phone && (
                            <span className="text-slate-500">Cliente não informado</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-green-400">R$ {sale.total_amount.toFixed(2)}</TableCell>
                      <TableCell className="text-slate-300">{getPaymentMethodLabel(sale.payment_method)}</TableCell>
                      <TableCell>{getStatusBadge(sale.payment_status)}</TableCell>
                      <TableCell>
                        <GlassButton size="sm" variant="outline" onClick={() => viewSaleDetails(sale)}>
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </GlassButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredSales.length === 0 && (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                  <p className="text-slate-400">
                    {searchTerm ? "Nenhuma venda encontrada" : "Nenhuma venda registrada"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Modal de Detalhes da Venda */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-md border-slate-700/50">
            <DialogHeader>
              <DialogTitle className="text-slate-200">Detalhes da Venda - {selectedSale?.sale_number}</DialogTitle>
            </DialogHeader>

            {selectedSale && (
              <div className="space-y-6">
                {/* Informações da Venda */}
                <div className="grid grid-cols-2 gap-4">
                  <GlassCard variant="subtle" className="p-4">
                    <h4 className="font-semibold mb-2 text-slate-200">Informações Gerais</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-slate-300">
                        <strong>Número:</strong> {selectedSale.sale_number}
                      </p>
                      <p className="text-slate-300">
                        <strong>Data:</strong> {new Date(selectedSale.created_at).toLocaleString("pt-BR")}
                      </p>
                      <p className="text-slate-300">
                        <strong>Status:</strong> {getStatusBadge(selectedSale.payment_status)}
                      </p>
                      <p className="text-slate-300">
                        <strong>Pagamento:</strong> {getPaymentMethodLabel(selectedSale.payment_method)}
                      </p>
                      {selectedSale.mercadopago_payment_id && (
                        <p className="text-slate-300">
                          <strong>ID Mercado Pago:</strong> {selectedSale.mercadopago_payment_id}
                        </p>
                      )}
                    </div>
                  </GlassCard>

                  <GlassCard variant="subtle" className="p-4">
                    <h4 className="font-semibold mb-2 text-slate-200">Cliente</h4>
                    <div className="space-y-1 text-sm">
                      {selectedSale.customer_email ? (
                        <p className="text-slate-300">
                          <strong>Email:</strong> {selectedSale.customer_email}
                        </p>
                      ) : (
                        <p className="text-slate-500">Email não informado</p>
                      )}
                      {selectedSale.customer_phone ? (
                        <p className="text-slate-300">
                          <strong>Telefone:</strong> {selectedSale.customer_phone}
                        </p>
                      ) : (
                        <p className="text-slate-500">Telefone não informado</p>
                      )}
                    </div>
                  </GlassCard>
                </div>

                {/* Itens da Venda */}
                <GlassCard variant="subtle" className="p-4">
                  <h4 className="font-semibold mb-3 text-slate-200">Itens da Venda</h4>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700/50">
                        <TableHead className="text-slate-300">Produto</TableHead>
                        <TableHead className="text-slate-300">Qtd</TableHead>
                        <TableHead className="text-slate-300">Preço Unit.</TableHead>
                        <TableHead className="text-slate-300">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSale.sale_items.map((item) => (
                        <TableRow key={item.id} className="border-slate-700/30">
                          <TableCell className="text-slate-300">{item.product.name}</TableCell>
                          <TableCell className="text-slate-300">{item.quantity}</TableCell>
                          <TableCell className="text-slate-300">R$ {item.unit_price.toFixed(2)}</TableCell>
                          <TableCell className="font-medium text-slate-200">R$ {item.total_price.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </GlassCard>

                {/* Total */}
                <GlassCard variant="subtle" className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-slate-200">Total da Venda:</span>
                    <span className="text-2xl font-bold text-green-400">R$ {selectedSale.total_amount.toFixed(2)}</span>
                  </div>
                </GlassCard>

                {/* Observações */}
                {selectedSale.notes && (
                  <GlassCard variant="subtle" className="p-4">
                    <h4 className="font-semibold mb-2 text-slate-200">Observações</h4>
                    <p className="text-sm text-slate-300">{selectedSale.notes}</p>
                  </GlassCard>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
